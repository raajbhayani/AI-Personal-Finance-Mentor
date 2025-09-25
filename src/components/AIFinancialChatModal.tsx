'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils/cn';
import ChatBubble from './chat/ChatBubble';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

interface UserFinancialData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: string;
  }>;
}

interface AIFinancialChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFinancialData: UserFinancialData;
}

export default function AIFinancialChatModal({
  isOpen,
  onClose,
  userFinancialData
}: AIFinancialChatModalProps) {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello ${user?.firstName || 'there'}! I'm your AI Financial Mentor. I can see you have a total balance of $${userFinancialData.totalBalance.toLocaleString()} and a ${userFinancialData.savingsRate}% savings rate. I'm here to help you with budgeting, saving, investing, and achieving your financial goals. What would you like to discuss today?`,
      type: 'ai',
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversationId: conversationId,
          context: {
            includeRecentTransactions: true,
            includeFinancialSummary: true,
            maxHistory: 10,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.response,
          type: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);

        // Set conversation ID for future messages
        if (data.data.conversationId && !conversationId) {
          setConversationId(data.data.conversationId);
        }

        // Show notification for successful AI response
        if (data.data.metadata?.financialHealthScore) {
          addNotification({
            type: 'info',
            title: 'Financial Health Update',
            message: `Your current financial health score: ${data.data.metadata.financialHealthScore}/100`,
            duration: 4000
          });
        }
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I\'m having trouble processing your request right now. This might be due to high demand or a temporary service issue. Please try again in a moment, or feel free to ask a different question.',
        type: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      addNotification({
        type: 'error',
        title: 'AI Service Error',
        message: 'Unable to get AI response. Please try again.',
        duration: 5000
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "How can I improve my savings rate?",
    "What should I budget for this month?",
    "Help me create a financial goal",
    "Review my recent spending",
    "Investment advice for beginners"
  ];

  const handleQuickAction = (message: string) => {
    setInputValue(message);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl h-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Financial Mentor</h3>
              <p className="text-sm opacity-90">
                {isTyping ? 'Analyzing your financial situation...' : 'Ready to help with personalized advice'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="group">
              <ChatBubble
                message={message.content}
                type={message.type}
                timestamp={message.timestamp}
                showActions={message.type === 'ai'}
                onCopy={() => {
                  navigator.clipboard.writeText(message.content);
                  addNotification({
                    type: 'success',
                    title: 'Copied!',
                    message: 'Message copied to clipboard',
                    duration: 2000
                  });
                }}
                onLike={() => {
                  addNotification({
                    type: 'success',
                    title: 'Feedback Received',
                    message: 'Thank you for the positive feedback!',
                    duration: 3000
                  });
                }}
                onDislike={() => {
                  addNotification({
                    type: 'info',
                    title: 'Feedback Received',
                    message: 'Thank you for the feedback. We\'ll work to improve!',
                    duration: 3000
                  });
                }}
                onRegenerate={() => {
                  // Could implement regeneration logic here
                  addNotification({
                    type: 'info',
                    title: 'Regeneration',
                    message: 'Response regeneration is not yet available',
                    duration: 3000
                  });
                }}
              />
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && !isTyping && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-3">Quick questions to get started:</div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your finances..."
                disabled={isTyping}
                className={cn(
                  'w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200',
                  'disabled:bg-gray-100 disabled:cursor-not-allowed resize-none'
                )}
                maxLength={2000}
              />

              {/* Character count */}
              <div className="absolute bottom-1 right-12 text-xs text-gray-400">
                {inputValue.length}/2000
              </div>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className={cn(
                'p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[48px] h-[48px] flex items-center justify-center',
                inputValue.trim() && !isTyping
                  ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500 text-center">
            Press Enter to send • Shift+Enter for new line • Get personalized advice based on your financial data
          </div>
        </div>
      </div>
    </div>
  );
}