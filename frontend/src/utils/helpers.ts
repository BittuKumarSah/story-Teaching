import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getUnderstandingColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600 bg-green-100';
  if (percentage >= 75) return 'text-blue-600 bg-blue-100';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

export function getUnderstandingLabel(percentage: number): string {
  if (percentage >= 90) return 'Excellent!';
  if (percentage >= 75) return 'Great job!';
  if (percentage >= 50) return 'Good effort!';
  return 'Keep practicing!';
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'text-green-600 bg-green-100';
    case 'intermediate': return 'text-blue-600 bg-blue-100';
    case 'advanced': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}