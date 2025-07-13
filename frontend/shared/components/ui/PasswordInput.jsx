import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn, inputVariants } from '../../design-system';

const PasswordInput = React.forwardRef(({
  variant = 'default',
  size = 'md',
  disabled = false,
  error = false,
  showToggle = true,
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 pl-2 pr-8 text-sm',
    md: 'h-10 pl-3 pr-10',
    lg: 'h-12 pl-4 pr-12 text-lg',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-4 h-4 right-2',
    md: 'w-5 h-5 right-3',
    lg: 'w-6 h-6 right-4',
  };

  // Determine variant based on error state
  const inputVariant = error ? 'error' : variant;

  return (
    <div className="relative">
      <input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        disabled={disabled}
        className={cn(
          inputVariants(inputVariant),
          sizeClasses[size],
          showToggle && 'pr-10',
          className
        )}
        autoComplete="new-password"
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        {...props}
      />
      
      {showToggle && (
        <button
          type="button"
          className={cn(
            'absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none',
            iconSizeClasses[size],
            disabled && 'cursor-not-allowed opacity-50'
          )}
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
