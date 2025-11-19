'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnreadMessages?: boolean;
  unreadCount?: number;
}

export default function FloatingChatButton({
  onClick,
  isOpen,
  hasUnreadMessages = false,
  unreadCount = 0
}: FloatingChatButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Show button after a delay when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Pulse animation for unread messages
  useEffect(() => {
    if (hasUnreadMessages && !isOpen) {
      setIsPulsing(true);
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasUnreadMessages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      <button
        onClick={onClick}
        className={cn(
          'relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform',
          'focus:outline-none focus:ring-4 focus:ring-blue-500/30',
          'hover:scale-110 active:scale-95',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700',
          isPulsing && 'animate-pulse'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open AI financial mentor chat'}
      >
        {/* Button Icon */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center text-white transition-all duration-300',
          isOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
        )}>
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </div>

        {/* Unread Badge */}
        {hasUnreadMessages && unreadCount > 0 && !isOpen && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}

        {/* Ripple Effect */}
        <div className={cn(
          'absolute inset-0 rounded-full transition-all duration-1000',
          !isOpen && 'animate-ping opacity-75 bg-blue-400',
          isOpen && 'opacity-0'
        )} />
      </button>

      {/* Welcome Tooltip */}
      {isVisible && !isOpen && !hasUnreadMessages && (
        <div className="absolute bottom-16 right-0 mb-2 animate-fadeIn">
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
            <div className="text-sm text-gray-700 font-medium">
              👋 Hi! I'm your AI Financial Mentor
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Click here to get personalized financial advice
            </div>

            {/* Arrow */}
            <div className="absolute bottom-0 right-4 transform translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200 absolute -top-1"></div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Help Indicators */}
      {!isOpen && (
        <div className="absolute bottom-16 right-16 space-y-2">
          {/* Budget Help Indicator */}
          <div className={cn(
            'w-3 h-3 rounded-full bg-blue-500 transition-all duration-500 delay-1000',
            isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} />

          {/* Investment Help Indicator */}
          <div className={cn(
            'w-3 h-3 rounded-full bg-emerald-500 transition-all duration-500 delay-1200',
            isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} />

          {/* Savings Help Indicator */}
          <div className={cn(
            'w-3 h-3 rounded-full bg-amber-500 transition-all duration-500 delay-1400',
            isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} />
        </div>
      )}
    </div>
  );
}