import { NextApiRequest, NextApiResponse } from 'next';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken, createUserSession } from '../../../lib/auth/tokens';
import { setAuthCookies, clearAuthCookies } from '../../../lib/auth/cookies';

interface TestResponse {
  success: boolean;
  message: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  verificationResult?: any;
  timestamp: string;
}

export default async function testTokensHandler(req: NextApiRequest, res: NextApiResponse<TestResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Create a mock user session
    const mockUserSession = createUserSession({
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      tokenVersion: 0,
    });

    // Generate token pair
    const tokenPair = generateTokenPair(mockUserSession);

    // Verify the generated tokens
    const accessTokenPayload = verifyAccessToken(tokenPair.accessToken);
    const refreshTokenPayload = verifyRefreshToken(tokenPair.refreshToken);

    // Set HTTP-only cookies
    setAuthCookies(res, tokenPair.accessToken, tokenPair.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token generation and verification successful',
      tokens: tokenPair,
      verificationResult: {
        accessToken: {
          userId: accessTokenPayload.userId,
          email: accessTokenPayload.email,
          role: accessTokenPayload.role,
          type: accessTokenPayload.type,
        },
        refreshToken: {
          userId: refreshTokenPayload.userId,
          tokenVersion: refreshTokenPayload.tokenVersion,
          type: refreshTokenPayload.type,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Token test error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Token test failed',
      timestamp: new Date().toISOString(),
    });
  }
}