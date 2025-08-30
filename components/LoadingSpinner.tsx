import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
  // colorLight and colorDark are no longer needed as we use CSS variables
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'h-8 w-8', 
}) => {
  // Color will be inherited or explicitly set by var(--text-accent) or similar
  // For specific spinner color, parent can set `color: var(--some-spinner-color)`
  return (
    <svg 
        className={`animate-spin ${size}`} 
        style={{ color: 'var(--text-accent, currentColor)' }} // Fallback to currentColor if --text-accent is not defined in scope
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};
