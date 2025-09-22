'use client';

import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { cn } from '../../lib/utils/cn';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Custom theme colors
const themeColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#06B6D4',
  success: '#059669',
  purple: '#8B5CF6',
  pink: '#EC4899',
  gray: '#6B7280'
};

const gradientColors = [
  'rgba(59, 130, 246, 0.8)',   // Blue
  'rgba(16, 185, 129, 0.8)',   // Emerald
  'rgba(245, 158, 11, 0.8)',   // Amber
  'rgba(239, 68, 68, 0.8)',    // Red
  'rgba(249, 115, 22, 0.8)',   // Orange
  'rgba(6, 182, 212, 0.8)',    // Cyan
  'rgba(139, 92, 246, 0.8)',   // Violet
  'rgba(236, 72, 153, 0.8)',   // Pink
  'rgba(107, 114, 128, 0.8)',  // Gray
  'rgba(34, 197, 94, 0.8)'     // Green
];

interface BaseChartProps {
  data: ChartData<any>;
  options?: ChartOptions<any>;
  className?: string;
  height?: number;
}

// Common chart options
const getCommonOptions = (type: string): ChartOptions<any> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: '500'
        },
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12,
      titleFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 13,
        weight: '600'
      },
      bodyFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 12,
        weight: '400'
      },
      callbacks: {
        label: function(context: any) {
          const label = context.dataset.label || '';
          const value = context.parsed.y ?? context.parsed;
          const formattedValue = typeof value === 'number'
            ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value)
            : value;
          return `${label}: ${formattedValue}`;
        }
      }
    }
  },
  scales: type === 'line' || type === 'bar' ? {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 11
        },
        color: '#6B7280'
      }
    },
    y: {
      grid: {
        color: 'rgba(107, 114, 128, 0.1)',
        borderDash: [5, 5]
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 11
        },
        color: '#6B7280',
        callback: function(value: any) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
      }
    }
  } : undefined
});

// Line Chart Component
export function LineChart({ data, options, className, height = 300 }: BaseChartProps) {
  const defaultOptions = getCommonOptions('line');
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
}

// Bar Chart Component
export function BarChart({ data, options, className, height = 300 }: BaseChartProps) {
  const defaultOptions = getCommonOptions('bar');
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Bar data={data} options={mergedOptions} />
    </div>
  );
}

// Doughnut Chart Component
export function DoughnutChart({ data, options, className, height = 300 }: BaseChartProps) {
  const defaultOptions = getCommonOptions('doughnut');
  const mergedOptions = {
    ...defaultOptions,
    cutout: '60%',
    plugins: {
      ...defaultOptions.plugins,
      legend: {
        ...defaultOptions.plugins?.legend,
        position: 'right' as const
      }
    },
    ...options
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
}

// Pie Chart Component
export function PieChart({ data, options, className, height = 300 }: BaseChartProps) {
  const defaultOptions = getCommonOptions('pie');
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Pie data={data} options={mergedOptions} />
    </div>
  );
}

// Utility function to create gradients
export const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color.replace('0.8', '0.1'));
  return gradient;
};

// Utility function to get theme colors
export const getThemeColors = (count: number) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(gradientColors[i % gradientColors.length]);
  }
  return colors;
};

// Utility function to format currency for charts
export const formatChartCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export { themeColors, gradientColors };