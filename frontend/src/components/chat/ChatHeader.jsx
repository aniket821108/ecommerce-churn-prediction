import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

const ChatHeader = ({
  activeMode,
  setActiveMode,
  isAdmin,
  onClear,
  onClose,
}) => {
  return (
    <div
      className={`px-4 py-3 text-white flex flex-col gap-2 shadow-xs ${
        activeMode === 'admin'
          ? 'bg-slate-900 border-b border-slate-800'
          : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
              activeMode === 'admin'
                ? 'bg-violet-600/30 border border-violet-500/40 text-violet-300'
                : 'bg-white/20 backdrop-blur-md text-amber-300'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
              <span>{activeMode === 'admin' ? 'Operations Copilot' : 'E-Shop Concierge'}</span>
              {activeMode === 'admin' && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-sm bg-amber-400/20 text-amber-300 font-mono tracking-wider">
                  Superadmin
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-300 truncate">
              {activeMode === 'admin'
                ? 'Intelligence, Sales KPIs, Churn & CRM Deals'
                : 'Zero-Hallucination AI • Grounded in Live Catalog'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            title="Restart conversation"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Clear chat history"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tab (Exclusively for Admins) */}
      {isAdmin && (
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-[11px] self-start mt-0.5">
          <button
            type="button"
            onClick={() => setActiveMode('admin')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeMode === 'admin'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SparklesIcon className="w-3 h-3 text-amber-300" />
            <span>Admin Copilot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('customer')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
              activeMode === 'customer'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBagIcon className="w-3 h-3" />
            <span>Storefront View</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;

