import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, CheckCircle2, Clock, Coffee, Moon, HeartPulse, AlertCircle, BatteryFull, BatteryMedium, BatteryLow, Smile, Wind, Frown, Meh, Check, ChevronRight, Flame, Calendar as CalendarIcon, BookOpen, Target, MessageCircle, Palette, Bell, Menu, X, Settings as SettingsIcon, LayoutDashboard, Download } from 'lucide-react';
import { getPauvelPlan } from './lib/gemini';
import { initializeUser, savePlan, updatePlanTasks, getLatestPlan, addXP, auth } from './lib/firebase';
import type { PauvelResponse } from './types';
import { CalendarTab } from './components/CalendarTab';
import { ScheduleTab } from './components/ScheduleTab';
import { PaubellGuide } from './components/PaubellGuide';
import { Login } from './components/Login';
import { ChatTab } from './components/ChatTab';
import { AssistantTab } from './components/AssistantTab';
import { AlarmsTab } from './components/AlarmsTab';
import { ProjectsTab } from './components/ProjectsTab';
import { ErrorBoundary } from './components/ErrorBoundary';

import { SettingsTab } from './components/SettingsTab';

const ExpBar = ({ xp, level, label }: { xp: number, level: number, label?: string }) => {
  const xpToNext = level * 100;
  const progress = (xp / xpToNext) * 100;
  
  return (
    <div className="px-4 py-4 bg-app-card rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-3 group">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black text-app-muted uppercase tracking-[0.15em] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Nivel {level}
        </span>
        <span className="text-[10px] font-bold text-app-muted opacity-70 tracking-tighter">{Math.floor(xp)} / {xpToNext} XP</span>
      </div>
      <div className="relative h-2.5 w-full bg-app-bg rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-400 relative"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </motion.div>
      </div>
      <div className="flex items-center justify-between">
        {label && <p className="text-[10px] text-app-muted leading-tight font-medium opacity-80">{label}</p>}
        <div className="group-hover:block hidden animate-in fade-in slide-in-from-right-1">
           <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Sube de nivel para ropa</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState<'loading' | 'login' | 'checkin' | 'prompt' | 'plan'>('loading');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [energia, setEnergia] = useState<string>('');
  const [animo, setAnimo] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [futurePrompt, setFuturePrompt] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [data, setData] = useState<PauvelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'focus' | 'calendar' | 'schedule' | 'chat' | 'guide' | 'alarms' | 'projects' | 'settings'>('focus');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('paubell_theme') || 'dark';
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    if (savedTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'theme-dark' : 'theme-light');
    } else {
      root.classList.add(`theme-${savedTheme}`);
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const { user, profile } = await initializeUser();
        if (user && profile && profile.career) {
          setUserProfile(profile);
          const latest = await getLatestPlan();
          if (latest) {
            const now = new Date();
            const planDate = latest.createdAt?.toDate ? latest.createdAt.toDate() : new Date();
            const diffHours = (now.getTime() - planDate.getTime()) / (1000 * 60 * 60);
            
            if (diffHours < 12) {
              setData(latest.data);
              setEnergia(latest.energia);
              setAnimo(latest.animo);
              setCurrentPlanId(latest.id);
              setCompletedTasks(new Set(latest.completedTasks || []));
              setStep('plan');
              return;
            }
          }
          setStep('checkin');
        } else {
          setStep('login');
        }
      } catch (e) {
        console.error('Error during init', e);
        setStep('login');
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (step === 'prompt') {
      inputRef.current?.focus();
    }
  }, [step]);

  const handleLoginComplete = (career: string) => {
    setUserProfile({ career }); // simplified local state
    setStep('checkin');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || loadingAction) return;

    setLoadingAction(true);
    setError(null);
    try {
      const fullPrompt = `${prompt} (El usuario tiene experiencia/estudia: ${userProfile?.career || 'No especificado'})`;
      const response = await getPauvelPlan(fullPrompt, energia, animo);
      setData(response);
      setCompletedTasks(new Set());
      setStep('plan');

      const planId = await savePlan(energia, animo, prompt, response);
      if (planId) setCurrentPlanId(planId);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al conectar con PAUBELL.");
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleTask = async (idx: number) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      const wasCompleted = next.has(idx);
      
      if (wasCompleted) {
        next.delete(idx);
      } else {
        next.add(idx);
        // Calculate XP
        if (data && auth.currentUser) {
          const planData = data as PauvelResponse;
          const tarea = planData.analisis_logico.tareas[idx];
          let xpAmount = 15; // base
          
          if (tarea.dificultad === 'alta') xpAmount = 50;
          else if (tarea.dificultad === 'media') xpAmount = 25;
          else xpAmount = 10;
          
          // Bonus for priorities
          if (tarea.prioridad?.toLowerCase().includes('alta')) xpAmount += 10;
          
          addXP(auth.currentUser.uid, xpAmount).then(res => {
            if (res) {
              setUserProfile((prevProfile: any) => ({
                ...prevProfile,
                xp: res.xp,
                level: res.level,
                unlockedOutfits: res.newItems.length > 0 
                  ? Array.from(new Set([...(prevProfile?.unlockedOutfits || []), ...res.newItems]))
                  : prevProfile?.unlockedOutfits
              }));
              
              if (res.leveledUp) {
                console.log("Leveled up to!", res.level);
              }
            }
          }).catch(console.error);
        }
      }
      
      if (currentPlanId) {
        updatePlanTasks(currentPlanId, Array.from(next) as number[]).catch(console.error);
      }
      return next;
    });
  };

  const startNewDay = () => {
    setStep('checkin');
    setPrompt('');
    setEnergia('');
    setAnimo('');
    setCurrentPlanId(null);
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg">
         <PaubellGuide className="w-48 h-48 mb-8" outfit={userProfile?.outfit || 'default'} />
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
           <Sparkles className="w-8 h-8 text-indigo-500" />
         </motion.div>
         <p className="mt-6 text-app-muted font-bold tracking-widest uppercase text-xs">Preparando tu espacio...</p>
      </div>
    );
  }

  if (step === 'login') {
    return <Login onComplete={handleLoginComplete} />;
  }

  const bgColor = "bg-app-bg";
  const textColor = "text-app-text";
  const cardBg = "bg-app-card border border-slate-200/10 dark:border-slate-800 shadow-xl";

  const renderCheckin = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} translate="no" animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-10">
      <div className="text-center space-y-4 flex flex-col items-center">
        <PaubellGuide className="w-32 h-32 mb-2" mood="happy" outfit={userProfile?.outfit || 'default'} />
        <h1 className="text-4xl font-semibold text-indigo-50 tracking-tight">Check-in de Bienestar</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">Ajustemos tu día a lo que tu cuerpo y mente necesitan hoy.</p>
      </div>

      <div className="space-y-8">
        <div className={`space-y-4 p-8 rounded-3xl ${cardBg}`}>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-slate-200">
            <Flame className="w-6 h-6 text-violet-400" />
            ¿Cómo está tu batería de energía?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'Alta', icon: BatteryFull, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' },
              { id: 'Media', icon: BatteryMedium, color: 'text-orange-200', bg: 'bg-orange-500/10 border-orange-500/30' },
              { id: 'Baja', icon: BatteryLow, color: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/30' }
            ].map(opt => (
              <button key={opt.id} onClick={() => setEnergia(opt.id)} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${energia === opt.id ? opt.bg : 'border-transparent bg-app-bg dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.02]'}`}>
                <opt.icon className={`w-10 h-10 mb-3 ${opt.color}`} />
                <span className="font-bold text-app-text opacity-80">{opt.id}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`space-y-4 p-8 rounded-3xl ${cardBg}`}>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-slate-200">
            <HeartPulse className="w-6 h-6 text-violet-400" />
            ¿Cuál es tu estado de ánimo?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'Motivado', icon: Smile },
              { id: 'En Calma', icon: Wind },
              { id: 'Agotado', icon: Meh },
              { id: 'Estresado', icon: Frown }
            ].map(opt => (
              <button key={opt.id} onClick={() => setAnimo(opt.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2 ${animo === opt.id ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent bg-app-bg dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.02] text-app-muted'}`}>
                <opt.icon className="w-8 h-8 mb-2 opacity-80" />
                <span className="font-bold text-sm tracking-tight">{opt.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

              <div className="flex justify-center pt-4">
        <button onClick={() => setStep('prompt')} disabled={!energia || !animo} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          Continuar <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderPrompt = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mt-20">
      <div className="text-center mb-10 flex flex-col items-center">
        <PaubellGuide className="w-32 h-32 mb-4" mood="focus" outfit={userProfile?.outfit || 'default'} />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-app-card text-app-text font-bold mb-6 text-xs uppercase tracking-widest shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Energía: {energia} | Ánimo: {animo}
          <button onClick={() => setStep('checkin')} className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-500 transition-colors">Cambiar</button>
        </div>
        <h1 className="text-4xl font-semibold text-indigo-50 mb-4">¿Qué responsabilidades tienes hoy?</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">PAUBELL adaptará tu carga de trabajo a tu nivel de energía actual y profesión ({userProfile?.career}).</p>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full rounded-3xl shadow-2xl">
        <div className="relative flex items-center text-slate-200">
          <input
            ref={inputRef} type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Tengo que modelar en ZBrush y enviar 3 correos..."
            className="w-full rounded-3xl p-6 pr-20 outline-none transition-all duration-300 bg-app-card border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-app-text placeholder-app-muted/50 text-lg shadow-xl shadow-indigo-500/5 font-medium"
          />
          <button type="submit" disabled={loadingAction || !prompt.trim()} className="absolute right-3 w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-50 disabled:hover:bg-indigo-500 shadow-md">
            {loadingAction ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Clock className="w-6 h-6 text-white" /></motion.div> : <Send className="w-5 h-5 text-white" />}
          </button>
        </div>
      </form>
      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center justify-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</motion.div>}
    </motion.div>
  );

  const renderPlan = () => {
    if (!data) return null;
    return (
      <div className="max-w-[1400px] mx-auto h-full flex flex-col pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto hidden-scrollbar pr-2 pb-4 lg:pb-0">
            <div className={`p-5 rounded-2xl shrink-0 ${cardBg}`}>
              <h2 className="text-[10px] font-black tracking-[0.2em] text-indigo-500 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2"><Smile className="w-3.5 h-3.5" /> MENSAJE DE PAUBELL</h2>
              <p className="text-slate-200 text-sm leading-relaxed font-medium mb-4">"{data.interaccion.mensaje_ia}"</p>
              <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 italic font-medium shadow-inner text-xs">{data.interaccion.frase_motivacional}</div>
            </div>

            {data.analisis_logico.alertas_bienestar.tipo && (
              <div className={`p-4 rounded-2xl flex items-center gap-4 shrink-0 ${cardBg}`}>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  {data.analisis_logico.alertas_bienestar.tipo === 'comida' ? <Coffee className="w-5 h-5"/> :
                   data.analisis_logico.alertas_bienestar.tipo === 'sueño' ? <Moon className="w-5 h-5"/> : <HeartPulse className="w-5 h-5"/>}
                </div>
                <div>
                  <h3 className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-0.5">Cuidado Personal</h3>
                  <div className="text-slate-200 font-semibold text-sm mb-0.5">{data.analisis_logico.alertas_bienestar.hora}</div>
                  <p className="text-xs font-medium text-slate-400 leading-snug">{data.analisis_logico.alertas_bienestar.mensaje}</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col min-h-0">
            <div className={`p-6 md:p-8 rounded-3xl flex-1 flex flex-col min-h-0 ${cardBg}`}>
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-1.5 text-indigo-100"><CheckCircle2 className="w-6 h-6 text-indigo-400" /> Tareas Pendientes</h2>
                  <p className="text-slate-400 font-medium text-sm">Modo enfoque activado. Progresa a tu propio ritmo.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 min-h-0">
                {(() => {
                  const firstUncompletedIndex = data.analisis_logico.tareas.findIndex((_, i) => !completedTasks.has(i));
                  const isAllDone = firstUncompletedIndex === -1;

                  if (isAllDone) {
                    return (
                      <div className="py-12 text-center bg-app-bg rounded-3xl border border-slate-200 dark:border-slate-800 px-6 mt-2 shadow-sm">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <CheckCircle2 className="w-10 h-10" />
                        </motion.div>
                        <h3 className="text-2xl font-semibold text-indigo-100 mb-3">¡Excelente, día completado!</h3>
                        <p className="text-slate-400 mb-6 max-w-lg mx-auto leading-relaxed text-base">Has terminado todas tus responsabilidades apoyando tu nivel de energía actual. Para mantener el flujo, define un objetivo o agenda tus pendientes.</p>
                        
                        <div className="max-w-xl mx-auto flex flex-col gap-4 text-left">
                          <textarea 
                             className="w-full bg-app-card border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-app-text placeholder-app-muted/50 outline-none focus:border-indigo-500 resize-none h-32 shadow-inner font-medium"
                             placeholder="Ej: Agendar mis pendientes para la proxima semana..."
                             value={futurePrompt}
                             onChange={(e) => setFuturePrompt(e.target.value)}
                          />
                          <button 
                             disabled={!futurePrompt.trim()}
                             onClick={() => {
                               setPrompt("Siguiente objetivo o día: " + futurePrompt);
                               setFuturePrompt('');
                               setCurrentPlanId(null);
                               setStep('checkin');
                             }}
                             className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                          >
                            Planificar <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return data.analisis_logico.tareas.map((tarea, idx) => {
                    const isCompleted = completedTasks.has(idx);
                    const isCurrent = idx === firstUncompletedIndex;
                    const isFuture = !isCompleted && !isCurrent;

                    if (isFuture) {
                      return (
                        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={idx}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-app-bg flex items-center p-4 gap-4 opacity-50 shrink-0"
                        >
                           <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></div>
                           </div>
                           <h3 className="font-medium text-app-muted flex-1 truncate text-sm">{tarea.titulo}</h3>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted bg-app-card px-2.5 py-1 rounded-md shrink-0"><Clock className="w-2.5 h-2.5 inline mr-1" /> {tarea.tiempo_estimado}</span>
                        </motion.div>
                      );
                    }

                    if (isCurrent) {
                      return (
                        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={idx}
                          className="rounded-3xl border-2 border-indigo-500 bg-app-card shadow-xl shadow-indigo-500/10 z-10 relative overflow-hidden shrink-0"
                        >
                          <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-5">
                            <div className="flex-1 space-y-3">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                                <Flame className="w-3 h-3" /> En Progreso
                              </div>
                              <h3 className="font-bold text-xl leading-tight text-app-text">{tarea.titulo}</h3>
                              
                              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-app-muted">
                                <span className="flex items-center gap-1.5 bg-app-bg px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 shadow-sm"><Clock className="w-3.5 h-3.5" /> {tarea.tiempo_estimado}</span>
                                <span className="flex items-center gap-1.5">Prioridad: <span className={tarea.prioridad?.toLowerCase().includes('alta') ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}>{tarea.prioridad}</span></span>
                              </div>
                            </div>
                            
                              <button onClick={() => toggleTask(idx)} className="self-start px-6 py-3 bg-indigo-500 transition-all text-white rounded-xl font-bold flex items-center justify-center gap-2 w-full md:w-auto shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 text-sm ring-2 ring-indigo-500 ring-offset-2 ring-offset-app-card active:scale-95">
                                <Check className="w-5 h-5" /> Completar
                              </button>
                          </div>
                          
                          {tarea.subpasos && tarea.subpasos.length > 0 && (
                            <div className="px-5 md:px-6 pb-5 pt-4 border-t border-slate-200 dark:border-slate-800 bg-app-bg">
                              <h4 className="text-[10px] font-bold tracking-widest text-app-muted uppercase mb-3">Pasos para completar:</h4>
                              <ul className="space-y-2.5">
                                {tarea.subpasos.map((paso, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-3 bg-app-card border border-slate-200/50 dark:border-slate-800/50 p-3 rounded-xl shadow-sm transition-colors text-sm text-app-text">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500/50 flex-shrink-0" />
                                    <span className="font-medium leading-relaxed">{paso}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx}
                          className="rounded-2xl bg-app-bg border border-slate-200 dark:border-slate-800 flex items-center p-4 gap-4 opacity-60 grayscale shrink-0"
                        >
                           <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-app-muted flex items-center justify-center flex-shrink-0">
                             <Check className="w-3 h-3" />
                           </div>
                           <h3 className="font-medium text-app-muted line-through truncate text-sm">{tarea.titulo}</h3>
                        </motion.div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen font-sans flex overflow-hidden bg-app-bg ${textColor}`}>
      {step === 'plan' && (
        <>
          {/* Mobile top bar */}
          <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-app-bg/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/60 z-50 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <PaubellGuide className="w-8 h-8" mood="calm" outfit={userProfile?.outfit || 'default'} />
              <span className="font-black text-xl text-app-text tracking-tighter">PAUBELL</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-app-muted hover:text-indigo-500">
              <Menu className="w-6 h-6" />
            </button>
          </div>
          
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] md:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 z-[70] w-64 bg-app-bg border-r border-slate-200/50 dark:border-slate-800/60 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:sticky md:top-0 md:h-screen shrink-0`}>
             <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PaubellGuide className="w-10 h-10" mood="calm" outfit={userProfile?.outfit || 'default'} />
                  <span className="font-black text-2xl tracking-tighter text-app-text">PAUBELL</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 hide-scrollbar">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest px-3 mb-3">Principal</p>
                  
                  <button onClick={() => { startNewDay(); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-app-muted hover:bg-app-card hover:text-indigo-500">
                    <LayoutDashboard className="w-4 h-4" /> Nuevo Check-in
                  </button>
                  
                  <button onClick={() => { setActiveTab('focus'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'focus' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                    <Target className="w-4 h-4" /> Enfoque de Hoy
                  </button>
                  
                  <button onClick={() => { setActiveTab('projects'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'projects' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                    <BookOpen className="w-4 h-4" /> Trabajos Finales
                  </button>
                  
                  <button onClick={() => { setActiveTab('guide'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'guide' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                    <Palette className="w-4 h-4" /> Asistente
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em] px-3">PROGRESO DE PAUBELL</p>
                  <ExpBar 
                    xp={userProfile?.xp || 0} 
                    level={userProfile?.level || 1} 
                    label="Completa tareas para ganar XP y desbloquear nuevos accesorios."
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest px-3 mb-3">Herramientas</p>
                  
                  <button onClick={() => { setActiveTab('schedule'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'schedule' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                    <Clock className="w-4 h-4" /> Horario
                  </button>
                  
                  <button onClick={() => { setActiveTab('calendar'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'calendar' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                    <CalendarIcon className="w-4 h-4" /> Calendario
                  </button>
                  
                  <button onClick={() => { setActiveTab('chat'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                    <MessageCircle className="w-4 h-4" /> Chat
                  </button>
                  
                  <button onClick={() => { setActiveTab('alarms'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'alarms' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                    <Bell className="w-4 h-4" /> Alarmas
                  </button>
                </div>
             </div>

             <div className="p-4 border-t border-slate-800/60 space-y-3">
                <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-app-muted hover:bg-app-card hover:text-indigo-500'}`}>
                  <SettingsIcon className="w-4 h-4" /> Ajustes
                </button>
                {deferredPrompt && (
                   <button onClick={handleInstall} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 shadow-sm border border-teal-500/20">
                     <Download className="w-4 h-4" /> Instalar App
                   </button>
                 )}
             </div>
          </div>
        </>
      )}

      <main className={`flex-1 overflow-y-auto px-4 py-6 md:p-6 flex flex-col ${step === 'plan' ? 'mt-16 md:mt-0 pt-4 md:pt-6' : ''}`}>
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {step === 'checkin' && <motion.div key="checkin" exit={{ opacity: 0, y: -20 }} className="pt-10 max-w-4xl mx-auto flex-1">{renderCheckin()}</motion.div>}
            {step === 'prompt'  && <motion.div key="prompt" exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto flex-1">{renderPrompt()}</motion.div>}
            
            {step === 'plan' && activeTab === 'focus' && <motion.div key="plan-focus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 min-h-0 w-full h-full">{renderPlan()}</motion.div>}
            {step === 'plan' && activeTab === 'projects' && <motion.div key="plan-projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1"><ProjectsTab onClickShop={() => setActiveTab('guide')} userProfile={userProfile} /></motion.div>}
            {step === 'plan' && activeTab === 'calendar' && <motion.div key="plan-calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1"><CalendarTab userProfile={userProfile} /></motion.div>}
            {step === 'plan' && activeTab === 'schedule' && <motion.div key="plan-schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1"><ScheduleTab userProfile={userProfile} /></motion.div>}
            {step === 'plan' && activeTab === 'chat' && <motion.div key="plan-chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1"><ChatTab outfit={userProfile?.outfit || 'default'} /></motion.div>}
            {step === 'plan' && activeTab === 'guide' && <motion.div key="plan-guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1"><AssistantTab userProfile={userProfile} setUserProfile={setUserProfile} /></motion.div>}
            {step === 'plan' && activeTab === 'alarms' && <motion.div key="plan-alarms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1"><AlarmsTab /></motion.div>}
            {step === 'plan' && activeTab === 'settings' && <motion.div key="plan-settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1"><SettingsTab userProfile={userProfile} /></motion.div>}
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      
      {/* Fake visibility change listener (context switching detection) */}
      <VisibilityWatcher outfit={userProfile?.outfit || 'default'} />
    </div>
  );
}

const VisibilityWatcher: React.FC<{outfit?: string}> = ({outfit = 'default'}) => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastHidden = sessionStorage.getItem('lastHidden');
        if (lastHidden) {
          const timeAway = Date.now() - parseInt(lastHidden, 10);
          // If away for more than 5 seconds but less than an hour, assume they were distracted
          if (timeAway > 5000 && timeAway < 3600000) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 8000);
          }
        }
      } else {
        sessionStorage.setItem('lastHidden', Date.now().toString());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 max-w-sm bg-app-card border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-5 shadow-2xl z-[100] flex gap-4 backdrop-blur-md"
        >
          <PaubellGuide className="w-12 h-12 flex-shrink-0" mood="calm" outfit={outfit} />
          <div>
            <h4 className="text-app-text font-bold mb-1">¡Bienvenido de vuelta!</h4>
            <p className="text-app-muted text-sm leading-relaxed">Noté que te distrajiste un ratito. Recuerda que cuidar tu bienestar y terminar tus pendientes te dará más tiempo libre luego. ¡Tú puedes!</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
