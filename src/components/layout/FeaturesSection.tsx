'use client';

import React from 'react';
import {
  Brain,
  PieChart,
  Target,
  CreditCard,
  TrendingUp,
  Shield,
  Smartphone,
  MessageSquare,
  Bell,
  BarChart3,
  Wallet,
  Calculator,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized financial advice based on your spending patterns and goals.',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
  },
  {
    icon: PieChart,
    title: 'Smart Budgeting',
    description: 'Automatically categorize expenses and create intelligent budget recommendations.',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'from-emerald-50 to-emerald-100',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set financial goals and track your progress with visual milestones.',
    color: 'from-blue-600 to-emerald-600',
    bgColor: 'from-blue-50 to-emerald-100',
  },
  {
    icon: CreditCard,
    title: 'Expense Management',
    description: 'Track all your expenses in one place with automatic transaction import.',
    color: 'from-emerald-600 to-blue-600',
    bgColor: 'from-emerald-50 to-blue-100',
  },
  {
    icon: TrendingUp,
    title: 'Investment Insights',
    description: 'Get AI-driven investment recommendations tailored to your risk profile.',
    color: 'from-blue-500 to-emerald-500',
    bgColor: 'from-blue-50 to-emerald-50',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: '256-bit encryption and secure data handling to protect your information.',
    color: 'from-emerald-500 to-blue-500',
    bgColor: 'from-emerald-50 to-blue-50',
  },
];

const additionalFeatures = [
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Access your finances anywhere with our responsive mobile design.',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Support',
    description: 'Ask questions and get instant financial advice from our AI mentor.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Stay on track with intelligent alerts and reminders.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Deep dive into your financial data with comprehensive reports.',
  },
  {
    icon: Wallet,
    title: 'Multi-Account Support',
    description: 'Connect multiple bank accounts and credit cards in one dashboard.',
  },
  {
    icon: Calculator,
    title: 'Financial Calculators',
    description: 'Built-in tools for loan, mortgage, and investment calculations.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Master Your Finances
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive financial tools powered by artificial intelligence to help you make
            smarter decisions and achieve your financial goals faster.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div
                  className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent
                    className={`h-8 w-8 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Additional features */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              And Much More...
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover additional features designed to make financial management effortless and
              intelligent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-lg mr-4 flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to action within features */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            Explore All Features
            <TrendingUp className="ml-2 h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
}