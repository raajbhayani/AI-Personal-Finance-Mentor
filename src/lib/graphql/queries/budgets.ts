import { gql } from '@apollo/client';

export const GET_BUDGETS = gql`
  query GetBudgets(
    $filters: BudgetFiltersInput
    $limit: Int = 20
    $offset: Int = 0
    $sortBy: String = "createdAt"
    $sortOrder: String = "DESC"
  ) {
    getBudgets(
      filters: $filters
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges {
        node {
          id
          name
          description
          totalBudget
          totalSpent
          totalRemaining
          period
          startDate
          endDate
          status
          alertThreshold
          categories {
            category
            budgetedAmount
            spentAmount
            remaining
            percentageUsed
          }
          notifications {
            enabled
            thresholds
            lastNotified
          }
          tags
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_BUDGET = gql`
  query GetBudget($id: ID!) {
    getBudget(id: $id) {
      id
      name
      description
      totalBudget
      totalSpent
      totalRemaining
      period
      startDate
      endDate
      status
      alertThreshold
      categories {
        category
        budgetedAmount
        spentAmount
        remaining
        percentageUsed
      }
      notifications {
        enabled
        thresholds
        lastNotified
      }
      tags
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_BUDGETS = gql`
  query GetActiveBudgets {
    getActiveBudgets {
      id
      name
      description
      totalBudget
      totalSpent
      totalRemaining
      period
      startDate
      endDate
      status
      categories {
        category
        budgetedAmount
        spentAmount
        remaining
        percentageUsed
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_BUDGET_COMPARISON = gql`
  query GetBudgetComparison($budgetId: ID!, $period: String!) {
    getBudgetComparison(budgetId: $budgetId, period: $period) {
      budgetId
      period
      categories {
        category
        budgeted
        actual
        variance
        variancePercentage
        status
      }
      totals {
        totalBudgeted
        totalActual
        totalVariance
        variancePercentage
      }
      insights {
        overBudgetCategories
        underBudgetCategories
        biggestOverspend {
          category
          amount
          percentage
        }
        biggestUnderspend {
          category
          amount
          percentage
        }
        recommendations
      }
    }
  }
`;

export const ADD_BUDGET = gql`
  mutation AddBudget($input: BudgetInput!) {
    addBudget(input: $input) {
      id
      name
      description
      totalBudget
      totalSpent
      totalRemaining
      period
      startDate
      endDate
      status
      alertThreshold
      categories {
        category
        budgetedAmount
        spentAmount
        remaining
        percentageUsed
      }
      notifications {
        enabled
        thresholds
        lastNotified
      }
      tags
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BUDGET = gql`
  mutation UpdateBudget($id: ID!, $input: UpdateBudgetInput!) {
    updateBudget(id: $id, input: $input) {
      id
      name
      description
      totalBudget
      totalSpent
      totalRemaining
      period
      startDate
      endDate
      status
      alertThreshold
      categories {
        category
        budgetedAmount
        spentAmount
        remaining
        percentageUsed
      }
      notifications {
        enabled
        thresholds
        lastNotified
      }
      tags
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BUDGET = gql`
  mutation DeleteBudget($id: ID!) {
    deleteBudget(id: $id) {
      id
      name
    }
  }
`;

export const UPDATE_BUDGET_SPENDING = gql`
  mutation UpdateBudgetSpending($budgetId: ID!, $category: String!, $amount: Float!) {
    updateBudgetSpending(budgetId: $budgetId, category: $category, amount: $amount) {
      id
      categories {
        category
        budgetedAmount
        spentAmount
        remaining
        percentageUsed
      }
      totalSpent
      totalRemaining
      status
    }
  }
`;

export const GET_BUDGET_ANALYTICS = gql`
  query GetBudgetAnalytics($period: String!, $startDate: String!, $endDate: String!) {
    getBudgetAnalytics(period: $period, startDate: $startDate, endDate: $endDate) {
      period
      totalBudgeted
      totalSpent
      totalRemaining
      overallPerformance
      categoryPerformance {
        category
        budgeted
        spent
        variance
        trend
      }
      trends {
        month
        budgeted
        actual
        variance
      }
      insights {
        topOverspendCategories
        topUnderspendCategories
        averageVariance
        improvementSuggestions
      }
    }
  }
`;

export const DUPLICATE_BUDGET = gql`
  mutation DuplicateBudget($id: ID!, $input: DuplicateBudgetInput!) {
    duplicateBudget(id: $id, input: $input) {
      id
      name
      description
      totalBudget
      period
      startDate
      endDate
      categories {
        category
        budgetedAmount
      }
      createdAt
    }
  }
`;