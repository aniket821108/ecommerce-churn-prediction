const StatsCard = ({ title, value, icon: Icon, color = 'violet', trend, trendLabel }) => {
  const colorMap = {
    violet: { accent: '#7c3aed', glow: 'rgba(124,58,237,0.15)', iconBg: '#1e1333', iconColor: '#a78bfa' },
    green:  { accent: '#16a34a', glow: 'rgba(22,163,74,0.15)',  iconBg: '#0d2015', iconColor: '#4ade80' },
    red:    { accent: '#dc2626', glow: 'rgba(220,38,38,0.15)',  iconBg: '#200d0d', iconColor: '#f87171' },
    yellow: { accent: '#d97706', glow: 'rgba(217,119,6,0.15)',  iconBg: '#1f1608', iconColor: '#fbbf24' },
    cyan:   { accent: '#0891b2', glow: 'rgba(8,145,178,0.15)',  iconBg: '#071520', iconColor: '#22d3ee' },
    blue:   { accent: '#2563eb', glow: 'rgba(37,99,235,0.15)',  iconBg: '#0d1529', iconColor: '#60a5fa' },
  };

  const c = colorMap[color] || colorMap.violet;

  const trendPositive = trend > 0;

  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden"
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#2a2a2a';
        e.currentTarget.style.boxShadow = `0 0 0 1px #2a2a2a, 0 8px 32px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1f1f1f';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: c.glow }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#525252' }}>
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: '#f5f5f5' }}>
            {value}
          </p>
          {trend !== undefined && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: trendPositive ? '#4ade80' : '#f87171' }}>
              {trendPositive ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || 'vs last month'}
            </p>
          )}
        </div>
        <div
          className="p-2.5 rounded-lg flex-shrink-0"
          style={{ background: c.iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: c.iconColor }} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
