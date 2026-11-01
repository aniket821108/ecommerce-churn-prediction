import { forwardRef } from 'react';

const cardVariants = {
  default: 'bg-white border border-slate-200/80 shadow-2xs',
  flat: 'bg-slate-50 border border-slate-200/80',
  interactive:
    'bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
  glass:
    'bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-xs',
  elevated: 'bg-white border border-slate-200/60 shadow-md',
};

export const Card = forwardRef(function Card(
  {
    children,
    variant = 'default',
    className = '',
    noPadding = false,
    ...props
  },
  ref
) {
  const variantClass = cardVariants[variant] || cardVariants.default;
  const paddingClass = noPadding ? '' : 'p-5 sm:p-6';

  return (
    <div
      ref={ref}
      className={`rounded-2xl overflow-hidden font-sans ${variantClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`pb-4 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', as = 'h3', ...props }) => {
  const Tag = as;
  return (
    <Tag className={`text-base font-extrabold text-slate-900 tracking-tight ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-slate-500 font-medium mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`pt-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`pt-4 mt-4 border-t border-slate-100 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export default Card;

