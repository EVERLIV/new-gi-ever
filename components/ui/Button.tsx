import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  leftIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  leftIcon,
  className = '',
  ...props
}) => {
  // Removed `disabled:opacity-60` to apply more specific styles per variant.
  const baseClasses = "inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-soft-md";
  
  // Added specific `disabled:` styles to each variant for better visual feedback.
  // This prevents the button's content (like an icon) from becoming transparent.
  const variantClasses = {
    primary: 'bg-gradient-to-br from-primary to-primary-light text-white focus:ring-primary disabled:bg-primary/60 disabled:bg-gradient-none',
    secondary: 'bg-gray-100 text-on-surface-variant hover:bg-gray-200 focus:ring-gray-400 border-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
    danger: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent disabled:bg-accent/60',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default Button;