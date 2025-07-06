import React from 'react';

const Card = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  children, 
  className = '' 
}) => {
  const variants = {
    default: 'bg-white border-gray-200',
    primary: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    pink: 'bg-pink-50 border-pink-200',
    teal: 'bg-teal-50 border-teal-200'
  };

  return (
    <div className={`${variants[variant]} border rounded-lg p-4 ${className}`}>
      {(title || subtitle || Icon) && (
        <div className="flex items-center space-x-3 mb-3">
          {Icon && <Icon size={20} className="text-gray-600" />}
          <div>
            {title && <h3 className="font-medium text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;