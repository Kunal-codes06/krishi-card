/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { Globe } from 'lucide-react';

const Chatbot = () => {
  const { selectedLocation } = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your Krishi Cart AI Assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Intercept price queries to provide local mandi prices
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('price') || lowerInput.includes('rate') || lowerInput.includes('mandi')) {
        const priceRes = await fetch(`http://localhost:5000/api/mandi-prices?city=${encodeURIComponent(selectedLocation)}`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          if (priceData.records && priceData.records.length > 0) {
            const priceList = priceData.records.slice(0, 5).map(r => `${r.commodity}: ₹${r.modal_price}/kg`).join(', ');
            setMessages(prev => [...prev, { 
              id: Date.now() + 1, 
              text: `Here are the latest live prices in ${selectedLocation}: ${priceList}. Let me know if you need specific crop details!`, 
              sender: 'bot' 
            }]);
            setIsTyping(false);
            return;
          }
        }
      }

      // Default chat flow with location context
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.text, 
          location: selectedLocation,
          language: language,
          userId: user?.id || 'anonymous'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'bot' }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting right now.", sender: 'bot' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I'm offline at the moment.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-50 animate-bounce"
          aria-label="Open AI Chatbot"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-emerald-600"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-4 flex items-center justify-between shadow-md z-10 relative">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-1">Krishi AI <Sparkles className="w-4 h-4 text-yellow-300" /></h3>
                <p className="text-emerald-100 text-xs font-medium">Online & Ready to Help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Globe className="w-4 h-4 text-emerald-100 absolute left-2" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-emerald-800 text-white text-xs py-1 pl-7 pr-2 rounded appearance-none border-none focus:ring-1 focus:ring-emerald-300 cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी</option>
                  <option value="Marathi">मराठी</option>
                </select>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-emerald-100 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.sender === 'user' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-emerald-600 border border-slate-100'}`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>
                <div 
                  className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="shrink-0 w-8 h-8 rounded-full bg-white text-emerald-600 border border-slate-100 flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about crops, prices..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};

export default Chatbot;
