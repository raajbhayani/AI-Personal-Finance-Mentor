'use client';

import React, { useEffect, useState } from 'react';
import { Award, Star, Trophy, Target, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { formatCurrency } from '../../lib/utils/dashboard';

interface Achievement {
  id: string;
  type: 'goal_completed' | 'milestone_reached' | 'streak_achieved' | 'savings_target';
  title: string;
  description: string;
  amount?: number;
  icon?: React.ReactNode;
  goalTitle?: string;
}

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const achievementIcons = {
  goal_completed: <Trophy className="h-8 w-8" />,
  milestone_reached: <Target className="h-8 w-8" />,
  streak_achieved: <Star className="h-8 w-8" />,
  savings_target: <Award className="h-8 w-8" />,
};

const achievementColors = {
  goal_completed: 'from-yellow-400 via-orange-500 to-red-500',
  milestone_reached: 'from-blue-400 via-purple-500 to-pink-500',
  streak_achieved: 'from-green-400 via-blue-500 to-purple-500',
  savings_target: 'from-emerald-400 via-teal-500 to-cyan-500',
};

const celebrationEmojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈', '🏆', '🥳'];

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  emoji: string;
  velocity: { x: number; y: number };
  scale: number;
}

export default function AchievementCelebration({
  achievement,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000
}: AchievementCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto close after duration
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, autoClose, duration, onClose]);

  // Generate confetti when achievement shows
  useEffect(() => {
    if (isVisible && achievement) {
      setIsAnimating(true);
      generateConfetti();

      // Stop confetti animation after 3 seconds
      const stopTimer = setTimeout(() => {
        setIsAnimating(false);
        setConfetti([]);
      }, 3000);

      return () => clearTimeout(stopTimer);
    }
    return undefined;
  }, [isVisible, achievement]);

  const generateConfetti = () => {
    const pieces: ConfettiPiece[] = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB6C1'];

    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2
        },
        scale: Math.random() * 0.5 + 0.5
      });
    }

    setConfetti(pieces);

    // Animate confetti falling
    const animateConfetti = () => {
      setConfetti(prev =>
        prev.map(piece => ({
          ...piece,
          x: piece.x + piece.velocity.x,
          y: piece.y + piece.velocity.y,
          rotation: piece.rotation + 5,
          velocity: {
            x: piece.velocity.x * 0.99,
            y: piece.velocity.y + 0.1
          }
        })).filter(piece => piece.y < window.innerHeight + 20)
      );
    };

    if (isAnimating) {
      const interval = setInterval(animateConfetti, 50);
      return () => clearInterval(interval);
    }
  };

  if (!isVisible || !achievement) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Confetti */}
        {confetti.map(piece => (
          <div
            key={piece.id}
            className="fixed pointer-events-none z-51 text-2xl"
            style={{
              left: piece.x,
              top: piece.y,
              transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
              color: piece.color,
            }}
          >
            {piece.emoji}
          </div>
        ))}

        {/* Achievement Modal */}
        <div
          className={cn(
            'relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden',
            'transform transition-all duration-500',
            'animate-bounce-in'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient Header */}
          <div className={cn(
            'relative h-32 bg-gradient-to-br',
            achievementColors[achievement.type],
            'flex items-center justify-center'
          )}>
            {/* Floating particles animation */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 20}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${2 + i * 0.5}s`
                  }}
                />
              ))}
            </div>

            {/* Achievement Icon */}
            <div className="relative z-10 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white animate-pulse">
              {achievement.icon || achievementIcons[achievement.type]}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-200"
              aria-label="Close celebration"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Achievement Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 {achievement.title}
            </h2>

            {/* Achievement Description */}
            <p className="text-gray-600 mb-4 leading-relaxed">
              {achievement.description}
            </p>

            {/* Goal Details */}
            {achievement.goalTitle && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-500 mb-1">Goal Achieved</div>
                <div className="font-semibold text-gray-900">{achievement.goalTitle}</div>
              </div>
            )}

            {/* Amount Achievement */}
            {achievement.amount && (
              <div className="bg-emerald-50 rounded-lg p-4 mb-4 border border-emerald-200">
                <div className="text-sm text-emerald-600 mb-1">Amount Saved</div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(achievement.amount)}
                </div>
              </div>
            )}

            {/* Celebration Message */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border border-yellow-200">
              <div className="flex items-center justify-center space-x-2 text-yellow-800">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">Keep up the great work!</span>
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Every step brings you closer to financial freedom.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  // Share achievement functionality
                  navigator.share?.({
                    title: achievement.title,
                    text: achievement.description,
                  }).catch(() => {
                    // Fallback for browsers without Web Share API
                    navigator.clipboard.writeText(
                      `🎉 ${achievement.title}: ${achievement.description}`
                    );
                  });
                }}
                className={cn(
                  'flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all duration-200',
                  'bg-gradient-to-r transform hover:scale-105 active:scale-95',
                  achievementColors[achievement.type]
                )}
              >
                Share Achievement
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-50px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
}