import { NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '../../lib/auth/middleware';

interface TestResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  timestamp: string;
}

async function testAuthHandler(req: AuthenticatedRequest, res: NextApiResponse<TestResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Authentication successful',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
}

export default requireAuth(testAuthHandler);