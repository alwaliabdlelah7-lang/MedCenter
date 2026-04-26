import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  Menu, 
  User as UserIcon, 
  Users, 
  Hash, 
  Clock, 
  Plus, 
  Paperclip,
  Smile,
  MoreVertical,
  Circle,
  AlertCircle,
  Sparkles,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserProfile, Message } from '../types';
import { cn } from '../lib/utils';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { askGemini } from '../services/geminiService';
import { dataStore } from '../services/dataService';

export default function StaffChat() {
  const { user: authUser } = useAuth();
  const [activeChat, setActiveChat] = useState<string>('general');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      const allUsers = await dataStore.getAll<UserProfile>('users');
      setUsers(allUsers);
    };
    loadUsers();

    // Initialize socket
    socketRef.current = io();

    socketRef.current.on('receive-message', (msg: Message) => {
      setMessages(prev => {
        // Prevent indexing issues or duplicate rendering
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('join-chat', activeChat);
    }
  }, [activeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !socketRef.current) return;

    const content = messageText;
    const newMessage: Message = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: authUser?.id || 'u-admin',
      content: content,
      timestamp: new Date().toISOString(),
      chatId: activeChat
    };

    socketRef.current.emit('send-message', newMessage);
    setMessageText('');

    // AI Trigger
    if (content.toLowerCase().startsWith('@ai')) {
      const prompt = content.slice(3).trim() || "كيف يمكنني مساعدتك اليوم؟";
      
      // Add loading message
      const loadingId = `AI-LOAD-${Date.now()}`;
      const loadingMsg: Message = {
        id: loadingId,
        senderId: 'ai-bot',
        content: 'جاري التفكير...',
        timestamp: new Date().toISOString(),
        chatId: activeChat
      };
      setMessages(prev => [...prev, loadingMsg]);

      const aiResponse = await askGemini(prompt);
      
      // Update loading message with response
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: aiResponse || 'عذراً، لم أستطع فهم طلبك.' } : m));
    }
  };

  const currentMessages = messages.filter(m => m.chatId === activeChat);

  return (
    <div className="h-[calc(100vh-140px)] glass rounded-[40px] flex overflow-hidden border border-white/10 text-right">
      {/* Sidebar Channels/Users */}
      <div className="w-80 border-l border-white/10 bg-white/5 flex flex-col">
         <div className="p-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
               <Hash className="text-indigo-400" /> التواصل الداخلي
            </h3>
            <div className="relative">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <input 
                type="text" 
                placeholder="بحث عن موظف أو قناة..." 
                className="w-full pr-10 pl-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none text-xs" 
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            <div className="px-4 py-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">القنوات العامة</div>
            <ChannelButton id="general" name="العامة" active={activeChat === 'general'} onClick={setActiveChat} icon={Hash} />
            <ChannelButton id="reception" name="قسم الاستقبال" active={activeChat === 'reception'} onClick={setActiveChat} icon={Users} />
            <ChannelButton id="emergency" name="حالات الطوارئ" active={activeChat === 'emergency'} onClick={setActiveChat} icon={AlertCircle} />
            
            <div className="px-4 py-2 pt-6 text-[10px] text-slate-500 font-black uppercase tracking-widest">المساعدة الذكية</div>
            <button 
              onClick={() => {
                setActiveChat('general');
                setMessageText('@ai اشرح لي كيف يعمل الذكاء الاصطناعي في بضع كلمات');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs text-right bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20"
            >
               <Sparkles size={16} />
               <span>اسأل المساعد الذكي</span>
            </button>

            <div className="px-4 py-2 pt-6 text-[10px] text-slate-500 font-black uppercase tracking-widest">الموظفون (DMs)</div>
            {users.map(u => (
              <UserChatButton key={u.id} profile={u} active={activeChat === u.id} onClick={setActiveChat} />
            ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/5">
         <div className="p-6 glass bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 glass bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <Hash size={20} />
               </div>
               <div>
                  <h4 className="font-bold text-white">{activeChat === 'general' ? 'القناة العامة' : 'محادثة الموظف'}</h4>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                     <Circle size={8} className="fill-current" /> 14 موظف نشط حالياً
                  </p>
               </div>
            </div>
            <button className="p-2 text-slate-500 hover:text-white"><MoreVertical size={20} /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar flex flex-col-reverse">
            <div className="space-y-6">
               <AnimatePresence>
                  {currentMessages.map((msg, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`${msg.id}-${idx}`} 
                      className={cn(
                        "flex gap-4 max-w-[80%]",
                        msg.senderId === authUser?.id ? "mr-auto flex-row-reverse" : "ml-auto"
                      )}
                    >
                       <div className="w-8 h-8 rounded-lg glass bg-white/10 shrink-0 border border-white/10 flex items-center justify-center text-slate-400 text-xs">
                          {msg.senderId === 'ai-bot' ? <Bot size={16} className="text-sky-400" /> : (users.find(u => u.id === msg.senderId)?.name.charAt(0) || 'U')}
                       </div>
                       <div className="space-y-1">
                          <div className={cn("flex items-center gap-2", msg.senderId === authUser?.id ? "flex-row-reverse" : "")}>
                             <span className="text-[10px] font-bold text-white">{msg.senderId === 'ai-bot' ? 'مساعد الذكاء الاصطناعي' : (users.find(u => u.id === msg.senderId)?.name || 'موظف')}</span>
                             <span className="text-[9px] text-slate-500 font-mono italic">{new Date(msg.timestamp).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={cn(
                            "p-4 rounded-3xl text-sm leading-relaxed",
                            msg.senderId === authUser?.id 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                              : msg.senderId === 'ai-bot'
                                ? "bg-sky-600/20 text-sky-100 border border-sky-500/30"
                                : "glass bg-white/5 text-slate-200 border border-white/10"
                          )}>
                             {msg.content}
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         </div>

         <div className="p-6">
            <form onSubmit={handleSend} className="glass bg-white/5 border border-white/10 p-2 rounded-3xl flex items-center gap-2">
               <button type="button" className="p-3 text-slate-500 hover:text-white transition-colors"><Paperclip size={20} /></button>
               <input 
                type="text" 
                className="flex-1 bg-transparent border-none outline-none text-white text-sm px-4 placeholder:text-slate-600" 
                placeholder="اكتب رسالتك للموظفين هنا..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
               />
               <button type="button" className="p-3 text-slate-500 hover:text-white transition-colors"><Smile size={20} /></button>
               <button type="submit" className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all">
                  <Send size={18} />
               </button>
            </form>
         </div>
      </div>
    </div>
  );
}

function ChannelButton({ id, name, active, onClick, icon: Icon }: { id: string, name: string, active: boolean, onClick: (id: string) => void, icon: any }) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs text-right",
        active ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xl" : "text-slate-500 hover:bg-white/5"
      )}
    >
       <Icon size={16} />
       <span>{name}</span>
    </button>
  );
}

const UserChatButton: React.FC<{ profile: UserProfile, active: boolean, onClick: (id: string) => void }> = ({ profile, active, onClick }) => {
  return (
    <button 
      onClick={() => onClick(profile.id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs text-right",
        active ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-500 hover:bg-white/5"
      )}
    >
       <div className="relative">
          <div className="w-8 h-8 rounded-lg glass bg-white/5 flex items-center justify-center border border-white/10 uppercase italic">
             {profile.name.charAt(0)}
          </div>
          {profile.status === 'active' && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#1e293b] rounded-full" />}
       </div>
       <div className="flex-1 text-right">
          <p className="leading-tight">{profile.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 italic">{profile.role}</p>
       </div>
    </button>
  );
};

