'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Target, TrendingUp, Award, Filter, Search } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import GoalCreationForm from './GoalCreationForm';
import GoalProgressCard from './GoalProgressCard';
import AchievementCelebration from './AchievementCelebration';
import { formatCurrency } from '../../lib/utils/dashboard';
import { cn } from '../../lib/utils/cn';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  reminderFrequency?: 'weekly' | 'monthly' | 'quarterly';
  createdAt: string;
  updatedAt: string;
}

interface Achievement {
  id: string;
  type: 'goal_completed' | 'milestone_reached' | 'streak_achieved' | 'savings_target';
  title: string;
  description: string;
  amount?: number;
  goalTitle?: string;
}

// Mock data
const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    description: 'Build a 6-month emergency fund for financial security',
    targetAmount: 15000,
    currentAmount: 8500,
    targetDate: '2024-12-31',
    category: 'emergency-fund',
    priority: 'high',
    isRecurring: true,
    reminderFrequency: 'monthly',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Japan Vacation',
    description: 'Save for a 2-week trip to Japan including flights, hotels, and activities',
    targetAmount: 8000,
    currentAmount: 3200,
    targetDate: '2024-10-01',
    category: 'vacation',
    priority: 'medium',
    isRecurring: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10'
  },
  {
    id: '3',
    title: 'House Down Payment',
    description: 'Save 20% down payment for our first home',
    targetAmount: 60000,
    currentAmount: 25000,
    targetDate: '2025-06-01',
    category: 'house-down-payment',
    priority: 'high',
    isRecurring: true,
    reminderFrequency: 'monthly',
    createdAt: '2023-12-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '4',
    title: 'Car Purchase',
    description: 'Save for a reliable used car',
    targetAmount: 15000,
    currentAmount: 15000,
    targetDate: '2024-03-01',
    category: 'car-purchase',
    priority: 'medium',
    isRecurring: false,
    createdAt: '2023-09-01',
    updatedAt: '2024-02-28'
  }
];

export default function FinancialGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Filter and search goals
  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || goal.category === filterCategory;
      const matchesPriority = !filterPriority || goal.priority === filterPriority;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [goals, searchTerm, filterCategory, filterPriority]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => (g.currentAmount / g.targetAmount) >= 1).length;
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    return {
      totalGoals,
      completedGoals,
      activeGoals: totalGoals - completedGoals,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress
    };
  }, [goals]);

  const handleCreateGoal = async (goalData: any) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      ...goalData,
      targetDate: goalData.targetDate.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setGoals(prev => [newGoal, ...prev]);
  };

  const handleEditGoal = async (goalData: any) => {
    if (!editingGoal) return;

    const updatedGoal: Goal = {
      ...editingGoal,
      ...goalData,
      targetDate: goalData.targetDate.toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`
    );

    if (confirmDelete) {
      setGoals(prev => prev.filter(g => g.id !== goalId));
    }
  };

  const handleAddProgress = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const amount = window.prompt(
      `How much would you like to add to "${goal.title}"?`,
      '100'
    );

    if (amount && !isNaN(parseFloat(amount))) {
      const addAmount = parseFloat(amount);
      const newCurrentAmount = goal.currentAmount + addAmount;
      const wasCompleted = (goal.currentAmount / goal.targetAmount) >= 1;
      const isNowCompleted = (newCurrentAmount / goal.targetAmount) >= 1;

      setGoals(prev => prev.map(g =>
        g.id === goalId
          ? { ...g, currentAmount: newCurrentAmount, updatedAt: new Date().toISOString() }
          : g
      ));

      // Show celebration if goal was just completed
      if (!wasCompleted && isNowCompleted) {
        setCelebrationAchievement({
          id: Date.now().toString(),
          type: 'goal_completed',
          title: 'Goal Completed!',
          description: `Congratulations! You've successfully completed your "${goal.title}" goal.`,
          amount: goal.targetAmount,
          goalTitle: goal.title
        });
        setShowCelebration(true);
      }
    }
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'emergency-fund', label: 'Emergency Fund' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'house-down-payment', label: 'House Down Payment' },
    { value: 'car-purchase', label: 'Car Purchase' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'education', label: 'Education' },
    { value: 'debt-payoff', label: 'Debt Payoff' },
    { value: 'investment', label: 'Investment' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'business', label: 'Business' },
    { value: 'other', label: 'Other' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
          <p className="text-gray-600 mt-1">
            Track your progress and achieve your financial dreams
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Goal
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Goals</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalGoals}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{statistics.completedGoals}</p>
              </div>
              <Award className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Saved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(statistics.totalCurrentAmount)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statistics.overallProgress.toFixed(1)}%
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-purple-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Select
              options={categoryOptions}
              value={filterCategory}
              onChange={setFilterCategory}
              className="sm:w-48"
            />

            <Select
              options={priorityOptions}
              value={filterPriority}
              onChange={setFilterPriority}
              className="sm:w-48"
            />
          </div>

          {/* Goals Grid */}
          {filteredGoals.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  onEdit={(goal) => {
                    setEditingGoal(goal);
                    setIsCreateModalOpen(true);
                  }}
                  onDelete={handleDeleteGoal}
                  onAddProgress={handleAddProgress}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {goals.length === 0 ? 'No goals yet' : 'No goals match your filters'}
              </h3>
              <p className="text-gray-500 mb-6">
                {goals.length === 0
                  ? 'Start by creating your first financial goal to begin your journey.'
                  : 'Try adjusting your search terms or filters.'
                }
              </p>
              {goals.length === 0 && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Creation/Edit Modal */}
      <GoalCreationForm
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={editingGoal ? handleEditGoal : handleCreateGoal}
        initialData={editingGoal || undefined}
      />

      {/* Achievement Celebration */}
      <AchievementCelebration
        achievement={celebrationAchievement}
        isVisible={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setCelebrationAchievement(null);
        }}
      />
    </div>
  );
}