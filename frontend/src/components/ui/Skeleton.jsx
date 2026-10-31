export const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  ...props
}) => {
  const variantClasses = {
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    text: 'rounded-md h-4',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variantClasses[variant] || 'rounded-xl'} ${className}`}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
      <Skeleton className="w-full h-48 rounded-xl" />
      <div className="space-y-2 pt-1">
        <Skeleton variant="text" className="w-1/3 h-3" />
        <Skeleton variant="text" className="w-4/5 h-4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton variant="text" className="w-1/4 h-5" />
          <Skeleton className="w-16 h-7 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const StatsCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3 h-3" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <Skeleton variant="text" className="w-1/2 h-7" />
      <Skeleton variant="text" className="w-2/3 h-3 pt-1" />
    </div>
  );
};

export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton variant="text" className="w-full h-4" />
        </td>
      ))}
    </tr>
  );
};

export default Skeleton;
