export const Loader = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[2.5px]',
    lg: 'w-12 h-12 border-3',
  };

  const spinnerClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center py-10 gap-3 ${className}`}
    >
      <div
        className={`${spinnerClass} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold text-slate-500 tracking-wide">
        {text || 'Loading...'}
      </span>
      <span className="sr-only">{text || 'Loading content, please wait.'}</span>
    </div>
  );
};

export default Loader;
