import React from 'react';
import { Info, CheckCircle2, AlertCircle, X } from 'lucide-react';

const Alert = ({ 
  variant = 'info', 
  title, 
  children, 
  dismissible = false, 
  onDismiss,
  className = ''
}) => {
  const variants = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: Info },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle2 },
    warning: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: AlertCircle },
    danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: AlertCircle }
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Icon size={20} className={config.text} />
        <div className="flex-1">
          {title && (
            <h4 className={`text-sm font-medium ${config.text} mb-1`}>{title}</h4>
          )}
          <div className={`text-sm ${config.text}`}>{children}</div>
        </div>
        {dismissible && (
          <button onClick={onDismiss} className={`${config.text} hover:opacity-75`}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;