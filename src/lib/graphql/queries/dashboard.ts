import { gql } from '@apollo/client';

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      totalBalance
      monthlyIncome
      monthlyExpenses
      savingsRate
      activeGoals
      completedGoals
      budgetAdherence
      topSpendingCategory
    }
  }
`;

export const GET_RECENT_TRANSACTIONS = gql`
  query GetRecentTransactions($limit: Int = 5) {
    getTransactions(limit: $limit, sortBy: "date", sortOrder: "DESC") {
      transactions {
        id
        description
        amount
        type
        category
        date
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      name
      email
      preferredCurrency
      settings {
        notifications
        dashboardLayout
        privacy
      }
    }
  }
`;

export const GET_ACTIVE_GOALS = gql`
  query GetActiveGoals($limit: Int = 3) {
    getGoals(filters: { status: "active" }, limit: $limit) {
      goals {
        id
        title
        targetAmount
        currentAmount
        targetDate
        status
        priority
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_ACTIVE_BUDGETS = gql`
  query GetActiveBudgets {
    getBudgets(filters: { status: "active" }) {
      budgets {
        id
        category
        amount
        spent
        period
        startDate
        endDate
        status
      }
      totalCount
    }
  }
`;