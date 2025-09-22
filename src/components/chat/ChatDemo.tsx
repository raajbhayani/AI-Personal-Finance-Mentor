'use client';

import React from 'react';
import ChatInterface from './ChatInterface';

interface ChatDemoProps {
  className?: string;
}

export default function ChatDemo({ className }: ChatDemoProps) {
  return (
    <div className={className}>
      {/* Page Content */}
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            AI Financial Mentor Chat Demo
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              How to Use the Chat Interface
            </h2>

            <div className="space-y-4 text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Look for the floating chat button</p>
                  <p>You'll see an animated chat button in the bottom-right corner with gradient colors.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Click to open the chat window</p>
                  <p>The chat window will smoothly expand with your AI Financial Mentor ready to help.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Try the quick action buttons</p>
                  <p>Use the pre-defined questions for common financial topics or type your own.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-800">Interact with AI responses</p>
                  <p>Copy, like, dislike, or regenerate AI responses using the action buttons.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Features Included
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Animated floating chat button</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Expandable chat window</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Typing indicators</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Message timestamps</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Quick action buttons</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Message interactions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Responsive design</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Accessibility features</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Sample Questions to Try
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>"Help me create a monthly budget"</li>
                <li>"What are some good investment options?"</li>
                <li>"How can I save money on expenses?"</li>
                <li>"Create a debt payoff strategy"</li>
                <li>"How much should I save for emergencies?"</li>
                <li>"What financial goals should I set?"</li>
                <li>"Give me money management tips"</li>
                <li>"How do I start investing?"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface />
    </div>
  );
}