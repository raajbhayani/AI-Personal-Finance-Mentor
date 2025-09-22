# 🚀 AI Personal Finance Mentor - Setup Guide

## Quick Start

1. **Copy environment file**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure required variables** in `.env.local`
   - Generate JWT secrets (see instructions below)
   - Add your Anthropic API key
   - Configure MongoDB connection

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Setup database** (see detailed instructions below)
   ```bash
   # For local MongoDB setup
   node scripts/setup-database.js
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Verify setup** by visiting health check endpoint
   ```
   http://localhost:3001/api/health
   ```

## 📋 Prerequisites

- **Node.js** 18+
- **MongoDB** (local installation OR MongoDB Atlas account)
- **Anthropic API Key** (for AI features)

## 🔐 Environment Configuration

### Step 1: Generate Security Keys

Generate secure JWT secrets using Node.js:

```bash
# Generate JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate NEXTAUTH_SECRET (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Database Setup

#### Option A: Local MongoDB (Recommended for Development)

1. **Install MongoDB locally**

   **macOS:**
   ```bash
   # Install using Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   ```

   **Windows:**
   ```bash
   # Download and install from MongoDB website
   # Visit: https://www.mongodb.com/try/download/community
   # Choose Windows x64 MSI
   ```

   **Linux (Ubuntu/Debian):**
   ```bash
   # Import MongoDB public GPG key
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

   # Add MongoDB repository
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

   # Install MongoDB
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **Start MongoDB service**

   **macOS:**
   ```bash
   # Start as service (recommended)
   brew services start mongodb-community

   # Or start manually
   mongod --config /usr/local/etc/mongod.conf
   ```

   **Windows:**
   ```bash
   # Start as Windows service
   net start MongoDB

   # Or start manually
   "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
   ```

   **Linux:**
   ```bash
   # Start as system service
   sudo systemctl start mongod
   sudo systemctl enable mongod

   # Check status
   sudo systemctl status mongod
   ```

3. **Verify MongoDB is running**
   ```bash
   # Connect to MongoDB shell
   mongosh

   # Should connect to: mongodb://127.0.0.1:27017
   # Type 'exit' to quit
   ```

4. **Initialize database with sample data**
   ```bash
   # Run the setup script
   node scripts/setup-database.js
   ```

   This will create:
   - Required collections (users, transactions, goals, budgets, categories)
   - Sample data for testing
   - Database indexes for performance
   - Demo user account: `demo@financeapp.com` / password: `demo123`

5. **Use this connection string in .env.local**
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-finance-mentor
   ```

#### Option B: MongoDB Atlas (Recommended)

1. **Create free account** at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create new cluster** (choose free tier)
3. **Create database user** with read/write permissions
4. **Get connection string** from Atlas dashboard
5. **Update .env.local**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-finance-mentor?retryWrites=true&w=majority
   ```

### Step 3: AI Configuration

1. **Get Anthropic API Key**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create account and generate API key
   - Add to `.env.local`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```

## 📁 Complete .env.local Template

```env
# ================================
# REQUIRED CONFIGURATION
# ================================

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database
MONGODB_URI=mongodb://localhost:27017/ai-finance-mentor
MONGODB_DB_NAME=ai-finance-mentor

# Security (generate using commands above)
JWT_SECRET=your-generated-64-char-jwt-secret
JWT_EXPIRES_IN=7d
NEXTAUTH_SECRET=your-generated-32-char-nextauth-secret
NEXTAUTH_URL=http://localhost:3001
BCRYPT_SALT_ROUNDS=12

# AI Features
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-api-key

# Development
LOG_LEVEL=info
RATE_LIMIT_RPM=100
CACHE_TTL=300
```

## 🧪 Testing the Setup

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Check database connection**
   - Look for "🗄️ MongoDB connected successfully" in console
   - If errors appear, check the troubleshooting section below

3. **Test AI features**
   - Navigate to the chat interface
   - Send a test message to verify Anthropic API key

## 🔧 Optional Integrations

### Bank Integration (Plaid)

1. **Sign up** at [Plaid](https://plaid.com/)
2. **Get API credentials** from dashboard
3. **Add to .env.local**
   ```env
   PLAID_CLIENT_ID=your-plaid-client-id
   PLAID_SECRET=your-plaid-secret
   PLAID_ENV=sandbox
   ```

### Payment Processing (Stripe)

1. **Create account** at [Stripe](https://stripe.com)
2. **Get API keys** from dashboard
3. **Add to .env.local**
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_your-key
   STRIPE_SECRET_KEY=sk_test_your-key
   ```

### Email Notifications

```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com
```

## 🔧 Database Management

### Database Scripts

**Setup database with sample data:**
```bash
node scripts/setup-database.js
```

**Check database health:**
```bash
# Visit the health check endpoint
curl http://localhost:3001/api/health
# Or open in browser: http://localhost:3001/api/health
```

**Reset database (careful - deletes all data):**
```bash
mongosh ai-finance-mentor --eval "db.dropDatabase()"
node scripts/setup-database.js
```

### Health Check Endpoint

The app includes a comprehensive health check at `/api/health` that verifies:

- ✅ Database connectivity
- ✅ Required collections exist
- ✅ Read/write operations work
- ✅ Configuration is valid
- ✅ Response times

**Example health check response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": 45,
    "collections": ["users", "transactions", "goals", "budgets"]
  },
  "checks": {
    "databaseConnected": true,
    "collectionsPresent": true,
    "canRead": true,
    "canWrite": true
  }
}
```

## 🚨 Troubleshooting

### MongoDB Connection Issues

**Error: "ECONNREFUSED" or "Server is not running"**
```bash
# Check if MongoDB is running
ps aux | grep mongod  # macOS/Linux
tasklist | findstr mongod  # Windows

# Start MongoDB service
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
net start MongoDB  # Windows
```

**Error: "Authentication failed"**
- Check username/password in connection string
- Verify database user permissions in Atlas
- Ensure user has read/write access to the database

**Error: "Server selection timed out"**
- Check network connectivity
- Verify firewall settings
- For Atlas: whitelist your IP address in Network Access
- Try connecting with MongoDB Compass to test connection

**Error: "Database not initialized"**
```bash
# Run the setup script to initialize
node scripts/setup-database.js
```

**MongoDB not starting on Windows:**
```bash
# Create data directory if missing
mkdir C:\data\db

# Start manually with custom data path
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Permission denied on macOS/Linux:**
```bash
# Fix permissions for data directory
sudo chown -R $(whoami) /usr/local/var/mongodb
sudo chown -R $(whoami) /usr/local/var/log/mongodb
```

### AI Features Not Working

**Error: "Invalid API key"**
- Verify Anthropic API key is correct
- Check API key has sufficient credits
- Ensure key starts with `sk-ant-api03-`

### Development Server Issues

**Port already in use**
- Kill existing processes: `pkill -f "next dev"`
- Use different port: `npm run dev -- -p 3002`

## 📚 Additional Resources

- [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Getting Help

1. **Check the console** for detailed error messages
2. **Review the logs** in your terminal
3. **Verify all environment variables** are set correctly
4. **Restart the development server** after changes

## 🚀 Next Steps

Once setup is complete:

1. **Create your first user account** via signup page
2. **Add some transactions** to see the dashboard
3. **Try the AI chat** for financial advice
4. **Explore the features** and customize as needed

---

> **Note**: Never commit your `.env.local` file to version control. It contains sensitive credentials that should remain private.