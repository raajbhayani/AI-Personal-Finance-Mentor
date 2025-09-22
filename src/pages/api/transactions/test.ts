import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/db/mongodb';
import { authMiddleware } from '../../../lib/middleware/auth';
import { Transaction } from '../../../models/Transaction';
import { validateCreateTransaction } from '../../../lib/validation/transaction';

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    await connectDB();

    const userId = req.user.userId;
    const testResults: any[] = [];

    testResults.push({
      test: 'Database Connection',
      status: 'passed',
      message: 'Successfully connected to MongoDB'
    });

    const sampleTransaction = {
      amount: 25.99,
      description: 'Test Coffee Purchase',
      category: 'Food & Dining',
      subcategory: 'Coffee',
      type: 'expense',
      status: 'completed',
      date: new Date(),
      tags: ['coffee', 'morning'],
      location: 'Downtown Coffee Shop',
      notes: 'Great espresso',
      paymentMethod: 'credit_card',
      currency: 'USD',
      merchant: 'Local Coffee Co',
      isRecurring: false,
    };

    try {
      const validatedData = validateCreateTransaction(sampleTransaction);
      testResults.push({
        test: 'Transaction Validation',
        status: 'passed',
        message: 'Sample transaction data validated successfully',
        data: validatedData
      });
    } catch (error) {
      testResults.push({
        test: 'Transaction Validation',
        status: 'failed',
        message: 'Transaction validation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      const transaction = new Transaction({
        ...sampleTransaction,
        userId,
      });

      await transaction.save();
      testResults.push({
        test: 'Transaction Creation',
        status: 'passed',
        message: 'Transaction created successfully',
        transactionId: transaction._id
      });

      const retrievedTransaction = await Transaction.findById(transaction._id);
      testResults.push({
        test: 'Transaction Retrieval',
        status: retrievedTransaction ? 'passed' : 'failed',
        message: retrievedTransaction ? 'Transaction retrieved successfully' : 'Failed to retrieve transaction'
      });

      const updatedTransaction = await Transaction.findByIdAndUpdate(
        transaction._id,
        { amount: 30.99, notes: 'Updated test note' },
        { new: true }
      );
      testResults.push({
        test: 'Transaction Update',
        status: updatedTransaction ? 'passed' : 'failed',
        message: updatedTransaction ? 'Transaction updated successfully' : 'Failed to update transaction'
      });

      const searchResults = await Transaction.find({
        userId,
        $text: { $search: 'coffee' }
      });
      testResults.push({
        test: 'Text Search',
        status: searchResults.length > 0 ? 'passed' : 'failed',
        message: `Found ${searchResults.length} transactions with text search`,
        resultsCount: searchResults.length
      });

      const aggregationResult = await Transaction.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      testResults.push({
        test: 'Aggregation Query',
        status: 'passed',
        message: 'Aggregation query executed successfully',
        categoriesFound: aggregationResult.length
      });

      await Transaction.findByIdAndDelete(transaction._id);
      testResults.push({
        test: 'Transaction Deletion',
        status: 'passed',
        message: 'Test transaction cleaned up successfully'
      });

    } catch (error) {
      testResults.push({
        test: 'Transaction Operations',
        status: 'failed',
        message: 'Transaction operations failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const passedTests = testResults.filter(test => test.status === 'passed').length;
    const totalTests = testResults.length;

    return res.status(200).json({
      success: true,
      message: `Transaction system test completed: ${passedTests}/${totalTests} tests passed`,
      results: testResults,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Transaction test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Transaction test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default authMiddleware(handler);