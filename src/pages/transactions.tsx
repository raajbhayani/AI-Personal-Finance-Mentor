import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit3,
  Calendar,
  DollarSign,
  Tag,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  Square,
  MoreHorizontal,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import {
  GET_TRANSACTIONS,
  ADD_TRANSACTION,
  UPDATE_TRANSACTION,
  DELETE_TRANSACTION,
  BULK_DELETE_TRANSACTIONS,
  SEARCH_TRANSACTIONS,
} from '@/lib/graphql/queries/transactions';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes?: string;
  tags: string[];
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
  search?: string;
}

interface AddTransactionInput {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes?: string;
  tags?: string[];
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
}

const CATEGORIES = [
  'food',
  'transportation',
  'housing',
  'utilities',
  'healthcare',
  'entertainment',
  'shopping',
  'education',
  'travel',
  'salary',
  'business',
  'investment',
  'other',
];

const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed', color: 'text-green-600 bg-green-50' },
  { value: 'PENDING', label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'FAILED', label: 'Failed', color: 'text-red-600 bg-red-50' },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for filters and pagination
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  // Form state
  const [transactionForm, setTransactionForm] = useState<AddTransactionInput>({
    description: '',
    amount: 0,
    type: 'EXPENSE',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: [],
    status: 'COMPLETED',
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent('/transactions')}`);
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  // GraphQL queries and mutations
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery(GET_TRANSACTIONS, {
    variables: {
      filters,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy,
      sortOrder,
    },
    skip: !isAuthenticated,
    errorPolicy: 'all',
  });

  const [addTransaction, { loading: addLoading }] = useMutation(ADD_TRANSACTION, {
    onCompleted: () => {
      setShowAddModal(false);
      resetForm();
      refetchTransactions();
    },
    onError: (error) => {
      console.error('Error adding transaction:', error);
    },
  });

  const [updateTransaction, { loading: updateLoading }] = useMutation(UPDATE_TRANSACTION, {
    onCompleted: () => {
      setShowEditModal(false);
      setSelectedTransaction(null);
      resetForm();
      refetchTransactions();
    },
    onError: (error) => {
      console.error('Error updating transaction:', error);
    },
  });

  const [deleteTransaction] = useMutation(DELETE_TRANSACTION, {
    onCompleted: () => {
      refetchTransactions();
    },
    onError: (error) => {
      console.error('Error deleting transaction:', error);
    },
  });

  const [bulkDeleteTransactions] = useMutation(BULK_DELETE_TRANSACTIONS, {
    onCompleted: () => {
      setSelectedTransactions([]);
      refetchTransactions();
    },
    onError: (error) => {
      console.error('Error bulk deleting transactions:', error);
    },
  });

  // Memoized values
  const transactions = useMemo(() => {
    return transactionsData?.getTransactions?.edges?.map((edge: any) => edge.node) || [];
  }, [transactionsData]);

  const pageInfo = transactionsData?.getTransactions?.pageInfo;
  const totalCount = transactionsData?.getTransactions?.totalCount || 0;
  const totalAmount = transactionsData?.getTransactions?.totalAmount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handlers
  const resetForm = () => {
    setTransactionForm({
      description: '',
      amount: 0,
      type: 'EXPENSE',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      tags: [],
      status: 'COMPLETED',
    });
  };

  const handleAddTransaction = async () => {
    try {
      await addTransaction({
        variables: {
          input: {
            ...transactionForm,
            amount: parseFloat(transactionForm.amount.toString()),
            date: new Date(transactionForm.date),
          },
        },
      });
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionForm({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date.split('T')[0],
      notes: transaction.notes || '',
      tags: transaction.tags,
      status: transaction.status,
    });
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await updateTransaction({
        variables: {
          id: selectedTransaction.id,
          input: {
            ...transactionForm,
            amount: parseFloat(transactionForm.amount.toString()),
            date: new Date(transactionForm.date),
          },
        },
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction({ variables: { id } });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedTransactions.length} transactions?`)) {
      await bulkDeleteTransactions({ variables: { ids: selectedTransactions } });
    }
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev =>
      prev.includes(id)
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const applyFilters = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Transactions - AI Personal Finance Mentor</title>
        <meta name="description" content="Manage your financial transactions - track income and expenses" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600">Track and manage your income and expenses</p>
            </div>

            <div className="flex items-center space-x-3">
              {selectedTransactions.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedTransactions.length})
                </button>
              )}

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Page</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{transactions.length}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow-soft border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      applyFilters({ search: e.target.value || undefined });
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showFilters
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>

                <button
                  onClick={() => refetchTransactions()}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => applyFilters({ type: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => applyFilters({ category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => applyFilters({ status: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading transactions...</span>
              </div>
            ) : transactionsError ? (
              <div className="flex items-center justify-center py-12">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <span className="ml-2 text-red-600">Error loading transactions</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first transaction.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSelectAll}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedTransactions.length === transactions.length ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <span className="text-sm text-gray-700">
                        {selectedTransactions.length > 0
                          ? `${selectedTransactions.length} selected`
                          : `${transactions.length} transactions`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortBy(field);
                          setSortOrder(order as 'ASC' | 'DESC');
                        }}
                        className="text-sm border border-gray-300 rounded px-3 py-1"
                      >
                        <option value="date-DESC">Date (Newest)</option>
                        <option value="date-ASC">Date (Oldest)</option>
                        <option value="amount-DESC">Amount (Highest)</option>
                        <option value="amount-ASC">Amount (Lowest)</option>
                        <option value="description-ASC">Description (A-Z)</option>
                        <option value="description-DESC">Description (Z-A)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleSelectTransaction(transaction.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {selectedTransactions.includes(transaction.id) ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.description}
                              </div>
                              {transaction.notes && (
                                <div className="text-sm text-gray-500">{transaction.notes}</div>
                              )}
                              {transaction.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {transaction.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {transaction.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{transaction.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {transaction.type === 'INCOME' ? (
                                <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500 mr-2" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  transaction.type === 'INCOME'
                                    ? 'text-green-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                {transaction.type === 'INCOME' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {transaction.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                STATUS_OPTIONS.find(s => s.value === transaction.status)?.color
                              }`}
                            >
                              {STATUS_OPTIONS.find(s => s.value === transaction.status)?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-700">
                        <span>
                          Showing {(currentPage - 1) * pageSize + 1} to{' '}
                          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNumber = i + 1;
                            if (totalPages <= 5) {
                              return pageNumber;
                            }

                            if (currentPage <= 3) {
                              return pageNumber;
                            } else if (currentPage >= totalPages - 2) {
                              return totalPages - 4 + i;
                            } else {
                              return currentPage - 2 + i;
                            }
                          }).map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Transaction</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter transaction description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={transactionForm.type}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value as 'INCOME' | 'EXPENSE' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="EXPENSE">Expense</option>
                        <option value="INCOME">Income</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={transactionForm.category}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={transactionForm.date}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={transactionForm.status}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={transactionForm.notes}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes about this transaction"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={transactionForm.tags?.join(', ') || ''}
                      onChange={(e) => setTransactionForm(prev => ({
                        ...prev,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                      }))}
                      placeholder="e.g., work, business, monthly"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTransaction}
                    disabled={addLoading || !transactionForm.description || !transactionForm.category || transactionForm.amount <= 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Transaction'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Transaction</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter transaction description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={transactionForm.type}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value as 'INCOME' | 'EXPENSE' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="EXPENSE">Expense</option>
                        <option value="INCOME">Income</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={transactionForm.category}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={transactionForm.date}
                        onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={transactionForm.status}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={transactionForm.notes}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes about this transaction"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={transactionForm.tags?.join(', ') || ''}
                      onChange={(e) => setTransactionForm(prev => ({
                        ...prev,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                      }))}
                      placeholder="e.g., work, business, monthly"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTransaction(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTransaction}
                    disabled={updateLoading || !transactionForm.description || !transactionForm.category || transactionForm.amount <= 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Transaction'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}