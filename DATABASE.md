# 🗄️ Database Setup & Management Guide

## Quick Commands

```bash
# Seed database with comprehensive test data (recommended)
npm run seed
# or
npm run db:seed

# Initialize database with basic sample data
npm run db:init

# Setup database (detailed version)
npm run db:setup

# Check database health
npm run db:health

# Health check in browser
# http://localhost:3001/api/health
```

## What's Included

### 📊 Sample Data

**Two data sets available:**

**Basic Sample Data** (`npm run db:init`):
- **Demo user**: `demo@financeapp.com` / `demo123`
- **5 sample transactions** (income & expenses)
- **3 financial goals** (Emergency Fund, Vacation, Laptop)
- **3 budget categories** with spending tracking
- **8 expense/income categories** with icons

**Comprehensive Test Data** (`npm run seed`):
- **Test user**: `test@financeapp.com` / `test123`
- **50+ realistic transactions** across 3 months
- **12 financial categories** with icons and descriptions
- **3 financial goals** with milestones and progress tracking
- **4 monthly budgets** with spending alerts
- **3 monthly reports** with insights and analytics
- **Recurring transactions** (salary, subscriptions)
- **Expense patterns** (groceries, gas, entertainment, etc.)

### 🏗️ Database Structure

**Collections created:**
- `users` - User accounts and profiles
- `transactions` - Financial transactions
- `goals` - Savings goals and targets
- `budgets` - Monthly/yearly budget limits
- `categories` - Transaction categories with icons

**Indexes for performance:**
- User email (unique)
- Transactions by user & date
- Transactions by user & category
- Goals by user & status
- Budgets by user & period

## MongoDB Local Setup

### Installation

**Windows:**
1. Download MongoDB Community from [official website](https://www.mongodb.com/try/download/community)
2. Run the MSI installer
3. Choose "Complete" installation
4. Install as Windows Service (recommended)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Verification

```bash
# Check if MongoDB is running
mongosh

# Should connect to: mongodb://127.0.0.1:27017
# Type 'exit' to quit
```

## Database Management Commands

### NPM Scripts

```bash
# Comprehensive seeding with realistic test data (recommended)
npm run seed
npm run db:seed

# Quick initialization with basic sample data
npm run db:init

# Full setup with detailed logging
npm run db:setup

# Check health and connectivity
npm run db:health

# Reset database (WARNING: deletes all data)
mongosh ai-finance-mentor --eval "db.dropDatabase()"
npm run seed
```

### Manual MongoDB Commands

```bash
# Connect to database
mongosh ai-finance-mentor

# List collections
show collections

# Count documents in each collection
db.users.countDocuments()
db.transactions.countDocuments()
db.goals.countDocuments()
db.budgets.countDocuments()
db.categories.countDocuments()

# Find sample user
db.users.findOne()

# Find recent transactions
db.transactions.find().sort({date: -1}).limit(5)

# Check indexes
db.users.getIndexes()
db.transactions.getIndexes()
```

## Health Check API

### Endpoint: `/api/health`

**GET** `http://localhost:3001/api/health`

**Response Structure:**
```json
{
  "status": "healthy|warning|unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 1234.56,
  "database": {
    "status": "healthy",
    "connected": true,
    "responseTime": 45,
    "collections": [
      {"name": "users", "count": 1},
      {"name": "transactions", "count": 5}
    ]
  },
  "checks": {
    "databaseConnected": true,
    "collectionsPresent": true,
    "canRead": true,
    "canWrite": true,
    "properlyConfigured": true
  }
}
```

**Status Meanings:**
- 🟢 **healthy**: All systems operational
- 🟡 **warning**: Connected but missing data/config
- 🔴 **unhealthy**: Cannot connect or critical errors

## Troubleshooting

### Common Issues

**"ECONNREFUSED" Error:**
```bash
# MongoDB not running - start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
net start MongoDB                      # Windows
```

**"Database not initialized" Warning:**
```bash
# Run initialization script
npm run db:init
```

**Health check shows "unhealthy":**
1. Check if MongoDB is running: `mongosh`
2. Verify connection string in `.env.local`
3. Run initialization: `npm run db:init`
4. Check logs in terminal for specific errors

**Permission errors on macOS/Linux:**
```bash
# Fix data directory permissions
sudo chown -R $(whoami) /usr/local/var/mongodb
sudo chown -R $(whoami) /usr/local/var/log/mongodb
```

**Windows service won't start:**
```bash
# Create data directory
mkdir C:\data\db

# Start manually
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

## Development Tips

1. **Always check health first**: Visit `/api/health` to verify everything is working
2. **Use demo account**: Login with `demo@financeapp.com` / `demo123` for testing
3. **Reset when needed**: Use the reset commands to start fresh during development
4. **Monitor logs**: Watch the terminal for helpful error messages and setup guidance

## Production Considerations

- Replace demo data with real user registration
- Set up MongoDB Atlas for cloud hosting
- Configure proper authentication and indexes
- Set up monitoring and backup strategies
- Use environment-specific configurations