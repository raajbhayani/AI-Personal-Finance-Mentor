'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  show: boolean;
  message?: string;
}

export default function TypingIndicator({
  show,
  message = 'AI is thinking...'
}: TypingIndicatorProps) {
  if (!show) return null;

  return (
    <div className="flex w-full mb-4 animate-fadeIn">
      <div className="flex max-w-[80%] md:max-w-[70%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-600 text-white mr-3">
          <Bot className="h-4 w-4" />
        </div>

        {/* Typing Container */}
        <div className="flex flex-col">
          {/* Typing Bubble */}
          <div className="relative px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-md shadow-sm">
            <div className="flex items-center space-x-3">
              {/* Animated Dots */}
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>

              {/* Message */}
              <span className="text-sm text-gray-500 animate-pulse">
                {message}
              </span>
            </div>

            {/* Tail */}
            <div className="absolute top-0 left-0 -translate-x-1 w-3 h-3 bg-white border-l border-b border-gray-200 rotate-45 rounded-bl-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}