'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Minimize2, Maximize2, X, Bot } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  className?: string;
}

export default function ChatWindow({
  isOpen,
  onClose,
  onMinimize,
  className
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI Financial Mentor. I\'m here to help you with budgeting, saving, investing, and achieving your financial goals. How can I assist you today?',
      type: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(userMessage.content),
        type: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (message: string) => {
    setInputValue(message);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize?.();
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  // Simple AI response generator (replace with actual AI integration)
  const generateAIResponse = (userMessage: string): string => {
    const responses = {
      budget: "Creating a budget is a great first step! I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment. Would you like me to help you set up a personalized budget based on your income?",
      save: "Saving money consistently is key to financial success! Start with automating your savings - even $50 per month adds up. Consider opening a high-yield savings account and setting up automatic transfers. What's your current savings goal?",
      invest: "Investing is crucial for long-term wealth building! For beginners, I recommend starting with index funds or ETFs for diversification. Consider your risk tolerance and investment timeline. Are you looking for retirement planning or general investing advice?",
      debt: "Let's tackle your debt strategically! The debt avalanche method (paying minimums on all debts, then extra on highest interest) saves the most money. The debt snowball (smallest balance first) provides psychological wins. Which approach appeals to you more?",
      default: "That's a great question! I'm here to help you make informed financial decisions. Could you provide more details about your specific situation so I can give you more targeted advice?"
    };

    const message = userMessage.toLowerCase();
    if (message.includes('budget')) return responses.budget;
    if (message.includes('save') || message.includes('saving')) return responses.save;
    if (message.includes('invest') || message.includes('investment')) return responses.invest;
    if (message.includes('debt') || message.includes('loan')) return responses.debt;
    return responses.default;
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed bottom-20 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 transform z-40',
      isMinimized
        ? 'h-16 scale-95'
        : 'h-[600px] max-h-[calc(100vh-8rem)] scale-100',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Financial Mentor</h3>
            <p className="text-xs opacity-90">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={isMinimized ? handleMaximize : handleMinimize}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200"
            aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <ChatBubble
                  message={message.content}
                  type={message.type}
                  timestamp={message.timestamp}
                  showActions={message.type === 'ai'}
                  onCopy={() => {
                    // Handle copy action
                    console.log('Message copied');
                  }}
                  onLike={() => {
                    // Handle like action
                    console.log('Message liked');
                  }}
                  onDislike={() => {
                    // Handle dislike action
                    console.log('Message disliked');
                  }}
                  onRegenerate={() => {
                    // Handle regenerate action
                    console.log('Message regenerated');
                  }}
                />
              </div>
            ))}

            {isTyping && <TypingIndicator show={isTyping} />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && !isTyping && (
            <QuickActions
              onActionClick={handleQuickAction}
              disabled={isTyping}
            />
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about budgeting, saving, investing..."
                  disabled={isTyping}
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200',
                    'disabled:bg-gray-100 disabled:cursor-not-allowed resize-none'
                  )}
                  maxLength={500}
                />

                {/* Character count */}
                <div className="absolute bottom-1 right-12 text-xs text-gray-400">
                  {inputValue.length}/500
                </div>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className={cn(
                  'p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  inputValue.trim() && !isTyping
                    ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </>
      )}
    </div>
  );
}