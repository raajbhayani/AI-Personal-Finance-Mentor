# AI Personal Finance Mentor

A comprehensive personal finance management application built with Next.js 14, TypeScript, and modern web technologies.

**Developed by Raj** - A modern, AI-powered personal finance application for smart money management.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.6-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [AI Integration](#-ai-integration)
- [Security](#-security)
- [Roadmap](#-roadmap)

---

## 🚀 Features

### Core Features (Work Without AI)
- ✅ **Smart Dashboard** - Real-time financial overview with comprehensive insights
- ✅ **Transaction Management** - Track income and expenses with automatic categorization
- ✅ **Budget Planning** - Set and monitor budgets with intelligent recommendations
- ✅ **Goal Setting** - Create and track financial goals with progress visualization
- ✅ **Investment Tracking** - Monitor your portfolio performance
- ✅ **Account Management** - Connect and manage multiple financial accounts
- ✅ **Advanced Analytics** - Beautiful charts and reports powered by Chart.js
- ✅ **User Authentication** - Secure JWT-based authentication system
- ✅ **Responsive Design** - Fully responsive UI for all devices

### AI-Powered Features (Requires API Key)
- 🤖 **AI Chat Assistant** - Get personalized financial advice powered by AI
- 🤖 **Smart Recommendations** - AI-driven budget and investment suggestions
- 🤖 **Pattern Analysis** - Intelligent spending pattern detection

> **Note:** Currently, the AI API key is required to run the application. We're working on making AI features optional. See [CHECK-AI-DEPENDENCY.md](CHECK-AI-DEPENDENCY.md) for details.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript 5.6** - Type-safe development
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **Chart.js 4.4** - Data visualization library
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation and type safety
- **Framer Motion** - Smooth animations
- **SWR** - Data fetching and caching

### Backend
- **Node.js** - Runtime environment
- **MongoDB 8.6** - NoSQL database
- **Mongoose** - Elegant MongoDB ODM
- **Apollo Server 4** - GraphQL server
- **Apollo Client 3** - GraphQL client
- **JWT** - Secure token-based authentication
- **bcryptjs** - Password hashing

### AI Integration
- **Anthropic SDK** - AI-powered financial advice (Claude)
- Supports generic AI_API_KEY for future flexibility

### Development & Testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Unit testing framework
- **Playwright** - E2E testing
- **Testing Library** - React component testing
- **Husky** - Git hooks

### DevOps & Deployment
- **Docker** - Containerization
- **Vercel** - Serverless deployment (recommended)
- **GitHub Actions** - CI/CD workflows

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** or **pnpm**
- **MongoDB**
  - Local: [Installation Guide](https://docs.mongodb.com/manual/installation/)
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
- **AI API Key** (Currently Required)
  - Get from [Anthropic Console](https://console.anthropic.com/)
  - $5 free credit available for testing

### Quick Start (5 minutes)

1. **Clone the repository**
   ```bash
   git clone https://github.com/raajbhayani/AI-Personal-Finance-Mentor.git
   cd AI-Personal-Finance-Mentor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Required Variables
   MONGODB_URI=mongodb://localhost:27017/ai-finance-mentor
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-characters
   AI_API_KEY=your-ai-api-key-here

   # Optional Variables
   NEXTAUTH_URL=http://localhost:3001
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   NODE_ENV=development
   ```

   **Generate secure secrets:**
   ```bash
   # Generate JWT_SECRET
   openssl rand -base64 32

   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3001](http://localhost:3001)

### Detailed Setup

For comprehensive setup instructions, see [SETUP.md](SETUP.md)

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3001 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run validate` | Run type-check, lint, and format checks |

---

## 🚀 Deployment

### Quick Deploy to Vercel (Recommended - 5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Set environment variables in Vercel dashboard:**
- `MONGODB_URI`
- `JWT_SECRET`
- `AI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Deploy with Docker

```bash
# Build image
docker build -t ai-finance-mentor .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e AI_API_KEY="your-ai-key" \
  ai-finance-mentor
```

### Other Platforms

See [QUICK-DEPLOY.md](QUICK-DEPLOY.md) for deployment guides for:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS / GCP / Azure

### Deployment Readiness

For detailed deployment testing results and recommendations, see [DEPLOYMENT-READINESS.md](DEPLOYMENT-READINESS.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](SETUP.md) | Comprehensive setup guide with troubleshooting |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Detailed deployment instructions for all platforms |
| [QUICK-DEPLOY.md](QUICK-DEPLOY.md) | Quick deployment guide (5 minutes) |
| [DEPLOYMENT-READINESS.md](DEPLOYMENT-READINESS.md) | Testing results and deployment strategies |
| [DATABASE.md](DATABASE.md) | Database schema and MongoDB setup |
| [TESTING.md](TESTING.md) | Testing guide and coverage reports |
| [CHECK-AI-DEPENDENCY.md](CHECK-AI-DEPENDENCY.md) | AI dependency analysis |

---

## 📁 Project Structure

```
AI-Personal-Finance-Mentor/
├── src/
│   ├── components/          # React components (23 subdirectories)
│   │   ├── ui/             # Basic UI components (buttons, inputs, etc.)
│   │   ├── charts/         # Chart visualizations
│   │   ├── forms/          # Form components
│   │   ├── layout/         # Layout components (header, footer, sidebar)
│   │   ├── chat/           # AI chat interface
│   │   ├── dashboard/      # Dashboard components
│   │   ├── goals/          # Financial goals components
│   │   └── budgets/        # Budget management components
│   │
│   ├── pages/              # Next.js pages and API routes
│   │   ├── api/           # Backend API routes
│   │   │   ├── ai/        # AI chat endpoints
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── transactions/ # Transaction CRUD
│   │   │   ├── analytics/ # Analytics endpoints
│   │   │   └── graphql.ts # GraphQL endpoint
│   │   ├── dashboard.tsx
│   │   ├── transactions.tsx
│   │   └── goals.tsx
│   │
│   ├── lib/                # Utility libraries (21 subdirectories)
│   │   ├── services/      # Business logic services
│   │   │   ├── aiService.ts         # AI integration
│   │   │   ├── analyticsService.ts  # Analytics
│   │   │   └── financialAnalysis.ts # Financial calculations
│   │   ├── database/      # MongoDB connection
│   │   ├── auth/          # JWT authentication utilities
│   │   ├── graphql/       # GraphQL setup and resolvers
│   │   ├── cache/         # Caching utilities
│   │   ├── security/      # XSS protection, validation
│   │   └── utils/         # General utilities
│   │
│   ├── models/            # Database models (Mongoose schemas)
│   │   ├── User.ts
│   │   ├── Transaction.ts
│   │   ├── Budget.ts
│   │   ├── Goal.ts
│   │   └── Conversation.ts
│   │
│   ├── types/             # TypeScript type definitions
│   ├── styles/            # Global CSS and Tailwind config
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts
│   └── config/            # Configuration files
│
├── scripts/               # Utility scripts
│   ├── setup-database.js
│   └── validate-env.js
│
├── public/               # Static assets
├── e2e/                  # E2E tests
└── docs/                 # Documentation
```

---

## 🗄️ Database Schema

### Collections

#### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  preferredCurrency: String,
  settings: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### Transaction
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  amount: Number,
  type: String (enum: ['income', 'expense']),
  category: String,
  description: String,
  date: Date,
  createdAt: Date
}
```

#### Budget
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  category: String,
  limit: Number,
  spent: Number,
  period: String (enum: ['monthly', 'yearly']),
  startDate: Date,
  endDate: Date
}
```

#### Goal
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  targetAmount: Number,
  currentAmount: Number,
  targetDate: Date,
  priority: String,
  status: String
}
```

#### Conversation (AI Chats)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  messages: [{
    role: String,
    content: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

For detailed schema documentation, see [DATABASE.md](DATABASE.md)

---

## 🔐 Authentication

The application uses **JWT-based authentication** with the following features:

- ✅ Secure password hashing using bcryptjs (12 rounds)
- ✅ Token-based session management
- ✅ Protected API routes with middleware
- ✅ Client-side auth state management
- ✅ Automatic token refresh
- ✅ Secure HTTP-only cookies
- ✅ Password strength validation
- ✅ Email verification (optional)

### Authentication Flow

1. User signs up with email/password
2. Password is hashed with bcrypt
3. JWT token is generated and sent to client
4. Token is stored in HTTP-only cookie
5. Client includes token in subsequent requests
6. Server validates token for protected routes

---

## 🤖 AI Integration

The application includes AI-powered financial advisory features:

### Features
- **Personalized Financial Advice** - Context-aware recommendations based on user's financial profile
- **Spending Pattern Analysis** - AI identifies spending trends and anomalies
- **Budget Optimization** - Smart suggestions for budget allocation
- **Goal Achievement Strategies** - AI-generated plans to reach financial goals
- **Conversational Interface** - Natural language chat for financial questions

### Current Implementation
- Uses Anthropic's Claude API for AI responses
- Supports generic `AI_API_KEY` environment variable
- Maintains conversation context for better advice
- Includes financial profile data in AI prompts

### AI Dependency Status
⚠️ **Currently Required**: The app requires an AI API key to start. We're planning to make AI features optional.

**Cost Estimate:**
- Free tier: $5 credit (sufficient for testing)
- Production: ~$0.003-$0.012 per chat message
- Monthly cost: Depends on usage (typically $10-50 for moderate use)

See [CHECK-AI-DEPENDENCY.md](CHECK-AI-DEPENDENCY.md) for detailed analysis.

---

## 🎨 UI Components

Built with a custom design system featuring:

- ✅ **Consistent Design Language** - Unified color palette and typography
- ✅ **Responsive Layouts** - Mobile-first design approach
- ✅ **Accessible Components** - WCAG 2.1 AA compliant
- ✅ **Loading States** - Skeleton screens and spinners
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Form Validation** - Real-time validation with helpful feedback
- ✅ **Dark Mode Ready** - Dark mode support (coming soon)
- ✅ **Smooth Animations** - Framer Motion animations

---

## 📊 Data Visualization

Powered by **Chart.js** with custom configurations:

- 📈 **Spending Trends** - Line charts showing expense patterns over time
- 🥧 **Category Breakdowns** - Pie/doughnut charts for expense categories
- 📊 **Budget Utilization** - Bar charts comparing budget vs actual spending
- 🎯 **Goal Progress** - Progress bars and milestone tracking
- 💰 **Income vs Expenses** - Comparative bar charts
- 📉 **Investment Performance** - Portfolio value over time

All charts are:
- Fully responsive
- Interactive (hover for details)
- Customizable colors
- Exportable as images

---

## 🔒 Security Features

### Implemented Security Measures

- ✅ **Password Security** - bcrypt hashing with salt rounds
- ✅ **JWT Token Expiration** - Automatic token expiry (7 days default)
- ✅ **Protected API Routes** - Middleware authentication
- ✅ **Input Sanitization** - XSS protection on all inputs
- ✅ **CORS Configuration** - Restricted cross-origin requests
- ✅ **Rate Limiting** - API rate limiting to prevent abuse
- ✅ **SQL Injection Prevention** - MongoDB parameterized queries
- ✅ **Content Security Policy** - CSP headers configured
- ✅ **HTTPS Only** - Secure connections in production
- ✅ **Environment Variables** - Sensitive data in env files

### Best Practices

- Never commit `.env.local` files
- Rotate JWT secrets regularly
- Use strong passwords (min 8 chars, mixed case, numbers, symbols)
- Enable 2FA (coming soon)
- Regular security audits with `npm audit`

---

## 🧪 Testing

### Test Coverage

- **Unit Tests** - Jest + Testing Library for components
- **Integration Tests** - API endpoint testing
- **E2E Tests** - Playwright for user workflows
- **Type Checking** - TypeScript for compile-time safety

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run in watch mode (development)
npm run test:watch
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Run `npm run validate` before committing
- Use conventional commit messages

---

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Documentation](#-documentation)
2. Search [existing issues](../../issues)
3. Create a [new issue](../../issues/new) with:
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

---

## 🔮 Roadmap

### In Progress
- [ ] Make AI features optional (no paid API required)
- [ ] Fix pre-existing TypeScript errors

### Planned Features
- [ ] Mobile app development (React Native)
- [ ] Bank account integration (Plaid API)
- [ ] Advanced investment analysis
- [ ] Receipt scanning with OCR
- [ ] Cryptocurrency tracking
- [ ] Multi-currency support
- [ ] Team/family sharing features
- [ ] Advanced reporting and PDF exports
- [ ] Dark mode support
- [ ] Two-factor authentication
- [ ] Email notifications
- [ ] Recurring transactions
- [ ] Bill reminders
- [ ] Financial goal recommendations

### Future Enhancements
- [ ] Machine learning for spending predictions
- [ ] Voice assistant integration
- [ ] Social sharing features
- [ ] Gamification and achievements
- [ ] Financial literacy resources
- [ ] Tax calculation and filing assistance

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [Anthropic](https://www.anthropic.com/)

---

## 📞 Contact

**Raj** - Developer

- Portfolio: [Your Portfolio URL]
- GitHub: [@raajbhayani](https://github.com/raajbhayani)
- LinkedIn: [Your LinkedIn]
- Email: [Your Email]

---

## 📊 Project Stats

- **Lines of Code:** ~50,000+
- **Components:** 100+
- **API Endpoints:** 25+
- **Database Models:** 6
- **Dependencies:** 1038 packages
- **Development Time:** [Your time]
- **Current Version:** 1.0.0

---

**Developed by Raj** using Next.js 14, TypeScript, and modern web technologies.

© 2024 Raj. All rights reserved.

---

⭐️ **Star this repo if you find it helpful!**
