import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/User';
import { comparePassword } from '../../../lib/auth/bcrypt';
import { validateEmail } from '../../../lib/utils/validation';
import { generateTokenPair, createUserSession } from '../../../lib/auth/tokens';
import { setAuthCookies } from '../../../lib/auth/cookies';
import { withCORS, withRateLimit } from '../../../lib/auth/middleware';
import connectToDatabase from '../../../lib/database/mongodb';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

async function loginHandler(req: NextApiRequest, res: NextApiResponse<LoginResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    // Connect to database
    await connectToDatabase();

    const { email, password, rememberMe }: LoginRequest = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is suspended or deleted
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact support.',
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated.',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Create user session
    const userSession = createUserSession(user);

    // Generate tokens
    const tokenPair = generateTokenPair(userSession);

    // Set HTTP-only cookies
    setAuthCookies(res, tokenPair.accessToken, tokenPair.refreshToken);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: tokenPair,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
}

// Apply rate limiting to prevent brute force attacks
const rateLimitedHandler = withRateLimit(loginHandler, {
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
});

export default withCORS(rateLimitedHandler);