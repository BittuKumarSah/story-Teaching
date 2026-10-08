import { cn } from '../utils/helpers';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-14 h-14 border-4',
};

export default function LoadingSpinner({ size = 'md', message, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div
        className={cn(
          'rounded-full border-primary-200 border-t-primary-600 animate-spin',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
}