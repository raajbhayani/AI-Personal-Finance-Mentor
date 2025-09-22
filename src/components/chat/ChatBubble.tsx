'use client';

import React from 'react';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface ChatBubbleProps {
  message: string;
  type: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  showActions?: boolean;
  onCopy?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
}

export default function ChatBubble({
  message,
  type,
  timestamp,
  isTyping = false,
  showActions = false,
  onCopy,
  onLike,
  onDislike,
  onRegenerate,
}: ChatBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    onCopy?.();
  };

  return (
    <div className={cn(
      'flex w-full mb-4',
      type === 'user' ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'flex max-w-[80%] md:max-w-[70%]',
        type === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* Avatar */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          type === 'user'
            ? 'bg-blue-600 text-white ml-3'
            : 'bg-gradient-to-br from-emerald-500 to-blue-600 text-white mr-3'
        )}>
          {type === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* Message Container */}
        <div className="flex flex-col">
          {/* Message Bubble */}
          <div className={cn(
            'relative px-4 py-3 rounded-2xl shadow-sm',
            type === 'user'
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
          )}>
            {/* Typing Animation */}
            {isTyping ? (
              <div className="flex items-center space-x-1 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message}
              </div>
            )}

            {/* Tail */}
            <div className={cn(
              'absolute top-0 w-3 h-3',
              type === 'user'
                ? 'right-0 translate-x-1 bg-blue-600 rotate-45 rounded-br-sm'
                : 'left-0 -translate-x-1 bg-white border-l border-b border-gray-200 rotate-45 rounded-bl-sm'
            )} />
          </div>

          {/* Timestamp and Actions */}
          <div className={cn(
            'flex items-center mt-1 space-x-2',
            type === 'user' ? 'justify-end' : 'justify-start'
          )}>
            <span className="text-xs text-gray-500">
              {formatTime(timestamp)}
            </span>

            {/* AI Message Actions */}
            {type === 'ai' && showActions && !isTyping && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  title="Copy message"
                  aria-label="Copy message"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={onLike}
                  className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
                  title="Like message"
                  aria-label="Like this response"
                >
                  <ThumbsUp className="h-3 w-3" />
                </button>
                <button
                  onClick={onDislike}
                  className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                  title="Dislike message"
                  aria-label="Dislike this response"
                >
                  <ThumbsDown className="h-3 w-3" />
                </button>
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  title="Regenerate response"
                  aria-label="Regenerate this response"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}