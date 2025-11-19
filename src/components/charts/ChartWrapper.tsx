'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  ChartEvent,
  ActiveElement,
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
  isMobile?: boolean;
}

// Hook to detect mobile screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Common chart options with mobile optimization
const getCommonOptions = (type: string, isMobile = false): ChartOptions<any> => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  onHover: (event: ChartEvent, elements: ActiveElement[]) => {
    if (event.native?.target) {
      (event.native.target as HTMLElement).style.cursor = elements.length > 0 ? 'pointer' : 'default';
    }
  },
  plugins: {
    legend: {
      position: isMobile ? 'bottom' : 'bottom' as const,
      align: 'center',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: isMobile ? 15 : 20,
        boxWidth: isMobile ? 12 : 15,
        boxHeight: isMobile ? 12 : 15,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: isMobile ? 11 : 12,
          weight: '500'
        },
        color: '#374151',
        generateLabels: function(chart: ChartJS) {
          const labels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
          // Limit legend items on mobile for better readability
          return isMobile && labels.length > 6 ? labels.slice(0, 5).concat([{
            text: '... +' + (labels.length - 5) + ' more',
            fillStyle: '#6B7280',
            strokeStyle: '#6B7280',
            hidden: false,
            lineCap: 'butt' as const,
            lineDash: [],
            lineDashOffset: 0,
            lineJoin: 'miter' as const,
            pointStyle: 'circle',
            rotation: 0,
            textAlign: 'left' as const,
            borderRadius: 0,
            datasetIndex: -1
          }]) : labels;
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: isMobile ? 12 : 8,
      displayColors: true,
      padding: isMobile ? 16 : 12,
      caretPadding: isMobile ? 8 : 6,
      titleFont: {
        family: 'Inter, system-ui, sans-serif',
        size: isMobile ? 14 : 13,
        weight: '600'
      },
      bodyFont: {
        family: 'Inter, system-ui, sans-serif',
        size: isMobile ? 13 : 12,
        weight: '400'
      },
      titleSpacing: isMobile ? 8 : 6,
      bodySpacing: isMobile ? 6 : 4,
      footerSpacing: isMobile ? 8 : 6,
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
          size: isMobile ? 10 : 11
        },
        color: '#6B7280',
        maxRotation: isMobile ? 45 : 0,
        minRotation: isMobile ? 45 : 0,
        maxTicksLimit: isMobile ? 6 : 12,
        callback: function(this: any, value: any, index: number): string | number | undefined {
          // On mobile, show fewer ticks to prevent overcrowding
          if (isMobile && this.getLabelForValue) {
            const label = this.getLabelForValue(value);
            return typeof label === 'string' && label.length > 8
              ? label.substring(0, 6) + '...'
              : label;
          }
          return this.getLabelForValue ? this.getLabelForValue(value) : value;
        }
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
          size: isMobile ? 10 : 11
        },
        color: '#6B7280',
        maxTicksLimit: isMobile ? 5 : 8,
        callback: function(value: any) {
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: isMobile && Math.abs(value) >= 1000 ? 'compact' : 'standard'
          }).format(value);
          return formatted;
        }
      }
    }
  } : undefined
});

// Line Chart Component
export function LineChart({ data, options, className, height = 300, isMobile: propIsMobile }: BaseChartProps) {
  const detectedIsMobile = useIsMobile();
  const isMobile = propIsMobile ?? detectedIsMobile;
  const mobileHeight = isMobile ? Math.min(height, 250) : height;

  const defaultOptions = getCommonOptions('line', isMobile);
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full touch-manipulation', className)} style={{ height: mobileHeight }}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
}

// Bar Chart Component
export function BarChart({ data, options, className, height = 300, isMobile: propIsMobile }: BaseChartProps) {
  const detectedIsMobile = useIsMobile();
  const isMobile = propIsMobile ?? detectedIsMobile;
  const mobileHeight = isMobile ? Math.min(height, 250) : height;

  const defaultOptions = getCommonOptions('bar', isMobile);
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full touch-manipulation', className)} style={{ height: mobileHeight }}>
      <Bar data={data} options={mergedOptions} />
    </div>
  );
}

// Doughnut Chart Component
export function DoughnutChart({ data, options, className, height = 300, isMobile: propIsMobile }: BaseChartProps) {
  const detectedIsMobile = useIsMobile();
  const isMobile = propIsMobile ?? detectedIsMobile;
  const mobileHeight = isMobile ? Math.min(height, 220) : height;

  const defaultOptions = getCommonOptions('doughnut', isMobile);
  const mergedOptions = {
    ...defaultOptions,
    cutout: isMobile ? '55%' : '60%',
    plugins: {
      ...defaultOptions.plugins,
      legend: {
        ...defaultOptions.plugins?.legend,
        position: isMobile ? 'bottom' : 'right' as const
      }
    },
    ...options
  };

  return (
    <div className={cn('w-full touch-manipulation', className)} style={{ height: mobileHeight }}>
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
}

// Pie Chart Component
export function PieChart({ data, options, className, height = 300, isMobile: propIsMobile }: BaseChartProps) {
  const detectedIsMobile = useIsMobile();
  const isMobile = propIsMobile ?? detectedIsMobile;
  const mobileHeight = isMobile ? Math.min(height, 220) : height;

  const defaultOptions = getCommonOptions('pie', isMobile);
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={cn('w-full touch-manipulation', className)} style={{ height: mobileHeight }}>
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