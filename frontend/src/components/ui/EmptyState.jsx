import { Button } from './Button';

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto font-sans ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            <Button
              onClick={onAction}
              {...(actionTo ? { as: 'a', href: actionTo } : {})}
              size="md"
              variant="primary"
            >
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && (
            <Button
              onClick={onSecondaryAction}
              size="md"
              variant="secondary"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

