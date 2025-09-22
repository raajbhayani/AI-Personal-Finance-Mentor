import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/User';
import { verifyRefreshToken, generateTokenPair, createUserSession } from '../../../lib/auth/tokens';
import { getAuthCookies, setAuthCookies, clearAuthCookies } from '../../../lib/auth/cookies';
import { withCORS } from '../../../lib/auth/middleware';
import connectToDatabase from '../../../lib/database/mongodb';

interface RefreshResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

async function refreshHandler(req: NextApiRequest, res: NextApiResponse<RefreshResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Get refresh token from cookies
    const { refreshToken } = getAuthCookies(req);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      // Clear invalid cookies
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Get user from database
    const user = await User.findById(payload.userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user account is still active
    if (user.isSuspended || user.isDeleted) {
      clearAuthCookies(res);
      return res.status(403).json({
        success: false,
        message: 'Account is no longer active',
      });
    }

    // Check token version to ensure token hasn't been invalidated
    const currentTokenVersion = user.tokenVersion || 0;
    if (payload.tokenVersion !== currentTokenVersion) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please log in again.',
      });
    }

    // Create user session
    const userSession = createUserSession(user);

    // Generate new token pair
    const newTokenPair = generateTokenPair(userSession);

    // Set new HTTP-only cookies
    setAuthCookies(res, newTokenPair.accessToken, newTokenPair.refreshToken);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens: newTokenPair,
    });
  } catch (error) {
    console.error('Token refresh error:', error);

    // Clear cookies on any error
    clearAuthCookies(res);

    return res.status(500).json({
      success: false,
      message: 'Failed to refresh tokens',
    });
  }
}

export default withCORS(refreshHandler);