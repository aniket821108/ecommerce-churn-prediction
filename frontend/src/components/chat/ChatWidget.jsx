import { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import ProductCardSnippet from './ProductCardSnippet';
import chatService from '../../services/chatService';
import useAuthStore from '../../store/authStore';

const INITIAL_SUGGESTIONS = [
  '👟 Shoes under ₹2,000',
  '📦 Where is my order?',
  '🔥 Best deals today',
  '🔄 What is your return policy?'
];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! 👋 I am your **E-Shop AI Shopping Assistant**.\n\n' +
        'I can find products matching your budget, track your orders, and answer store policy questions with real-time catalog accuracy.\n\n' +
        'How can I help you today?',
      suggestions: INITIAL_SUGGESTIONS,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        content: messageText,
        timestamp: new Date()
      }
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build lightweight conversation history for the backend
      const conversationHistory = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await chatService.sendCustomerMessage({
        message: messageText,
        conversationHistory
      });

      const data = res.data;
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Here is what I found for you:',
        products: data.products || [],
        order: data.order || null,
        suggestions: data.suggestions?.length ? data.suggestions : INITIAL_SUGGESTIONS,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the store catalog. Please try again.',
          suggestions: INITIAL_SUGGESTIONS,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat cleared. Welcome back${user?.name ? ', ' + user.name.split(' ')[0] : ''}! What can I assist you with?`,
        suggestions: INITIAL_SUGGESTIONS,
        timestamp: new Date()
      }
    ]);
  };

  // Helper to format basic markdown-style text safely
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Bold syntax **text**
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
      {/* ── Trigger Pill Button (When Closed) ── */}
      {!isOpen && (
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-violet-400/30"
            aria-label="Open AI Shopping Assistant"
          >
            <div className="relative">
              <SparklesIcon className="w-5 h-5 text-amber-300 animate-pulse" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              Ask AI Assistant
            </span>
          </button>
        </div>
      )}

      {/* ── Floating Chat Window (When Open) ── */}
      {isOpen && (
        <div className="flex flex-col w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
                <SparklesIcon className="w-4 h-4 text-amber-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-violet-700 rounded-full" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold truncate">E-Shop Concierge</h3>
                <p className="text-[10px] text-violet-200 truncate flex items-center gap-1">
                  <span>Zero-Hallucination AI</span>
                  <span>•</span>
                  <span>Grounded in Live Catalog</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Restart conversation"
                className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Clear chat history"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 scroll-smooth">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  {/* Bubble Container */}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 max-w-[90%] text-left text-xs sm:text-sm shadow-2xs ${
                      isUser
                        ? 'bg-violet-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                    )}
                  </div>

                  {/* Order Status Visual Card (if present) */}
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

                      {/* Stepper */}
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

                  {/* Product Recommendation Cards (if present) */}
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
                          className="px-2.5 py-1 text-[11px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 rounded-full transition-all active:scale-95 text-left"
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
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                <span className="text-xs font-medium animate-pulse">
                  Querying store catalog...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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
                placeholder="Ask about products, orders, or deals..."
                disabled={loading}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all shadow-xs active:scale-95"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Verified live inventory • Zero hallucination guarantee
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;

