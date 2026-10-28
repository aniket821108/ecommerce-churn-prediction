import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import {
  ArrowPathIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const riskTheme = {
  high: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    cardBorder: 'border-rose-100',
    statBg: 'bg-rose-50/50',
    statText: 'text-rose-600',
    icon: ShieldExclamationIcon,
  },
  medium: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    cardBorder: 'border-amber-100',
    statBg: 'bg-amber-50/50',
    statText: 'text-amber-600',
    icon: ExclamationTriangleIcon,
  },
  low: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    cardBorder: 'border-emerald-100',
    statBg: 'bg-emerald-50/50',
    statText: 'text-emerald-600',
    icon: CheckCircleIcon,
  },
};

const RiskBadge = ({ risk }) => {
  const key = (risk || 'low').toLowerCase();
  const theme = riskTheme[key] || riskTheme.low;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${theme.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      <span>{key} Risk</span>
    </span>
  );
};

const ProbabilityBar = ({ value, risk }) => {
  const pct = Math.round((value || 0) * 100);
  const key = (risk || 'low').toLowerCase();
  const barClass = riskTheme[key]?.bar || 'bg-slate-400';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
        {pct}%
      </span>
    </div>
  );
};

const ChurnAnalytics = () => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['churnPredictions'],
    queryFn: () => adminService.getChurnPredictions(),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const predictions = data?.data?.predictions || [];
  const users = data?.data?.users || [];

  const highCount = predictions.filter((p) => (p.churnRisk || '').toLowerCase() === 'high').length;
  const mediumCount = predictions.filter((p) => (p.churnRisk || '').toLowerCase() === 'medium').length;
  const lowCount = predictions.filter((p) => (p.churnRisk || '').toLowerCase() === 'low').length;

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-12 text-center shadow-xs">
        <ExclamationTriangleIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 mb-1">Failed to compute churn telemetry</h3>
        <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
          The machine learning inference subprocess or analytics service encountered an error.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Retry Inference</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/80 text-[11px] font-bold mb-1">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>XGBoost Pipeline v2 Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Churn Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Predictive retention model analyzing order gaps, spend trends, and engagement signals.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isFetching ? 'animate-spin text-violet-600' : 'text-slate-500'}`} />
          <span>{isFetching ? 'Re-analyzing...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* ── Risk Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'High Risk of Churn', count: highCount, key: 'high', desc: 'Critical immediate retention required' },
          { label: 'Moderate Churn Risk', count: mediumCount, key: 'medium', desc: 'Decreasing shopping frequency' },
          { label: 'Healthy & Loyal', count: lowCount, key: 'low', desc: 'Stable customer lifetime value' },
        ].map(({ label, count, key, desc }) => {
          const theme = riskTheme[key];
          const Icon = theme.icon;

          return (
            <div
              key={key}
              className={`bg-white border ${theme.cardBorder} rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className={`text-3xl font-black ${theme.statText} tracking-tight`}>
                    {count}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${theme.bg} shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-4">
                {desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Predictions Table Card ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Cohort Telemetry & Risk Scores
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ranked in descending order by machine learning churn likelihood
            </p>
          </div>
          {predictions.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
              {predictions.length} Evaluated Customers
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Customer Name & Contact</th>
                <th className="px-6 py-3.5">Risk Category</th>
                <th className="px-6 py-3.5 min-w-[160px]">Churn Probability</th>
                <th className="px-6 py-3.5">Model Justification</th>
                <th className="px-6 py-3.5">Recency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {predictions.map((pred, idx) => {
                const user = users[idx];
                const initial = (user?.name || 'C').charAt(0).toUpperCase();

                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate leading-tight">
                            {user?.name || 'Customer Account'}
                          </p>
                          <p className="text-xs text-slate-400 font-medium truncate">
                            {user?.email || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="px-6 py-4">
                      <RiskBadge risk={pred.churnRisk} />
                    </td>

                    {/* Probability Meter */}
                    <td className="px-6 py-4">
                      <ProbabilityBar value={pred.probability} risk={pred.churnRisk} />
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs font-medium text-slate-600 line-clamp-2">
                        {pred.reason || 'Sufficient order engagement'}
                      </p>
                    </td>

                    {/* Recency */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {user?.daysSinceLastOrder != null
                        ? user.daysSinceLastOrder === 999
                          ? 'Never purchased'
                          : `${user.daysSinceLastOrder} days ago`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {predictions.length === 0 && (
            <div className="py-16 text-center">
              <ChartBarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No churn predictions available</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure customer accounts and order history exist in the system
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChurnAnalytics;