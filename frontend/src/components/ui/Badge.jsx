const variantSubtle = {
  brand: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200/80',
};

const dotColors = {
  brand: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  purple: 'bg-violet-500',
};

const variantSolid = {
  brand: 'bg-indigo-600 text-white border-transparent',
  success: 'bg-emerald-600 text-white border-transparent',
  warning: 'bg-amber-500 text-white border-transparent',
  danger: 'bg-rose-600 text-white border-transparent',
  info: 'bg-sky-600 text-white border-transparent',
  neutral: 'bg-slate-700 text-white border-transparent',
  purple: 'bg-violet-600 text-white border-transparent',
};

const sizes = {
  xs: 'px-2 py-0.5 text-[10px] gap-1 rounded-md font-bold',
  sm: 'px-2.5 py-0.5 text-xs gap-1.5 rounded-full font-bold',
  md: 'px-3 py-1 text-xs gap-1.5 rounded-full font-extrabold',
};

export const Badge = ({
  children,
  variant = 'brand',
  solid = false,
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
  ...props
}) => {
  const colorClass = solid
    ? (variantSolid[variant] || variantSolid.brand)
    : (variantSubtle[variant] || variantSubtle.brand);

  const dotColorClass = dotColors[variant] || dotColors.brand;
  const sizeClass = sizes[size] || sizes.sm;

  return (
    <span
      className={`inline-flex items-center border tracking-tight leading-none ${colorClass} ${sizeClass} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColorClass} ${
            pulse ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

