import {
  TruckIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import ProductCardSnippet from './ProductCardSnippet';

const renderFormattedText = (text) => {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((chunk, cIdx) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return (
          <strong key={cIdx} className="font-bold text-slate-900">
            {chunk.slice(2, -2)}
          </strong>
        );
      }
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return (
          <code key={cIdx} className="px-1 py-0.5 rounded bg-slate-100 text-violet-700 text-xs font-mono">
            {chunk.slice(1, -1)}
          </code>
        );
      }
      return chunk;
    });

    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="font-bold text-sm text-slate-900 mt-2 mb-1">
          {line.replace('### ', '')}
        </h4>
      );
    }

    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <li key={idx} className="ml-3 list-disc text-xs sm:text-sm text-slate-700 my-0.5">
          {formattedLine}
        </li>
      );
    }

    if (line.trim() === '') {
      return <div key={idx} className="h-1.5" />;
    }

    return (
      <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
        {formattedLine}
      </p>
    );
  });
};

const ChatMessageItem = ({
  message: msg,
  activeMode,
  onSendMessage,
  onConfirmSendEmail,
  onConfirmSendWhatsapp,
  sendingEmailId,
  sendingWhatsappId,
  loading,
}) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
      {/* ── Bubble Container ── */}
      <div
        className={`rounded-2xl px-3.5 py-2.5 max-w-[92%] text-left text-xs sm:text-sm shadow-2xs ${
          isUser
            ? activeMode === 'admin'
              ? 'bg-slate-900 text-white rounded-br-xs'
              : 'bg-violet-600 text-white rounded-br-xs'
            : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
        }`}
      >
        {isUser ? (
          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="space-y-1">{renderFormattedText(msg.content)}</div>
        )}
      </div>

      {/* ── ADMIN: Structured KPIs Grid ── */}
      {msg.kpis && (
        <div className="mt-2.5 w-full grid grid-cols-2 gap-2 text-left">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Gross Revenue
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {msg.kpis.formattedSales}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {msg.kpis.totalOrders}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Pack
            </span>
            <div className="text-base font-extrabold text-amber-600 mt-0.5">
              {msg.kpis.pendingOrders}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Low Stock Items
            </span>
            <div className="text-base font-extrabold text-rose-600 mt-0.5">
              {msg.kpis.lowStockCount}
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN: Inventory Depletion List ── */}
      {msg.alerts && msg.alerts.length > 0 && (
        <div className="mt-2.5 w-full bg-white rounded-xl border border-slate-200 p-3 shadow-2xs text-left">
          <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span>Flagged Inventory Items</span>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              {msg.alerts.length} Warnings
            </span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {msg.alerts.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-[11px]"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.category} • ₹{item.price}</p>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                    item.stock === 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADMIN: Churn Risk Breakdown with Outreach Buttons ── */}
      {msg.churnData && msg.churnData.length > 0 && (
        <div className="mt-2.5 w-full bg-white rounded-xl border border-slate-200 p-3 shadow-2xs text-left">
          <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span>High Churn Risk Accounts</span>
            <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
              ML Scored
            </span>
          </div>
          <div className="space-y-2">
            {msg.churnData.map((cust) => (
              <div
                key={cust.userId}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/80 text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{cust.name}</span>
                  <span className="text-rose-600 font-bold">
                    {Math.round(cust.probability * 100)}% Risk
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{cust.email}</p>
                <p className="text-[10px] text-slate-600 mt-1 italic">"{cust.reason}"</p>
                
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSendMessage(`Draft promotional deal email to ${cust.email} offering code SAVE20 with 20% discount`)}
                    className="py-1 text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 rounded-md transition-colors flex items-center justify-center gap-1 border border-indigo-200/50"
                  >
                    <EnvelopeIcon className="w-3 h-3" />
                    <span>Email Deal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendMessage(`Draft WhatsApp deal to ${cust.name} offering code SAVE20 with 20% discount`)}
                    className="py-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100 rounded-md transition-colors flex items-center justify-center gap-1 border border-emerald-200/50"
                  >
                    <ChatBubbleLeftRightIcon className="w-3 h-3" />
                    <span>WhatsApp Deal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADMIN: WhatsApp Deal Draft Card ── */}
      {msg.whatsappDraft && (
        <div className="mt-2.5 w-full bg-white rounded-xl border border-emerald-300/80 p-3.5 shadow-2xs overflow-hidden text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
            <div className="flex items-center gap-1.5">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">CRM WhatsApp Deal</span>
            </div>
            {msg.whatsappDraft.sent ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircleIcon className="w-3 h-3" />
                {msg.whatsappDraft.deliveryMode === 'cloud_api' || msg.whatsappDraft.deliveryMode === 'twilio_api'
                  ? 'Delivered via API'
                  : 'Opened in WhatsApp Web'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Confirmation Required
              </span>
            )}
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-400 font-medium">Recipient: </span>
              <strong className="text-slate-900">{msg.whatsappDraft.customerName}</strong>{' '}
              <span className="text-emerald-700 font-mono text-[10px] font-bold">(+91 {msg.whatsappDraft.customerPhone})</span>
            </div>

            {msg.whatsappDraft.dealCode && (
              <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 rounded-lg p-2">
                <TagIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">Voucher Code: </span>
                  <span className="font-mono font-extrabold text-emerald-700 text-xs">{msg.whatsappDraft.dealCode}</span>
                  {msg.whatsappDraft.discountPercent && (
                    <span className="ml-2 text-[10px] text-emerald-600 font-semibold">({msg.whatsappDraft.discountPercent}% OFF)</span>
                  )}
                </div>
              </div>
            )}

            <div className="bg-emerald-50/40 rounded-lg p-2.5 border border-emerald-100 text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {msg.whatsappDraft.message}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            {msg.whatsappDraft.waLink && (
              <a
                href={msg.whatsappDraft.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                <span>{msg.whatsappDraft.sent ? 'Re-open in WhatsApp Web' : 'Open in WhatsApp Web'}</span>
              </a>
            )}

            {!msg.whatsappDraft.sent ? (
              <button
                type="button"
                onClick={() => onConfirmSendWhatsapp(msg.id, msg.whatsappDraft)}
                disabled={sendingWhatsappId === msg.id}
                className="ml-auto px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                {sendingWhatsappId === msg.id ? (
                  <>
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                    <span>Confirm & Dispatch Deal</span>
                  </>
                )}
              </button>
            ) : (
              <div className="ml-auto text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                {msg.whatsappDraft.deliveryMode === 'cloud_api' || msg.whatsappDraft.deliveryMode === 'twilio_api'
                  ? 'Delivered via API'
                  : 'Opened & Logged'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN: Email Deal Draft Card ── */}
      {msg.emailDraft && (
        <div className="mt-2.5 w-full bg-white rounded-xl border border-indigo-200 p-3.5 shadow-2xs overflow-hidden text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
            <div className="flex items-center gap-1.5">
              <EnvelopeIcon className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">CRM Deal Email Draft</span>
            </div>
            {msg.emailDraft.sent ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircleIcon className="w-3 h-3" /> Dispatched & Logged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Confirmation Required
              </span>
            )}
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-400 font-medium">To: </span>
              <strong className="text-slate-900">{msg.emailDraft.customerName}</strong>{' '}
              <span className="text-slate-500 font-mono text-[10px]">({msg.emailDraft.customerEmail})</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Subject: </span>
              <span className="text-slate-800 font-semibold">{msg.emailDraft.subject}</span>
            </div>

            {msg.emailDraft.dealCode && (
              <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 rounded-lg p-2">
                <TagIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider">Promo Code: </span>
                  <span className="font-mono font-extrabold text-indigo-700 text-xs">{msg.emailDraft.dealCode}</span>
                  {msg.emailDraft.discountPercent && (
                    <span className="ml-2 text-[10px] text-indigo-600 font-semibold">({msg.emailDraft.discountPercent}% OFF)</span>
                  )}
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {msg.emailDraft.body}
            </div>
          </div>

          {!msg.emailDraft.sent && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onConfirmSendEmail(msg.id, msg.emailDraft)}
                disabled={sendingEmailId === msg.id}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                {sendingEmailId === msg.id ? (
                  <>
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                    <span>Confirm & Send Email</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CUSTOMER: Order Status Visual Card (if present) ── */}
      {msg.order && (
        <div className="mt-2.5 w-full bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
            <div className="flex items-center gap-1.5">
              <TruckIcon className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-900">
                #{msg.order.orderNumber}
              </span>
            </div>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              {msg.order.status}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center my-2">
            {['Pending', 'Packed', 'Shipped', 'Delivered'].map((step, sIdx) => {
              const isDone = sIdx < msg.order.statusStep;
              const isCurrent = sIdx + 1 === msg.order.statusStep;

              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-violet-600 text-white ring-2 ring-violet-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : sIdx + 1}
                  </div>
                  <span className="text-[9px] font-medium text-slate-600 mt-1 truncate w-full">
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>Courier: {msg.order.courier}</span>
            {msg.order.trackingNumber && (
              <span className="font-mono font-bold text-slate-700">
                {msg.order.trackingNumber}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── CUSTOMER: Product Recommendation Cards (if present) ── */}
      {msg.products && msg.products.length > 0 && (
        <div className="mt-2.5 w-full">
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
            {msg.products.map((prod) => (
              <ProductCardSnippet key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* Contextual Suggestions Chips */}
      {msg.suggestions && msg.suggestions.length > 0 && !isUser && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {msg.suggestions.map((sug, sIdx) => (
            <button
              key={sIdx}
              onClick={() => onSendMessage(sug)}
              disabled={loading}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all active:scale-95 text-left border ${
                activeMode === 'admin'
                  ? 'text-slate-800 bg-white hover:bg-slate-100 border-slate-200 shadow-2xs'
                  : 'text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-200/80'
              }`}
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem;

