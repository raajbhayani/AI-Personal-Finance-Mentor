# AI Personal Finance Mentor

A comprehensive personal finance management application, built with Next.js 14, TypeScript, and modern web technologies.

**Developed by Raj** - A modern, AI-powered personal finance application for smart money management.

## 🚀 Features

- **Smart Dashboard**: Real-time financial overview with  insights
- **Transaction Management**: Track income and expenses with automatic categorization
- **Budget Planning**: Set and monitor budgets with intelligent recommendations
- **Goal Setting**: Create and track financial goals with progress visualization
- **AI Chat Assistant**: Get personalized financial advice powered by AI
- **Investment Tracking**: Monitor your portfolio performance
- **Account Management**: Connect and manage multiple financial accounts
- **Advanced Analytics**: Beautiful charts and reports powered by Chart.js

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Chart.js** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Apollo Server** - GraphQL API
- **Apollo Client** - GraphQL client
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### AI Integration
- **AI Assistant** - Intelligent financial advisor

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **TypeScript** - Static type checking

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   ├── charts/         # Chart components
│   └── layout/         # Layout components
├── pages/              # Next.js pages
│   └── api/           # API routes
│       ├── auth/      # Authentication endpoints
│       ├── graphql/   # GraphQL endpoint
│       └── user/      # User-related endpoints
├── lib/                # Utility libraries
│   ├── database/      # Database connection
│   ├── auth/          # Authentication utilities
│   ├── graphql/       # GraphQL setup
│   └── utils/         # General utilities
├── types/              # TypeScript type definitions
├── styles/             # Global styles
├── hooks/              # Custom React hooks
├── models/             # Database models
├── middleware/         # Custom middleware
└── config/             # Configuration files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- AI API key (for AI features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ai-personal-finance-mentor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-finance-mentor
   JWT_SECRET=your-super-secret-jwt-key
   AI_API_KEY=your-ai-api-key
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🗄️ Database Schema

### User
- Personal information and authentication
- Settings and preferences
- Created/updated timestamps

### Transaction
- Amount, description, category
- Type (income/expense)
- Date and timestamps
- User association

### Budget
- Category and amount limits
- Spending tracking
- Period (monthly/yearly)
- User association

### Goal
- Target amount and current progress
- Priority and status
- Target date
- User association

### ChatSession
- AI conversation history
- Message storage
- User association

## 🔐 Authentication

The application uses JWT-based authentication with:
- Secure password hashing using bcryptjs
- Token-based session management
- Protected API routes
- Client-side auth state management

## 🤖 AI Integration

AI integration provides:
- Personalized financial advice
- Spending pattern analysis
- Budget optimization suggestions
- Goal achievement strategies
- Investment recommendations

## 🎨 UI Components

Built with a custom design system featuring:
- Consistent color palette
- Responsive layouts
- Accessible components
- Loading states
- Error handling
- Form validation

## 📊 Data Visualization

Charts and analytics powered by Chart.js:
- Spending trends over time
- Category breakdowns
- Budget utilization
- Goal progress tracking
- Investment performance

## 🔒 Security Features

- Password strength validation
- JWT token expiration
- Protected API routes
- Input sanitization
- XSS protection
- CORS configuration

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build Docker image
docker build -t ai-finance-mentor .

# Run container
docker run -p 3000:3000 ai-finance-mentor
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Bank account integration (Plaid)
- [ ] Advanced investment analysis
- [ ] Receipt scanning with OCR
- [ ] Cryptocurrency tracking
- [ ] Multi-currency support
- [ ] Team/family sharing features
- [ ] Advanced reporting and exports

---

**Developed by Raj** using Next.js 14, TypeScript, and modern web technologies.

© 2024 Raj. All rights reserved.