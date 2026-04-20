import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick, 
  disabled = false,
  ...props 
}) {
  const baseStyles = "transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "font-medium text-sm px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30";
      break;
    case 'secondary':
      variantStyles = "font-medium text-sm px-5 py-2.5 rounded-lg text-gray-600 bg-gray-200 hover:bg-gray-300";
      break;
    case 'soft-blue':
      variantStyles = "text-xs font-medium px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg";
      break;
    case 'danger-icon':
      variantStyles = "p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg";
      break;
    case 'text':
      variantStyles = "text-sm font-semibold text-blue-600 hover:text-blue-800";
      break;
    default:
      variantStyles = "font-medium text-sm px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white";
  }

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
