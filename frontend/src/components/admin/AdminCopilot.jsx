import { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  TagIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import chatService from '../../services/chatService';
import useAuthStore from '../../store/authStore';

const ADMIN_STARTERS = [
  '📊 Executive KPIs & Sales',
  '⚠️ Inventory Depletion Alerts',
  '📉 High Churn Risk Accounts',
  '📧 Draft Deal Email to Customer',
  '📝 Recent Admin Audit Logs'
];

const AdminCopilot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 'admin-welcome',
      role: 'assistant',
      content:
        '👋 Welcome to the **Admin Operations Copilot**.\n\n' +
        'I am your executive AI assistant for store performance, inventory management, customer churn risk analysis, audit tracking, and targeted CRM email outreach.\n\n' +
        'Select a quick action below or ask any business operations query in natural language.',
      suggestions: ADMIN_STARTERS,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMsgId = `admin-u-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: messageText,
        timestamp: new Date()
      }
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await chatService.sendAdminMessage({
        message: messageText,
        conversationHistory
      });

      const data = res.data;
      const botMsg = {
        id: `admin-b-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Executive analysis complete:',
        kpis: data.kpis || null,
        alerts: data.alerts || [],
        churnData: data.churnData || [],
        logs: data.logs || [],
        emailDraft: data.emailDraft || null,
        suggestions: data.suggestions?.length ? data.suggestions : ADMIN_STARTERS,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `admin-err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to retrieve administrative intelligence. Please ensure you are logged in with admin privileges.',
          suggestions: ADMIN_STARTERS,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSendEmail = async (msgId, draft) => {
    if (!draft || !draft.customerEmail || sendingEmailId) return;

    setSendingEmailId(msgId);
    try {
      const res = await chatService.sendAdminEmail({
        customerEmail: draft.customerEmail,
        customerName: draft.customerName,
        subject: draft.subject,
        body: draft.body,
        dealCode: draft.dealCode,
        discountPercent: draft.discountPercent
      });

      toast.success(`Promotional email dispatched to ${draft.customerEmail}!`);

      // Update message state to show email as sent
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                emailDraft: {
                  ...m.emailDraft,
                  sent: true,
                  sentAt: new Date(),
                  logId: res.data?.logId
                }
              }
            : m
        )
      );

      // Append bot confirmation message
      const confirmMsg = {
        id: `admin-sent-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Outreach Email Dispatched**\n\n` +
          `• **Recipient:** ${draft.customerName} (\`${draft.customerEmail}\`)\n` +
          `• **Subject:** ${draft.subject}\n` +
          (draft.dealCode ? `• **Promo Code:** \`${draft.dealCode}\`\n` : '') +
          `• **Audit Log:** Recorded in AdminLog (Entity: \`user\`, Action: \`create\`) with admin signature.`,
        suggestions: ADMIN_STARTERS,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to dispatch promotional email.';
      toast.error(errMsg);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDismissDraft = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, emailDraft: null } : m))
    );
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'admin-reset',
        role: 'assistant',
        content: `Copilot reset. Standing by for operations queries, ${user?.name?.split(' ')[0] || 'Administrator'}.`,
        suggestions: ADMIN_STARTERS,
        timestamp: new Date()
      }
    ]);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
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
            <code key={cIdx} className="px-1 py-0.5 rounded bg-slate-100 text-indigo-700 text-xs font-mono">
              {chunk.slice(1, -1)}
            </code>
          );
        }
        return chunk;
      });

      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-3 list-disc text-xs text-slate-700 my-0.5">
            {formattedLine}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed">
          {formattedLine}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <span>Operations Copilot</span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-violet-500/20 text-violet-300 text-[10px] uppercase font-mono tracking-wider">
                    CRM & BI Guard
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Executive Intelligence, Outreach & ML</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Reset Copilot"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 max-w-[92%] text-left text-xs shadow-2xs ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                    )}
                  </div>

                  {/* CRM Deal Outreach Interactive Draft Card */}
                  {msg.emailDraft && (
                    <div className="mt-2.5 w-full bg-white rounded-xl border border-indigo-200/90 p-3.5 shadow-2xs overflow-hidden">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <EnvelopeIcon className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-900">CRM Deal Outreach</span>
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
                          <span className="text-slate-400 font-medium">Recipient: </span>
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
                              <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider">Voucher Code: </span>
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
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDismissDraft(msg.id)}
                            disabled={sendingEmailId === msg.id}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmSendEmail(msg.id, msg.emailDraft)}
                            disabled={sendingEmailId === msg.id}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
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

                  {/* Structured KPIs Grid */}
                  {msg.kpis && (
                    <div className="mt-2.5 w-full grid grid-cols-2 gap-2">
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

                  {/* Structured Inventory Depletion List */}
                  {msg.alerts && msg.alerts.length > 0 && (
                    <div className="mt-2.5 w-full bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
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

                  {/* Churn Risk Breakdown */}
                  {msg.churnData && msg.churnData.length > 0 && (
                    <div className="mt-2.5 w-full bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
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
                            <button
                              type="button"
                              onClick={() => handleSendMessage(`Draft promotional deal email to ${cust.email} offering code SAVE20 with 20% discount`)}
                              className="mt-2 w-full py-1 text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 rounded-md transition-colors flex items-center justify-center gap-1 border border-indigo-200/50"
                            >
                              <EnvelopeIcon className="w-3 h-3" />
                              <span>Draft CRM Retention Deal</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Audit Trail */}
                  {msg.logs && msg.logs.length > 0 && (
                    <div className="mt-2.5 w-full bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
                      <div className="text-xs font-bold text-slate-900 mb-2">Recent Audit Trail</div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {msg.logs.map((log) => (
                          <div
                            key={log._id}
                            className="p-2 rounded-lg bg-slate-50 text-[11px] border border-slate-100"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="capitalize">{log.action} on {log.entity}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">By {log.adminName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && !isUser && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          disabled={loading}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-all active:scale-95 text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 max-w-[80%] rounded-bl-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-slate-800 animate-ping" />
                <span className="text-xs font-medium animate-pulse">
                  Aggregating operations metrics...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Safe Confirmation Subtext */}
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 text-[10px] text-slate-600">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Strict RBAC: State modifications require direct manual confirmation.</span>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about KPIs, low stock, or send deal email to customer..."
                disabled={loading}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all shadow-xs active:scale-95"
                aria-label="Send query"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCopilot;
