'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils/cn';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedChildren, setDisplayedChildren] = useState(children);

  useEffect(() => {
    // Start transition when route changes
    setIsTransitioning(true);

    // Update children after a brief delay to allow exit animation
    const timer = setTimeout(() => {
      setDisplayedChildren(children);
      setIsTransitioning(false);
    }, 150); // Half of the transition duration

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className={cn("relative", className)}>
      {/* Main content with transition */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isTransitioning
            ? "opacity-0 transform translate-y-4 scale-[0.98]"
            : "opacity-100 transform translate-y-0 scale-100"
        )}
      >
        {displayedChildren}
      </div>

      {/* Loading overlay for smoother transitions */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}