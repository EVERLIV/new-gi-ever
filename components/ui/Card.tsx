
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface rounded-2xl shadow-soft border border-gray-200/60 p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;