import { useState, useRef, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import chatService from '../../services/chatService';
import useAuthStore from '../../store/authStore';
import ChatHeader from './ChatHeader';
import ChatMessageItem from './ChatMessageItem';
import ChatInput from './ChatInput';

const CUSTOMER_STARTERS = [
  '👟 Shoes under ₹2,000',
  '📦 Where is my order?',
  '🔥 Best deals today',
  '🔄 What is your return policy?',
];

const ADMIN_STARTERS = [
  '📊 Executive KPIs & Sales',
  '⚠️ Low Stock Warnings',
  '📉 High Churn Risk Accounts',
  '📱 Draft WhatsApp Deal',
  '📧 Draft Customer Deal Email',
  '📝 Recent Admin Audit Logs',
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
      timestamp: new Date(),
    },
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
      timestamp: new Date(),
    },
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
  }, [isAdmin, activeMode]);

  // Escape key handler to close chat window
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
  }, [isOpen, currentMessages]);

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMsgId = `u-${Date.now()}`;
    const newMessages = [
      ...currentMessages,
      {
        id: userMsgId,
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      },
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
          conversationHistory,
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
          whatsappDraft: data.whatsappDraft || null,
          suggestions: data.suggestions || ADMIN_STARTERS,
          timestamp: new Date(),
        };

        setAdminMessages([...newMessages, botMsg]);
      } else {
        const res = await chatService.sendMessage({
          message: messageText,
          conversationHistory,
        });

        const data = res.data;
        const botMsg = {
          id: `b-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Here is what I found for you:',
          products: data.products || [],
          order: data.order || null,
          suggestions: data.suggestions || CUSTOMER_STARTERS,
          timestamp: new Date(),
        };

        setCustomerMessages([...newMessages, botMsg]);
      }

      if (!isOpen) setHasUnread(true);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        timestamp: new Date(),
      };
      setCurrentMessages([...newMessages, errorMsg]);
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
        discountPercent: draft.discountPercent,
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
        timestamp: new Date(),
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
        discountPercent: draft.discountPercent,
      });

      const deliveryMode = res.data?.mode;
      const targetWaLink = res.data?.waLink || draft.waLink;
      const isAutomated = deliveryMode === 'cloud_api' || deliveryMode === 'twilio_api';

      if (!isAutomated && targetWaLink) {
        const opened = window.open(targetWaLink, '_blank', 'noopener,noreferrer');
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          toast.success(`Audit log saved! Click "Open in WhatsApp Web" below to send the message.`, { duration: 6000 });
        } else {
          toast.success(`Opening WhatsApp Web for +91 ${draft.customerPhone}... Click Send in WhatsApp!`);
        }
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
                  logId: res.data?.logId,
                },
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
        timestamp: new Date(),
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
          timestamp: new Date(),
        },
      ]);
    } else {
      setCustomerMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Chat cleared. Welcome back${user?.name ? ', ' + user.name.split(' ')[0] : ''}! What can I assist you with?`,
          suggestions: CUSTOMER_STARTERS,
          timestamp: new Date(),
        },
      ]);
    }
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
              <SparklesIcon className="w-5 h-5 text-amber-300 animate-pulse" />
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
          role="dialog"
          aria-modal="true"
          aria-label={activeMode === 'admin' ? 'Operations Copilot' : 'E-Shop Concierge'}
          className={`flex flex-col w-[92vw] ${
            activeMode === 'admin' ? 'sm:w-[460px] h-[640px]' : 'sm:w-[410px] h-[580px]'
          } max-h-[88vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200`}
        >
          {/* Header */}
          <ChatHeader
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            isAdmin={isAdmin}
            onClear={handleClearChat}
            onClose={() => setIsOpen(false)}
          />

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 scroll-smooth">
            {currentMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                activeMode={activeMode}
                onSendMessage={handleSendMessage}
                onConfirmSendEmail={handleConfirmSendEmail}
                onConfirmSendWhatsapp={handleConfirmSendWhatsapp}
                sendingEmailId={sendingEmailId}
                sendingWhatsappId={sendingWhatsappId}
                loading={loading}
              />
            ))}

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

          {/* Input Footer */}
          <ChatInput
            input={input}
            setInput={setInput}
            loading={loading}
            activeMode={activeMode}
            onSubmit={handleSendMessage}
            inputRef={inputRef}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
