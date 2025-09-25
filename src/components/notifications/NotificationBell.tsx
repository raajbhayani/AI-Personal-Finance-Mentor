'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationCenter from './NotificationCenter';
import { cn } from '@/lib/utils/cn';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    removeNotification(id);
  };

  const calculateStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority || 'medium'] = (byPriority[notification.priority || 'medium'] || 0) + 1;
    });

    return {
      total,
      unread,
      byType,
      byPriority
    };
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={cn(
          'relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200',
          className
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6 text-gray-600" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulse animation for urgent notifications */}
        {notifications.some(n => !n.read && n.priority === 'urgent') && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-5 w-5 animate-ping"></span>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter
        notifications={notifications}
        isOpen={isOpen}
        onClose={handleClose}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={handleDelete}
        onClearAll={clearAll}
        stats={calculateStats()}
      />
    </>
  );
}