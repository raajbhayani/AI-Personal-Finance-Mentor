import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/User';
import { hashPassword } from '../../../lib/auth/bcrypt';
import { validateEmail, validatePassword } from '../../../lib/utils/validation';
import { generateTokenPair, createUserSession } from '../../../lib/auth/tokens';
import { setAuthCookies } from '../../../lib/auth/cookies';
import { withCORS } from '../../../lib/auth/middleware';
import connectToDatabase from '../../../lib/database/mongodb';

interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms?: boolean;
}

interface SignupResponse {
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

async function signupHandler(req: NextApiRequest, res: NextApiResponse<SignupResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    // Connect to database
    await connectToDatabase();

    const { firstName, lastName, email, password, acceptTerms }: SignupRequest = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate terms acceptance
    if (!acceptTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the terms and conditions',
      });
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'USER',
      tokenVersion: 0,
      isEmailVerified: false,
      preferences: {
        currency: 'USD',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          budgetAlerts: true,
          goalReminders: true,
        },
        privacy: {
          dataSharing: false,
          analytics: true,
        },
      },
    });

    await newUser.save();

    // Create user session
    const userSession = createUserSession(newUser);

    // Generate tokens
    const tokenPair = generateTokenPair(userSession);

    // Set HTTP-only cookies
    setAuthCookies(res, tokenPair.accessToken, tokenPair.refreshToken);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      tokens: tokenPair,
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
    });
  }
}

export default withCORS(signupHandler);