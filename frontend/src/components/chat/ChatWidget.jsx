import { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  TagIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ProductCardSnippet from './ProductCardSnippet';
import chatService from '../../services/chatService';
import useAuthStore from '../../store/authStore';

const CUSTOMER_STARTERS = [
  '👟 Shoes under ₹2,000',
  '📦 Where is my order?',
  '🔥 Best deals today',
  '🔄 What is your return policy?'
];

const ADMIN_STARTERS = [
  '📊 Executive KPIs & Sales',
  '⚠️ Low Stock Warnings',
  '📉 High Churn Risk Accounts',
  '📱 Draft WhatsApp Deal',
  '📧 Draft Customer Deal Email',
  '📝 Recent Admin Audit Logs'
];

const ChatWidget = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState(isAdmin ? 'admin' : 'customer');

  // Customer chat messages state
  const [customerMessages, setCustomerMessages] = useState([
    {
      id: 'customer-welcome',
      role: 'assistant',
      content:
        'Hello! 👋 I am your **E-Shop AI Shopping Assistant**.\n\n' +
        'I can find products matching your budget, track your orders, and answer store policy questions with real-time catalog accuracy.\n\n' +
        'How can I help you today?',
      suggestions: CUSTOMER_STARTERS,
      timestamp: new Date()
    }
  ]);

  // Admin chat messages state
  const [adminMessages, setAdminMessages] = useState([
    {
      id: 'admin-welcome',
      role: 'assistant',
      content:
        `👋 Welcome back, **${user?.name?.split(' ')[0] || 'Administrator'}**!\n\n` +
        'I am your **Executive Operations Copilot**. I provide real-time business intelligence on gross sales KPIs, low stock alerts, ML customer churn risk, and omnichannel CRM deal outreach (Email & WhatsApp).\n\n' +
        'Select an action below or ask any operations query in natural language.',
      suggestions: ADMIN_STARTERS,
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [sendingWhatsappId, setSendingWhatsappId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize default mode when admin logs in/out
  useEffect(() => {
    if (isAdmin && activeMode !== 'admin') {
      setActiveMode('admin');
    } else if (!isAdmin && activeMode !== 'customer') {
      setActiveMode('customer');
    }
  }, [isAdmin]);

  const currentMessages = activeMode === 'admin' ? adminMessages : customerMessages;
  const setCurrentMessages = activeMode === 'admin' ? setAdminMessages : setCustomerMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeMode, currentMessages]);

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...currentMessages,
      {
        id: userMessageId,
        role: 'user',
        content: messageText,
        timestamp: new Date()
      }
    ];

    setCurrentMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      if (activeMode === 'admin') {
        const res = await chatService.sendAdminMessage({
          message: messageText,
          conversationHistory
        });
        const data = res.data;

        const botMessage = {
          id: `admin-bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Here is the requested operational analysis:',
          kpis: data.kpis || null,
          alerts: data.alerts || [],
          churnData: data.churnData || [],
          logs: data.logs || [],
          emailDraft: data.emailDraft || null,
          whatsappDraft: data.whatsappDraft || null,
          suggestions: data.suggestions?.length ? data.suggestions : ADMIN_STARTERS,
          timestamp: new Date()
        };

        setCurrentMessages((prev) => [...prev, botMessage]);
      } else {
        const res = await chatService.sendCustomerMessage({
          message: messageText,
          conversationHistory
        });
        const data = res.data;

        const botMessage = {
          id: `customer-bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Here is what I found for you:',
          products: data.products || [],
          order: data.order || null,
          suggestions: data.suggestions?.length ? data.suggestions : CUSTOMER_STARTERS,
          timestamp: new Date()
        };

        setCurrentMessages((prev) => [...prev, botMessage]);
      }

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      setCurrentMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: activeMode === 'admin'
            ? 'Encountered an issue communicating with the Operations Copilot service.'
            : 'Sorry, I encountered an issue connecting to the store catalog. Please try again.',
          suggestions: activeMode === 'admin' ? ADMIN_STARTERS : CUSTOMER_STARTERS,
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

      toast.success(`Promotional deal email dispatched to ${draft.customerEmail}!`);

      setAdminMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, emailDraft: { ...m.emailDraft, sent: true, sentAt: new Date(), logId: res.data?.logId } }
            : m
        )
      );

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

      setAdminMessages((prev) => [...prev, confirmMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to dispatch promotional email.';
      toast.error(errMsg);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleConfirmSendWhatsapp = async (msgId, draft) => {
    if (!draft || !draft.customerPhone || sendingWhatsappId) return;

    setSendingWhatsappId(msgId);
    try {
      const res = await chatService.sendAdminWhatsapp({
        customerPhone: draft.customerPhone,
        customerName: draft.customerName,
        customerEmail: draft.customerEmail,
        message: draft.message,
        dealCode: draft.dealCode,
        discountPercent: draft.discountPercent
      });

      const deliveryMode = res.data?.mode;
      const targetWaLink = res.data?.waLink || draft.waLink;
      const isAutomated = deliveryMode === 'cloud_api' || deliveryMode === 'twilio_api';

      if (!isAutomated && targetWaLink) {
        window.open(targetWaLink, '_blank', 'noopener,noreferrer');
        toast.success(`Opening WhatsApp Web for +91 ${draft.customerPhone}... Click Send in WhatsApp!`);
      } else {
        toast.success(`WhatsApp deal dispatched via API to +91 ${draft.customerPhone}!`);
      }

      setAdminMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                whatsappDraft: {
                  ...m.whatsappDraft,
                  sent: true,
                  sentAt: new Date(),
                  deliveryMode,
                  waLink: targetWaLink,
                  logId: res.data?.logId
                }
              }
            : m
        )
      );

      const confirmMsg = {
        id: `admin-wa-sent-${Date.now()}`,
        role: 'assistant',
        content: `✅ **WhatsApp Deal Outreach Action Completed**\n\n` +
          `• **Recipient:** ${draft.customerName} (\`+91 ${draft.customerPhone}\`)\n` +
          (draft.dealCode ? `• **Promo Code:** \`${draft.dealCode}\`\n` : '') +
          `• **Delivery Channel:** ${
            deliveryMode === 'cloud_api'
              ? 'Meta WhatsApp Cloud API (Automated Server Dispatch)'
              : deliveryMode === 'twilio_api'
              ? 'Twilio WhatsApp API (Automated Server Dispatch)'
              : 'Direct WhatsApp Web / Click-to-Chat (Opened in Browser)'
          }\n` +
          (!isAutomated
            ? `ℹ️ **How to Send:** WhatsApp Web was opened with the promotional message pre-filled. Simply click **Send** in WhatsApp Web to deliver it directly to the customer's phone.\n`
            : '') +
          `• **Audit Log:** Recorded in AdminLog (Entity: \`user\`, Action: \`create\`) with admin signature.`,
        suggestions: ADMIN_STARTERS,
        timestamp: new Date()
      };

      setAdminMessages((prev) => [...prev, confirmMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to dispatch WhatsApp message.';
      toast.error(errMsg);
    } finally {
      setSendingWhatsappId(null);
    }
  };

  const handleClearChat = () => {
    if (activeMode === 'admin') {
      setAdminMessages([
        {
          id: 'admin-welcome-reset',
          role: 'assistant',
          content: `Copilot reset. Standing by for operations queries, ${user?.name?.split(' ')[0] || 'Administrator'}.`,
          suggestions: ADMIN_STARTERS,
          timestamp: new Date()
        }
      ]);
    } else {
      setCustomerMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Chat cleared. Welcome back${user?.name ? ', ' + user.name.split(' ')[0] : ''}! What can I assist you with?`,
          suggestions: CUSTOMER_STARTERS,
          timestamp: new Date()
        }
      ]);
    }
  };

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

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* ── Floating Launcher Button (When Closed) ── */}
      {!isOpen && (
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border ${
              isAdmin
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-amber-400/40 ring-2 ring-amber-400/20'
                : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white border-violet-400/30'
            }`}
            aria-label="Open AI Assistant"
          >
            <div className="relative">
              <SparklesIcon className={`w-5 h-5 ${isAdmin ? 'text-amber-300 animate-pulse' : 'text-amber-300 animate-pulse'}`} />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-wide flex items-center gap-1.5">
              {isAdmin ? (
                <>
                  <span>Admin Copilot</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-sm bg-amber-400/20 text-amber-300 font-mono">
                    Executive
                  </span>
                </>
              ) : (
                'Ask AI Assistant'
              )}
            </span>
          </button>
        </div>
      )}

      {/* ── Floating Chat Window (When Open) ── */}
      {isOpen && (
        <div
          className={`flex flex-col w-[92vw] ${
            activeMode === 'admin' ? 'sm:w-[460px] h-[640px]' : 'sm:w-[410px] h-[580px]'
          } max-h-[88vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200`}
        >
          {/* Header */}
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
                  onClick={handleClearChat}
                  title="Restart conversation"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Clear chat history"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
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

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 scroll-smooth">
            {currentMessages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  {/* Bubble Container */}
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
                                onClick={() => handleSendMessage(`Draft promotional deal email to ${cust.email} offering code SAVE20 with 20% discount`)}
                                className="py-1 text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 rounded-md transition-colors flex items-center justify-center gap-1 border border-indigo-200/50"
                              >
                                <EnvelopeIcon className="w-3 h-3" />
                                <span>Email Deal</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendMessage(`Draft WhatsApp deal to ${cust.name} offering code SAVE20 with 20% discount`)}
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
                            onClick={() => handleConfirmSendWhatsapp(msg.id, msg.whatsappDraft)}
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
                                <span>Send via WhatsApp Web</span>
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
                            onClick={() => handleConfirmSendEmail(msg.id, msg.emailDraft)}
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
                          onClick={() => handleSendMessage(sug)}
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
            })}

            {/* Thinking / Typing State */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 max-w-[80%] rounded-bl-xs shadow-2xs">
                <span className={`w-2 h-2 rounded-full animate-ping ${activeMode === 'admin' ? 'bg-slate-900' : 'bg-violet-600'}`} />
                <span className="text-xs font-medium animate-pulse">
                  {activeMode === 'admin' ? 'Querying business intelligence...' : 'Querying store catalog...'}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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
                handleSendMessage();
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
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`p-2.5 text-white disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-all shadow-xs active:scale-95 ${
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
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
