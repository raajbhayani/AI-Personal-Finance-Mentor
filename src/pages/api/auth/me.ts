import { NextApiResponse } from 'next';
import { requireValidSession, AuthenticatedRequest } from '../../../lib/auth/middleware';
import { User } from '../../../models/User';

interface MeResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
    avatar?: string;
    preferences: {
      currency: string;
      language: string;
      timezone: string;
      notifications: {
        email: boolean;
        push: boolean;
        budgetAlerts: boolean;
        goalReminders: boolean;
      };
      privacy: {
        dataSharing: boolean;
        analytics: boolean;
      };
    };
    createdAt: string;
    lastLogin?: string;
  };
}

async function meHandler(req: AuthenticatedRequest, res: NextApiResponse<MeResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    // Get full user data from database
    const user = await User.findById(req.user.id).select('-password -tokenVersion');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User data retrieved successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user data',
    });
  }
}

export default requireValidSession(meHandler);