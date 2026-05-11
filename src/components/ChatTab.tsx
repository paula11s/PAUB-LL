import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Loader2, Trash2, Sparkles, MessageSquarePlus } from 'lucide-react';
import { PaubellGuide } from './PaubellGuide';
import { clearChatHistory, getMessages, addMessage } from '../lib/firebase';
import { getPauvelChatResponse } from '../lib/gemini';
import Markdown from 'react-markdown';

export const ChatTab: React.FC<{ outfit?: string }> = ({ outfit = 'default' }) => {
  const [messages, setMessages] = useState<{role: 'user'|'guide', text: string, mood?: 'happy'|'calm'|'focus'}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getMessages();
      if (data.length === 0) {
        const welcome = { role: 'guide' as const, text: '¡Hola! ¿En qué puedo ayudarte hoy? Estoy aquí si necesitas un consejo, ayuda con un trabajo, o simplemente alguien con quien hablar.', mood: 'happy' as 'happy'|'calm'|'focus' };
        setMessages([welcome]);
        try {
          await addMessage(welcome);
        } catch(e) { console.error("Error init message", e); }
      } else {
        setMessages(data as any[]);
      }
    } catch (e) {
      console.error("Error loading messages", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleClearChat = async () => {
    await clearChatHistory();
    setMessages([]);
    setShowConfirm(false);
    fetchMessages();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    
    const newMsg = { role: 'user' as const, text: userMessage };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    
    try {
      await addMessage(newMsg);
      const allMsgs = [...messages, newMsg];
      const aiResponse = await getPauvelChatResponse(allMsgs);
      const aiMsg = { role: 'guide' as const, text: aiResponse.text, mood: aiResponse.mood };
      setMessages(prev => [...prev, aiMsg]);
      await addMessage(aiMsg);
    } catch (error) {
      console.error(error);
      const errorMsg = { role: 'guide' as const, text: 'Tuve un problemita técnico conectando con mi cerebro. ¡Vuelve a intentarlo!', mood: 'calm' as const };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return <div className="text-center text-app-muted py-10">Cargando historial...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto bg-app-card border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-4 bg-app-bg border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h3 className="text-app-text font-black tracking-tight flex items-center gap-2 uppercase"><Sparkles className="w-5 h-5 text-indigo-500" /> CHAT CON PAUBELL</h3>
        <div className="flex gap-2">
          <button onClick={handleClearChat} title="Nuevo Chat" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
            <MessageSquarePlus className="w-4 h-4" /> Nuevo Chat
          </button>
          
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-app-muted">¿Seguro?</span>
              <button onClick={handleClearChat} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                Sí, borrar
              </button>
              <button onClick={() => setShowConfirm(false)} className="bg-slate-200 dark:bg-slate-700 text-app-text hover:bg-slate-300 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                No
              </button>
            </div>
          ) : (
            <button onClick={() => setShowConfirm(true)} className="bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
              <Trash2 className="w-4 h-4" /> Limpiar
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              {m.role === 'guide' ? <PaubellGuide className="w-10 h-10" mood={m.mood || 'calm'} outfit={outfit} /> : <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20"><UserIcon className="w-5 h-5 text-white" /></div>}
            </div>
            <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${m.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-app-bg border border-slate-200 dark:border-slate-800 text-app-text rounded-tl-none'}`}>
              {m.role === 'guide' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                  <Markdown>{m.text}</Markdown>
                </div>
              ) : (
                <p className="leading-relaxed text-sm whitespace-pre-line break-words">{m.text}</p>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 flex-row animate-pulse">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              <PaubellGuide className="w-10 h-10" mood="focus" outfit={outfit} />
            </div>
            <div className="p-4 rounded-2xl max-w-[80%] bg-app-bg border border-slate-200 dark:border-slate-800 text-app-muted rounded-tl-none flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">PAUBELL está escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-app-bg border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "Espera un momento..." : "Pide un consejo o ayuda..."}
            className="w-full bg-app-card border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-6 pr-16 text-app-text placeholder-app-muted/50 outline-none focus:border-indigo-500 transition-all disabled:opacity-50 shadow-inner"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-3 w-10 h-10 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
