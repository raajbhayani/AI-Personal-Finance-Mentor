import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/User';
import { verifyRefreshToken } from '../../../lib/auth/tokens';
import { getAuthCookies, clearAuthCookies } from '../../../lib/auth/cookies';
import { withCORS } from '../../../lib/auth/middleware';
import connectToDatabase from '../../../lib/database/mongodb';

interface LogoutResponse {
  success: boolean;
  message: string;
}

async function logoutHandler(req: NextApiRequest, res: NextApiResponse<LogoutResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Get tokens from cookies
    const { refreshToken } = getAuthCookies(req);

    if (refreshToken) {
      try {
        // Verify refresh token to get user info
        const payload = verifyRefreshToken(refreshToken);

        // Increment token version to invalidate all existing tokens
        await User.findByIdAndUpdate(payload.userId, {
          $inc: { tokenVersion: 1 },
        });
      } catch (error) {
        // Token might be invalid or expired, but we still want to clear cookies
        console.log('Refresh token verification failed during logout:', error.message);
      }
    }

    // Clear all authentication cookies
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);

    // Still clear cookies even if there's an error
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

export default withCORS(logoutHandler);