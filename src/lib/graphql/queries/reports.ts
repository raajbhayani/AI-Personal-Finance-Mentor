import { gql } from '@apollo/client';

export const GET_MONTHLY_REPORT = gql`
  query GetMonthlyReport($year: Int!, $month: Int!) {
    getMonthlyReport(year: $year, month: $month) {
      id
      userId
      year
      month
      totalIncome
      totalExpenses
      netIncome
      savingsRate
      budgetAdherence
      categoryBreakdown {
        category
        amount
        percentage
        transactionCount
        previousAmount
        change
      }
      spendingTrends {
        date
        amount
        category
      }
      budgetComparison {
        category
        budgeted
        actual
        variance
        variancePercentage
      }
      achievements {
        id
        type
        title
        description
        amount
        date
        goalId
      }
      recommendations {
        id
        type
        title
        description
        priority
        category
      }
      generatedAt
    }
  }
`;

export const GET_MONTHLY_REPORTS = gql`
  query GetMonthlyReports($year: Int) {
    getMonthlyReports(year: $year) {
      id
      userId
      year
      month
      totalIncome
      totalExpenses
      netIncome
      savingsRate
      budgetAdherence
      categoryBreakdown {
        category
        amount
        percentage
        transactionCount
        previousAmount
        change
      }
      spendingTrends {
        date
        amount
        category
      }
      budgetComparison {
        category
        budgeted
        actual
        variance
        variancePercentage
      }
      achievements {
        id
        type
        title
        description
        amount
        date
        goalId
      }
      recommendations {
        id
        type
        title
        description
        priority
        category
      }
      generatedAt
    }
  }
`;

export const GET_CATEGORY_STATS = gql`
  query GetCategoryStats(
    $dateFrom: Date
    $dateTo: Date
    $type: TransactionType
  ) {
    getCategoryStats(
      dateFrom: $dateFrom
      dateTo: $dateTo
      type: $type
    ) {
      category
      totalAmount
      transactionCount
      averageAmount
      percentage
    }
  }
`;

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

export const GENERATE_MONTHLY_REPORT = gql`
  mutation GenerateMonthlyReport($year: Int!, $month: Int!) {
    generateMonthlyReport(year: $year, month: $month) {
      id
      userId
      year
      month
      totalIncome
      totalExpenses
      netIncome
      savingsRate
      budgetAdherence
      categoryBreakdown {
        category
        amount
        percentage
        transactionCount
        previousAmount
        change
      }
      spendingTrends {
        date
        amount
        category
      }
      budgetComparison {
        category
        budgeted
        actual
        variance
        variancePercentage
      }
      achievements {
        id
        type
        title
        description
        amount
        date
        goalId
      }
      recommendations {
        id
        type
        title
        description
        priority
        category
      }
      generatedAt
    }
  }
`;