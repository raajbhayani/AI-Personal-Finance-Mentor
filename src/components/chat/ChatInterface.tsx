'use client';

import React, { useState, useEffect } from 'react';
import FloatingChatButton from './FloatingChatButton';
import ChatWindow from './ChatWindow';

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate receiving messages when chat is closed
  useEffect(() => {
    if (!isChatOpen) {
      const timer = setTimeout(() => {
        setHasUnreadMessages(true);
        setUnreadCount(1);
      }, 30000); // Show notification after 30 seconds

      return () => clearTimeout(timer);
    } else {
      // Clear unread state when chat is opened
      setHasUnreadMessages(false);
      setUnreadCount(0);
      return undefined;
    }
  }, [isChatOpen]);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setIsMinimized(false);
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    setIsMinimized(false);
  };

  const handleChatMinimize = () => {
    setIsMinimized(true);
  };

  return (
    <div className={className}>
      {/* Floating Chat Button */}
      <FloatingChatButton
        onClick={handleChatToggle}
        isOpen={isChatOpen}
        hasUnreadMessages={hasUnreadMessages}
        unreadCount={unreadCount}
      />

      {/* Chat Window */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={handleChatClose}
        onMinimize={handleChatMinimize}
      />
    </div>
  );
}