import { createLazyRoute } from '../LazyLoading/LazyComponentWrapper';

// Lazy load page components with chunk names for better bundle analysis
export const LazyDashboard = createLazyRoute(
  () => import('../../pages/dashboard'),
  'dashboard'
);

export const LazyTransactions = createLazyRoute(
  () => import('../../pages/transactions'),
  'transactions'
);

export const LazyGoals = createLazyRoute(
  () => import('../../pages/goals'),
  'goals'
);

// export const LazyAnalytics = createLazyRoute(
//   () => import('../../pages/analytics'),
//   'analytics'
// );

// export const LazyProfile = createLazyRoute(
//   () => import('../../pages/profile'),
//   'profile'
// );

export const LazySettings = createLazyRoute(
  () => import('../../pages/settings'),
  'settings'
);

// // AI Chat component - separate chunk due to size
// export const LazyAIChat = createLazyRoute(
//   () => import('../../components/AI/ChatInterface'),
//   'ai-chat'
// );

// // Reports component - heavy with charts
// export const LazyReports = createLazyRoute(
//   () => import('../../components/Reports/ReportsPage'),
//   'reports'
// );

// // Authentication pages
// export const LazyLogin = createLazyRoute(
//   () => import('../../pages/auth/login'),
//   'auth-login'
// );

// export const LazySignup = createLazyRoute(
//   () => import('../../pages/auth/signup'),
//   'auth-signup'
// );

// export const LazyForgotPassword = createLazyRoute(
//   () => import('../../pages/auth/forgot-password'),
//   'auth-forgot-password'
// );

// // Admin pages (if user has admin role)
// export const LazyAdminDashboard = createLazyRoute(
//   () => import('../../pages/admin/dashboard'),
//   'admin-dashboard'
// );

// export const LazyAdminUsers = createLazyRoute(
//   () => import('../../pages/admin/users'),
//   'admin-users'
// );

// // Heavy feature components
// export const LazyBudgetPlanner = createLazyRoute(
//   () => import('../../components/Budget/BudgetPlanner'),
//   'budget-planner'
// );

// export const LazyInvestmentTracker = createLazyRoute(
//   () => import('../../components/Investment/InvestmentTracker'),
//   'investment-tracker'
// );

// export const LazyTaxCalculator = createLazyRoute(
//   () => import('../../components/Tax/TaxCalculator'),
//   'tax-calculator'
// );

// Export components that should be preloaded for critical paths
export const CRITICAL_COMPONENTS = [
  () => import('../../pages/dashboard'),
  () => import('../../pages/transactions'),
  // () => import('../../components/Navigation/Sidebar'),
  // () => import('../../components/Common/Header'),
];

// Export components for route-based code splitting
export const ROUTE_COMPONENTS = {
  '/dashboard': LazyDashboard,
  '/transactions': LazyTransactions,
  '/goals': LazyGoals,
  // '/analytics': LazyAnalytics,
  // '/profile': LazyProfile,
  '/settings': LazySettings,
  // '/ai-chat': LazyAIChat,
  // '/reports': LazyReports,
  // '/login': LazyLogin,
  // '/signup': LazySignup,
  // '/forgot-password': LazyForgotPassword,
  // '/admin/dashboard': LazyAdminDashboard,
  // '/admin/users': LazyAdminUsers,
  // '/budget-planner': LazyBudgetPlanner,
  // '/investment-tracker': LazyInvestmentTracker,
  // '/tax-calculator': LazyTaxCalculator,
};

// Export for dynamic imports based on user role
export const getRoleBasedComponents = (userRole: string) => {
  const baseComponents = [
    LazyDashboard,
    LazyTransactions,
    LazyGoals,
    // LazyProfile,
    LazySettings,
  ];

  const adminComponents = userRole === 'ADMIN' ? [
    // LazyAdminDashboard,
    // LazyAdminUsers,
  ] : [];

  const premiumComponents = ['PREMIUM', 'ADMIN'].includes(userRole) ? [
    // LazyAnalytics,
    // LazyReports,
    // LazyAIChat,
    // LazyBudgetPlanner,
    // LazyInvestmentTracker,
    // LazyTaxCalculator,
  ] : [];

  return [...baseComponents, ...adminComponents, ...premiumComponents];
};