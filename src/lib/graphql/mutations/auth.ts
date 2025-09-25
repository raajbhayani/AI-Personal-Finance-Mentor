import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        firstName
        lastName
        email
        fullName
        role
        currency
        timezone
        dateOfBirth
        preferences {
          darkMode
          notifications {
            email
            push
            goalReminders
            budgetAlerts
            weeklyReports
            monthlyReports
          }
          privacy {
            shareDataForInsights
            allowMarketing
          }
        }
        createdAt
        updatedAt
        lastLoginAt
      }
      expiresAt
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      token
      user {
        id
        firstName
        lastName
        email
        fullName
        role
        currency
        timezone
        dateOfBirth
        preferences {
          darkMode
          notifications {
            email
            push
            goalReminders
            budgetAlerts
            weeklyReports
            monthlyReports
          }
          privacy {
            shareDataForInsights
            allowMarketing
          }
        }
        createdAt
        updatedAt
        lastLoginAt
      }
      expiresAt
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      token
      user {
        id
        firstName
        lastName
        email
        fullName
        role
        currency
        timezone
        dateOfBirth
        preferences {
          darkMode
          notifications {
            email
            push
            goalReminders
            budgetAlerts
            weeklyReports
            monthlyReports
          }
          privacy {
            shareDataForInsights
            allowMarketing
          }
        }
        createdAt
        updatedAt
        lastLoginAt
      }
      expiresAt
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      id
      firstName
      lastName
      email
      updatedAt
    }
  }
`;