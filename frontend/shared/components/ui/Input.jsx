import React from 'react';

const Input = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  className = '',
  focusColor = 'blue', // blue, green, purple, orange, etc.
  ...props 
}) => {
  const focusColors = {
    blue: 'focus:ring-blue-500 focus:border-transparent',
    green: 'focus:ring-green-500 focus:border-transparent',
    purple: 'focus:ring-purple-500 focus:border-transparent',
    orange: 'focus:ring-orange-500 focus:border-transparent',
    indigo: 'focus:ring-indigo-500 focus:border-transparent',
    teal: 'focus:ring-teal-500 focus:border-transparent',
    pink: 'focus:ring-pink-500 focus:border-transparent'
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 ${focusColors[focusColor]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    />
  );
};

export default Input;