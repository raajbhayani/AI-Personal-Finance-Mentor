import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar Date
  scalar Upload

  # Custom scalars for better type safety
  scalar EmailAddress
  scalar Currency

  # Enums
  enum TransactionType {
    INCOME
    EXPENSE
  }

  enum TransactionStatus {
    COMPLETED
    PENDING
    FAILED
  }

  enum GoalPriority {
    LOW
    MEDIUM
    HIGH
  }

  enum GoalCategory {
    EMERGENCY_FUND
    VACATION
    HOUSE_DOWN_PAYMENT
    CAR_PURCHASE
    RETIREMENT
    EDUCATION
    DEBT_PAYOFF
    INVESTMENT
    WEDDING
    BUSINESS
    OTHER
  }

  enum ReminderFrequency {
    WEEKLY
    MONTHLY
    QUARTERLY
  }

  enum UserRole {
    USER
    PREMIUM
    ADMIN
  }

  # Input Types
  input SignupInput {
    firstName: String!
    lastName: String!
    email: EmailAddress!
    password: String!
    dateOfBirth: Date
    currency: String = "USD"
  }

  input LoginInput {
    email: EmailAddress!
    password: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    dateOfBirth: Date
    currency: String
    timezone: String
    preferences: UserPreferencesInput
  }

  input UserPreferencesInput {
    darkMode: Boolean
    notifications: NotificationPreferencesInput
    privacy: PrivacyPreferencesInput
  }

  input NotificationPreferencesInput {
    email: Boolean
    push: Boolean
    goalReminders: Boolean
    budgetAlerts: Boolean
    weeklyReports: Boolean
    monthlyReports: Boolean
  }

  input PrivacyPreferencesInput {
    shareDataForInsights: Boolean
    allowMarketing: Boolean
  }

  input TransactionInput {
    description: String!
    amount: Currency!
    type: TransactionType!
    category: String!
    date: Date!
    notes: String
    tags: [String!]
    status: TransactionStatus = COMPLETED
  }

  input UpdateTransactionInput {
    description: String
    amount: Currency
    type: TransactionType
    category: String
    date: Date
    notes: String
    tags: [String!]
    status: TransactionStatus
  }

  input TransactionFiltersInput {
    type: TransactionType
    category: String
    status: TransactionStatus
    dateFrom: Date
    dateTo: Date
    amountMin: Currency
    amountMax: Currency
    tags: [String!]
    search: String
  }

  input GoalInput {
    title: String!
    description: String
    targetAmount: Currency!
    currentAmount: Currency = 0
    targetDate: Date!
    category: GoalCategory!
    priority: GoalPriority = MEDIUM
    isRecurring: Boolean = false
    reminderFrequency: ReminderFrequency = MONTHLY
  }

  input UpdateGoalInput {
    title: String
    description: String
    targetAmount: Currency
    currentAmount: Currency
    targetDate: Date
    category: GoalCategory
    priority: GoalPriority
    isRecurring: Boolean
    reminderFrequency: ReminderFrequency
  }

  input GoalFiltersInput {
    category: GoalCategory
    priority: GoalPriority
    isCompleted: Boolean
    search: String
  }

  input MonthlyReportFiltersInput {
    year: Int!
    month: Int!
  }

  # Main Types
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    email: EmailAddress!
    role: UserRole!
    dateOfBirth: Date
    currency: String!
    timezone: String
    preferences: UserPreferences!
    createdAt: Date!
    updatedAt: Date!

    # Computed fields
    fullName: String!

    # Related data
    transactions(filters: TransactionFiltersInput, limit: Int, offset: Int): TransactionConnection!
    goals(filters: GoalFiltersInput, limit: Int, offset: Int): GoalConnection!
    monthlyReports(year: Int, month: Int): [MonthlyReport!]!
  }

  type UserPreferences {
    darkMode: Boolean!
    notifications: NotificationPreferences!
    privacy: PrivacyPreferences!
  }

  type NotificationPreferences {
    email: Boolean!
    push: Boolean!
    goalReminders: Boolean!
    budgetAlerts: Boolean!
    weeklyReports: Boolean!
    monthlyReports: Boolean!
  }

  type PrivacyPreferences {
    shareDataForInsights: Boolean!
    allowMarketing: Boolean!
  }

  type Transaction {
    id: ID!
    description: String!
    amount: Currency!
    type: TransactionType!
    category: String!
    date: Date!
    notes: String
    tags: [String!]!
    status: TransactionStatus!
    userId: ID!
    createdAt: Date!
    updatedAt: Date!

    # Related data
    user: User!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    totalAmount: Currency!
  }

  type TransactionEdge {
    node: Transaction!
    cursor: String!
  }

  type Goal {
    id: ID!
    title: String!
    description: String
    targetAmount: Currency!
    currentAmount: Currency!
    targetDate: Date!
    category: GoalCategory!
    priority: GoalPriority!
    isRecurring: Boolean!
    reminderFrequency: ReminderFrequency
    userId: ID!
    createdAt: Date!
    updatedAt: Date!

    # Computed fields
    progressPercentage: Float!
    remainingAmount: Currency!
    isCompleted: Boolean!
    daysRemaining: Int!
    monthlySavingsNeeded: Currency!

    # Related data
    user: User!
    milestones: [GoalMilestone!]!
  }

  type GoalMilestone {
    id: ID!
    goalId: ID!
    amount: Currency!
    date: Date!
    description: String
    isAchieved: Boolean!
    createdAt: Date!
  }

  type GoalConnection {
    edges: [GoalEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type GoalEdge {
    node: Goal!
    cursor: String!
  }

  type MonthlyReport {
    id: ID!
    userId: ID!
    year: Int!
    month: Int!
    totalIncome: Currency!
    totalExpenses: Currency!
    netIncome: Currency!
    savingsRate: Float!
    budgetAdherence: Float!
    categoryBreakdown: [CategoryBreakdown!]!
    spendingTrends: [SpendingTrend!]!
    budgetComparison: [BudgetComparison!]!
    achievements: [Achievement!]!
    recommendations: [Recommendation!]!
    generatedAt: Date!

    # Related data
    user: User!
  }

  type CategoryBreakdown {
    category: String!
    amount: Currency!
    percentage: Float!
    transactionCount: Int!
    previousAmount: Currency
    change: Float
  }

  type SpendingTrend {
    date: Date!
    amount: Currency!
    category: String
  }

  type BudgetComparison {
    category: String!
    budgeted: Currency!
    actual: Currency!
    variance: Currency!
    variancePercentage: Float!
  }

  type Achievement {
    id: ID!
    type: String!
    title: String!
    description: String!
    amount: Currency
    date: Date!
    goalId: ID
  }

  type Recommendation {
    id: ID!
    type: String!
    title: String!
    description: String!
    priority: String!
    category: String
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Auth Types
  type AuthPayload {
    token: String!
    user: User!
    expiresAt: Date!
  }

  type LogoutResponse {
    success: Boolean!
    message: String!
  }

  # Analytics Types
  type DashboardStats {
    totalBalance: Currency!
    monthlyIncome: Currency!
    monthlyExpenses: Currency!
    savingsRate: Float!
    activeGoals: Int!
    completedGoals: Int!
    budgetAdherence: Float!
    topSpendingCategory: String!
  }

  type CategoryStats {
    category: String!
    totalAmount: Currency!
    transactionCount: Int!
    averageAmount: Currency!
    percentage: Float!
  }

  # Error Types
  type ValidationError {
    field: String!
    message: String!
  }

  type GraphQLError {
    message: String!
    code: String!
    path: [String!]
  }

  # Queries
  type Query {
    # User queries
    me: User
    getUser(id: ID!): User

    # Transaction queries
    getTransaction(id: ID!): Transaction
    getTransactions(
      filters: TransactionFiltersInput
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "date"
      sortOrder: String = "DESC"
    ): TransactionConnection!

    # Goal queries
    getGoal(id: ID!): Goal
    getGoals(
      filters: GoalFiltersInput
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "createdAt"
      sortOrder: String = "DESC"
    ): GoalConnection!

    # Report queries
    getMonthlyReport(year: Int!, month: Int!): MonthlyReport
    getMonthlyReports(year: Int): [MonthlyReport!]!

    # Analytics queries
    getDashboardStats: DashboardStats!
    getCategoryStats(
      dateFrom: Date
      dateTo: Date
      type: TransactionType
    ): [CategoryStats!]!

    # Search queries
    searchTransactions(query: String!, limit: Int = 10): [Transaction!]!
    searchGoals(query: String!, limit: Int = 10): [Goal!]!
  }

  # Mutations
  type Mutation {
    # Auth mutations
    signup(input: SignupInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: LogoutResponse!
    refreshToken: AuthPayload!

    # User mutations
    updateUser(input: UpdateUserInput!): User!
    deleteUser: LogoutResponse!
    changePassword(currentPassword: String!, newPassword: String!): User!

    # Transaction mutations
    addTransaction(input: TransactionInput!): Transaction!
    updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
    bulkDeleteTransactions(ids: [ID!]!): Int!
    importTransactions(file: Upload!): [Transaction!]!

    # Goal mutations
    addGoal(input: GoalInput!): Goal!
    updateGoal(id: ID!, input: UpdateGoalInput!): Goal!
    deleteGoal(id: ID!): Boolean!
    addGoalProgress(id: ID!, amount: Currency!, description: String): Goal!

    # Report mutations
    generateMonthlyReport(year: Int!, month: Int!): MonthlyReport!

    # Utility mutations
    exportData(format: String! = "JSON"): String!
    importData(file: Upload!): Boolean!
  }

  # Subscriptions
  type Subscription {
    transactionAdded(userId: ID!): Transaction!
    transactionUpdated(userId: ID!): Transaction!
    transactionDeleted(userId: ID!): ID!

    goalAdded(userId: ID!): Goal!
    goalUpdated(userId: ID!): Goal!
    goalCompleted(userId: ID!): Goal!

    achievementUnlocked(userId: ID!): Achievement!

    reportGenerated(userId: ID!): MonthlyReport!
  }
`;