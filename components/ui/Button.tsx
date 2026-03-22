'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "px-8 py-4 text-sm tracking-widest uppercase font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-black text-white border border-black hover:bg-opacity-80 dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200",
    secondary: "bg-white text-black border border-black hover:bg-gray-50 dark:bg-black dark:text-white dark:border-white dark:hover:bg-neutral-900",
    outline: "bg-transparent text-black border border-gray-300 hover:border-black dark:text-white dark:border-gray-600 dark:hover:border-white"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
