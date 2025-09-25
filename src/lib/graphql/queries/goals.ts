import { gql } from '@apollo/client';

export const GET_GOALS = gql`
  query GetGoals(
    $filters: GoalFiltersInput
    $limit: Int = 20
    $offset: Int = 0
    $sortBy: String = "createdAt"
    $sortOrder: String = "DESC"
  ) {
    getGoals(
      filters: $filters
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges {
        node {
          id
          title
          description
          targetAmount
          currentAmount
          targetDate
          category
          priority
          isRecurring
          reminderFrequency
          createdAt
          updatedAt
          progressPercentage
          remainingAmount
          isCompleted
          daysRemaining
          monthlySavingsNeeded
          milestones {
            id
            amount
            date
            description
            isAchieved
            createdAt
          }
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

export const GET_GOAL = gql`
  query GetGoal($id: ID!) {
    getGoal(id: $id) {
      id
      title
      description
      targetAmount
      currentAmount
      targetDate
      category
      priority
      isRecurring
      reminderFrequency
      createdAt
      updatedAt
      progressPercentage
      remainingAmount
      isCompleted
      daysRemaining
      monthlySavingsNeeded
      milestones {
        id
        amount
        date
        description
        isAchieved
        createdAt
      }
    }
  }
`;

export const SEARCH_GOALS = gql`
  query SearchGoals($query: String!, $limit: Int = 10) {
    searchGoals(query: $query, limit: $limit) {
      id
      title
      description
      targetAmount
      currentAmount
      targetDate
      category
      priority
      isRecurring
      progressPercentage
      isCompleted
    }
  }
`;

export const ADD_GOAL = gql`
  mutation AddGoal($input: GoalInput!) {
    addGoal(input: $input) {
      id
      title
      description
      targetAmount
      currentAmount
      targetDate
      category
      priority
      isRecurring
      reminderFrequency
      createdAt
      updatedAt
      progressPercentage
      remainingAmount
      isCompleted
      daysRemaining
      monthlySavingsNeeded
      milestones {
        id
        amount
        date
        description
        isAchieved
        createdAt
      }
    }
  }
`;

export const UPDATE_GOAL = gql`
  mutation UpdateGoal($id: ID!, $input: UpdateGoalInput!) {
    updateGoal(id: $id, input: $input) {
      id
      title
      description
      targetAmount
      currentAmount
      targetDate
      category
      priority
      isRecurring
      reminderFrequency
      createdAt
      updatedAt
      progressPercentage
      remainingAmount
      isCompleted
      daysRemaining
      monthlySavingsNeeded
      milestones {
        id
        amount
        date
        description
        isAchieved
        createdAt
      }
    }
  }
`;

export const DELETE_GOAL = gql`
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id)
  }
`;

export const ADD_GOAL_PROGRESS = gql`
  mutation AddGoalProgress($id: ID!, $amount: Currency!, $description: String) {
    addGoalProgress(id: $id, amount: $amount, description: $description) {
      id
      title
      description
      targetAmount
      currentAmount
      targetDate
      category
      priority
      isRecurring
      reminderFrequency
      createdAt
      updatedAt
      progressPercentage
      remainingAmount
      isCompleted
      daysRemaining
      monthlySavingsNeeded
      milestones {
        id
        amount
        date
        description
        isAchieved
        createdAt
      }
    }
  }
`;