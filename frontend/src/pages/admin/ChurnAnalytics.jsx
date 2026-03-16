import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';

const riskMap = {
  high:   { bg: '#200d0d', color: '#f87171', dot: '#dc2626', barColor: '#dc2626' },
  medium: { bg: '#1f1608', color: '#fbbf24', dot: '#d97706', barColor: '#d97706' },
  low:    { bg: '#0d2015', color: '#4ade80', dot: '#16a34a', barColor: '#16a34a' },
};

const RiskBadge = ({ risk }) => {
  const s = riskMap[risk] || { bg: '#1a1a1a', color: '#737373', dot: '#404040' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {risk}
    </span>
  );
};

const ProbabilityBar = ({ value, risk }) => {
  const pct = Math.round(value * 100);
  const color = riskMap[risk]?.barColor || '#525252';
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: '4px', background: '#1f1f1f' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono w-10 text-right" style={{ color: '#737373' }}>{pct}%</span>
    </div>
  );
};

const ChurnAnalytics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['churnPredictions'],
    queryFn: () => adminService.getChurnPredictions(),
  });

  const predictions = data?.data?.predictions || [];
  const users = data?.data?.users || [];

  const highCount   = predictions.filter(p => p.churnRisk === 'high').length;
  const mediumCount = predictions.filter(p => p.churnRisk === 'medium').length;
  const lowCount    = predictions.filter(p => p.churnRisk === 'low').length;

  if (isLoading) return <Loader />;
  if (error) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm" style={{ color: '#f87171' }}>Failed to load churn predictions.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold" style={{ color: '#f5f5f5' }}>Churn Analytics</h2>
        <p className="text-sm mt-0.5" style={{ color: '#525252' }}>
          AI-powered risk scores for customers at risk of churning.
        </p>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'High Risk', count: highCount, ...riskMap.high },
          { label: 'Medium Risk', count: mediumCount, ...riskMap.medium },
          { label: 'Low Risk', count: lowCount, ...riskMap.low },
        ].map(({ label, count, bg, color, barColor }) => (
          <div
            key={label}
            className="rounded-xl p-5 relative overflow-hidden"
            style={{ background: '#111111', border: '1px solid #1f1f1f' }}
          >
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none"
              style={{ background: bg }}
            />
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#525252' }}>{label}</p>
            <p className="text-3xl font-semibold" style={{ color }}>{count}</p>
            <p className="text-xs mt-1" style={{ color: '#404040' }}>customer{count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      {/* Predictions Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>At-Risk Customers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Customer', 'Risk Level', 'Probability', 'Reason', 'Last Order'].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest" style={{ color: '#404040' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred, idx) => {
                const user = users[idx];
                return (
                  <tr
                    key={idx}
                    style={{ borderBottom: '1px solid #161616', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium" style={{ color: '#e5e5e5' }}>{user?.name || '—'}</p>
                      <p className="text-xs" style={{ color: '#404040' }}>{user?.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge risk={pred.churnRisk} />
                    </td>
                    <td className="px-5 py-3.5 w-40">
                      <ProbabilityBar value={pred.probability} risk={pred.churnRisk} />
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-sm" style={{ color: '#737373' }}>{pred.reason || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm" style={{ color: '#525252' }}>
                        {user?.daysSinceLastOrder ? `${user.daysSinceLastOrder}d ago` : 'Never'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {predictions.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#404040' }}>No churn predictions available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChurnAnalytics;
