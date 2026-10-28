const colorThemes = {
  violet: {
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    borderHover: 'group-hover:border-violet-300',
    badgeBg: 'bg-violet-50 text-violet-700',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    borderHover: 'group-hover:border-blue-300',
    badgeBg: 'bg-blue-50 text-blue-700',
  },
  cyan: {
    iconBg: 'bg-cyan-50',
    iconText: 'text-cyan-600',
    borderHover: 'group-hover:border-cyan-300',
    badgeBg: 'bg-cyan-50 text-cyan-700',
  },
  green: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    borderHover: 'group-hover:border-emerald-300',
    badgeBg: 'bg-emerald-50 text-emerald-700',
  },
  red: {
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    borderHover: 'group-hover:border-rose-300',
    badgeBg: 'bg-rose-50 text-rose-700',
  },
  yellow: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    borderHover: 'group-hover:border-amber-300',
    badgeBg: 'bg-amber-50 text-amber-700',
  },
};

const StatsCard = (props) => {
  const { title, value, icon, color = 'violet', trend, trendLabel, subtitle } = props;
  const CardIcon = icon;
  const theme = colorThemes[color] || colorThemes.violet;
  const isPositive = trend > 0;

  return (
    <div
      className={`group relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden ${theme.borderHover}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </p>

          {trend !== undefined ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold pt-1">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-bold ${
                  isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-slate-400 font-medium">{trendLabel || 'vs previous'}</span>
            </div>
          ) : subtitle ? (
            <p className="text-xs text-slate-400 font-medium pt-0.5">{subtitle}</p>
          ) : null}
        </div>

        <div
          className={`p-3 rounded-xl ${theme.iconBg} ${theme.iconText} transition-transform duration-200 group-hover:scale-110 flex-shrink-0 shadow-xs`}
        >
          {CardIcon && <CardIcon className="w-6 h-6" />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
