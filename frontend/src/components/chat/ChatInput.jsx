import { PaperAirplaneIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const ChatInput = ({
  input,
  setInput,
  loading,
  activeMode,
  onSubmit,
  inputRef,
}) => {
  return (
    <>
      {/* Safe RBAC subtext for Admin */}
      {activeMode === 'admin' && (
        <div className="px-4 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 text-[10px] text-slate-600">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Executive Security: Outreach dispatches require manual confirmation.</span>
        </div>
      )}

      {/* Input Footer Bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeMode === 'admin'
                ? 'Ask KPIs, low stock, or draft deal for customer...'
                : 'Ask about products, orders, or deals...'
            }
            disabled={loading}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:bg-white text-slate-800 placeholder-slate-400 transition-all min-h-[38px]"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-2.5 text-white disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-all shadow-xs active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-400 ${
              activeMode === 'admin'
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-violet-600 hover:bg-violet-700'
            }`}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-1.5 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            {activeMode === 'admin'
              ? 'Real-Time MongoDB Aggregations • Audit Trail Recorded'
              : 'Verified live inventory • Zero hallucination guarantee'}
          </span>
        </div>
      </div>
    </>
  );
};

export default ChatInput;

