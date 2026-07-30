import { useState, useEffect, useRef } from 'react';
import { siteConfig } from '../../config/site';
import { X, Send, Trash2, ExternalLink, Bot, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const DEFAULT_WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: 'Hello! 👋 Welcome to The Bloom and Blossom — Handcrafted Hair Accessories & Gifts.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'welcome-2',
    sender: 'bot',
    text: 'How can we help you today? You can ask about custom bows & accessories, track your order, or chat directly with our team on WhatsApp!',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      // Clear old key if present to purge legacy welcome message
      localStorage.removeItem('bloom_chat_messages');
      const saved = localStorage.getItem('bloom_chat_messages_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: ChatMessage) => ({
            ...m,
            text: m.text
              .replace(/Bloom Artisanal Florals & Gifts/g, 'The Bloom and Blossom — Handcrafted Hair Accessories & Gifts')
              .replace(/Bloom Artisanal Florals/g, 'The Bloom and Blossom')
              .replace(/custom bouquet/gi, 'custom bow or accessory')
              .replace(/floral arrangement/gi, 'hair accessory')
              .replace(/floral consultants/gi, 'accessories team')
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load saved chat history:", e);
    }
    return DEFAULT_WELCOME_MESSAGES;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const phoneStr = siteConfig.contact.phone.replace(/[^0-9]/g, '');

  useEffect(() => {
    try {
      localStorage.setItem('bloom_chat_messages_v2', JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history:", e);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const addMessage = (sender: 'bot' | 'user', text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };

  const generateBotReply = (userText: string) => {
    const lower = userText.toLowerCase();
    if (lower.includes('order') || lower.includes('track') || lower.includes('status')) {
      return "You can check your order status anytime under your Account Dashboard! If you have your Order ID, feel free to share it here or contact us on WhatsApp for live tracking.";
    } else if (lower.includes('delivery') || lower.includes('ship') || lower.includes('time')) {
      return "We offer same-day delivery for local orders placed before 2 PM! Express shipping options are also available at checkout.";
    } else if (lower.includes('custom') || lower.includes('bow') || lower.includes('clip') || lower.includes('hair')) {
      return "We love creating custom handcrafted hair accessories! You can request custom bows or clips via our Contact page or message us directly on WhatsApp to share your customization ideas.";
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello there! Wonderful to meet you. Let us know what handcrafted bows, clips, or hair accessories you are looking for!";
    } else {
      return "Thanks for your message! Our team is ready to assist. Click 'Open in WhatsApp' below to continue this chat directly with us!";
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userText = message.trim();
    addMessage('user', userText);
    setMessage('');

    // Simulate bot response after short delay
    setTimeout(() => {
      const reply = generateBotReply(userText);
      addMessage('bot', reply);
    }, 600);
  };

  const handleQuickPrompt = (promptText: string) => {
    addMessage('user', promptText);
    setTimeout(() => {
      const reply = generateBotReply(promptText);
      addMessage('bot', reply);
    }, 500);
  };

  const handleOpenWhatsApp = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || 'Hello, I would like to inquire about your products.';
    const url = `https://wa.me/${phoneStr}?text=${encodeURIComponent(lastUserMsg)}`;
    window.open(url, '_blank');
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear chat history?")) {
      setMessages(DEFAULT_WELCOME_MESSAGES);
      localStorage.removeItem('bloom_chat_messages');
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_4px_14px_rgba(37,211,102,0.4)] border-2 border-white hover:bg-[#20ba59] hover:scale-110 transition-transform duration-300 group"
        aria-label="Chat Support"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 448 512" 
          className="w-7 h-7 fill-current pr-[1px] pb-[1px]"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full animate-ping" />
      </button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 max-h-[550px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] px-5 py-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight">Bloom &amp; Blossom Customer Support</h3>
                  <p className="text-[11px] text-green-100 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-300 inline-block"></span>
                    Online & Ready to Help
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleClearHistory}
                  title="Clear Chat History"
                  className="hover:bg-white/20 p-2 rounded-full transition-colors text-white/80 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors text-white"
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[280px]"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage: 'radial-gradient(#d1c7bd 0.75px, transparent 0.75px)',
                backgroundSize: '12px 12px'
              }}
            >
              <div className="text-center my-2">
                <span className="text-[10px] bg-white/80 backdrop-blur-sm text-gray-500 font-medium px-3 py-1 rounded-full border border-gray-200/60 shadow-2xs">
                  Recent Chat Session
                </span>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-[#075e54] text-white flex items-center justify-center text-[10px] shrink-0 mb-1">
                      <Bot size={13} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm relative leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#dcf8c6] text-gray-800 rounded-br-xs border border-green-200'
                        : 'bg-white text-gray-800 rounded-bl-xs border border-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className="text-[9px] text-gray-400 block text-right mt-1 font-mono">
                      {msg.time}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-bloom-rose text-white flex items-center justify-center text-[10px] shrink-0 mb-1">
                      <User size={13} />
                    </div>
                  )}
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="p-2 bg-white/90 border-t border-gray-100 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
              <button
                type="button"
                onClick={() => handleQuickPrompt("How do I track my order?")}
                className="text-[11px] whitespace-nowrap bg-gray-100 hover:bg-bloom-pink hover:text-bloom-rose text-gray-600 px-2.5 py-1 rounded-full transition-colors border border-gray-200 shrink-0"
              >
                📦 Track Order
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt("What are your delivery options?")}
                className="text-[11px] whitespace-nowrap bg-gray-100 hover:bg-bloom-pink hover:text-bloom-rose text-gray-600 px-2.5 py-1 rounded-full transition-colors border border-gray-200 shrink-0"
              >
                🚚 Delivery Info
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt("Can I order custom hair accessories?")}
                className="text-[11px] whitespace-nowrap bg-gray-100 hover:bg-bloom-pink hover:text-bloom-rose text-gray-600 px-2.5 py-1 rounded-full transition-colors border border-gray-200 shrink-0"
              >
                🎀 Custom Accessories
              </button>
            </div>

            {/* Direct WhatsApp Option */}
            <div className="px-3 py-1.5 bg-green-50/80 border-t border-green-100 flex items-center justify-between text-xs text-green-900">
              <span className="text-[11px]">Prefer chatting in the WhatsApp app?</span>
              <button
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-1 font-bold text-[#075e54] hover:underline text-[11px]"
              >
                <span>Open WhatsApp</span>
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <form 
                onSubmit={handleSend}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-xs outline-none focus:border-[#075e54] focus:ring-1 focus:ring-[#075e54] transition-all text-gray-800"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-[#075e54] text-white w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-[#128c7e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={15} className="translate-x-[1px]" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


