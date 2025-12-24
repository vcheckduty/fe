/**
 * V-Check Component Library
 * 
 * Modern, reusable UI components for police attendance system
 * Built with React, TypeScript, and Tailwind CSS
 */

// ==================== LAYOUT COMPONENTS ====================

/**
 * Logo - Animated SVG logo with GPS pin design
 * @param size - 'sm' | 'md' | 'lg' | 'xl'
 * @param className - Additional CSS classes
 */
export { default as Logo } from './Logo';

/**
 * DateCard - Display current date with custom message
 * @param dayName - Day of the week
 * @param date - Date number
 * @param message - Custom message
 * @param count - Number to display
 * @param countLabel - Label for the count
 */
export { default as DateCard } from './DateCard';

// ==================== USER COMPONENTS ====================

/**
 * UserCard - Display user information card
 * @param name - User's full name
 * @param subtitle - Additional info (role, department, etc.)
 * @param imageUrl - Avatar image URL
 * @param time - Time display
 * @param badge - Badge indicator
 * @param onClick - Click handler
 */
export { default as UserCard } from './UserCard';

/**
 * QueueList - List of users in queue
 * @param title - List title
 * @param items - Array of queue items
 * @param maxVisible - Maximum visible items
 * @param emptyMessage - Message when list is empty
 */
export { default as QueueList } from './QueueList';

// ==================== DATA VISUALIZATION ====================

/**
 * ChartCard - Bar chart component
 * @param title - Chart title
 * @param data - Array of data items
 * @param type - 'bar' | 'pie'
 * @param legend - Show/hide legend
 */
export { default as ChartCard } from './ChartCard';

/**
 * StatCard - Statistics display card
 */
export { default as StatCard } from './StatCard';

/**
 * StatsCard - Alternative stats card (UI folder)
 */
export { default as StatsCard } from './ui/StatsCard';

// ==================== FORM COMPONENTS ====================

/**
 * OTPInput - 6-digit OTP input with auto-focus
 * @param length - Number of digits (default: 6)
 * @param onComplete - Callback when OTP is complete
 * @param disabled - Disable input
 */
export { default as OTPInput } from './OTPInput';

/**
 * Button - Styled button component
 */
export { default as Button } from './ui/Button';

// ==================== UTILITY COMPONENTS ====================

/**
 * StatusBadge - Status indicator badge
 */
export { default as StatusBadge } from './StatusBadge';

/**
 * ShareLinkCard - Share link with copy functionality
 * @param link - URL to share
 * @param title - Card title
 * @param description - Card description
 */
export { default as ShareLinkCard } from './ShareLinkCard';

// ==================== TYPES ====================

export interface UserCardProps {
  name: string;
  subtitle?: string;
  imageUrl?: string;
  time?: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export interface QueueItem {
  id: string;
  name: string;
  time: string;
  imageUrl?: string;
  status?: 'waiting' | 'active' | 'completed';
}

export interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}
