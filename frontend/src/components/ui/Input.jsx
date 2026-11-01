import { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export const Input = forwardRef(function Input(
  {
    id,
    name,
    label,
    error,
    helperText,
    type = 'text',
    leftIcon,
    rightIcon,
    isPassword = false,
    className = '',
    inputClassName = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;
  const isTypePassword = isPassword || type === 'password';
  const resolvedType = isTypePassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full text-left font-sans ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full py-2.5 text-sm rounded-xl transition-all duration-150 outline-hidden bg-white text-slate-800 placeholder-slate-400 border disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${isTypePassword || rightIcon || error ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20'
              : 'border-slate-200/90 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
          } ${inputClassName}`}
          {...props}
        />

        {/* Right Action: Password Toggle or Error Icon or Custom Icon */}
        {isTypePassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        ) : error ? (
          <div className="absolute right-3 pointer-events-none text-rose-500">
            <ExclamationCircleIcon className="w-4 h-4" />
          </div>
        ) : rightIcon ? (
          <div className="absolute right-3 flex items-center text-slate-400">
            {rightIcon}
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          aria-live="polite"
          className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1"
        >
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-xs text-slate-500 font-medium"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;

