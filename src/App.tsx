import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, CheckCircle2, Clock, Coffee, Moon, HeartPulse, AlertCircle, BatteryFull, BatteryMedium, BatteryLow, Smile, Wind, Frown, Meh, Check, ChevronRight, Flame, Calendar as CalendarIcon, BookOpen, Target } from 'lucide-react';
import { getPauvelPlan } from './lib/gemini';
import { initializeUser, savePlan, updatePlanTasks, getLatestPlan } from './lib/firebase';
import type { PauvelResponse } from './types';
import { CalendarTab } from './components/CalendarTab';
import { ScheduleTab } from './components/ScheduleTab';
import { PaubellGuide } from './components/PaubellGuide';

const getBgColor = (suggestion: string) => {
  const lower = suggestion?.toLowerCase() || '';
  if (lower.includes("claro")) return "#FFFBF0"; 
  if (lower.includes("oscuro")) return "#F1F5F9";
  if (lower.includes("azul_profundo") || lower.includes("azul")) return "#EFF6FF";
  return "#F8FAFC";
};

const getTextColor = (suggestion: string) => {
  return "text-slate-700";
};

const getCardBg = (suggestion: string) => {
  return "bg-white/80 backdrop-blur-md border border-white shadow-sm";
};

export default function App() {
  const [step, setStep] = useState<'checkin' | 'prompt' | 'plan'>('checkin');
  const [energia, setEnergia] = useState<string>('');
  const [animo, setAnimo] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [futurePrompt, setFuturePrompt] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PauvelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedTask, setExpandedTask] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'focus' | 'calendar' | 'schedule'>('focus');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      try {
        await initializeUser();
        const latest = await getLatestPlan();
        if (latest) {
          // If the plan is less than 12 hours old, load it
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
          }
        }
      } catch (e) {
        console.error('Error during init', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (step === 'prompt') {
      inputRef.current?.focus();
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await getPauvelPlan(prompt, energia, animo);
      setData(response);
      setExpandedTask(0);
      setCompletedTasks(new Set());
      setStep('plan');

      // Save to Firebase
      const planId = await savePlan(energia, animo, prompt, response);
      if (planId) setCurrentPlanId(planId);
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al conectar con Paubéll.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (idx: number) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        if (data && next.size < data.analisis_logico.tareas.length) {
          const nextIdx = data.analisis_logico.tareas.findIndex((_, i) => !next.has(i));
          if (nextIdx !== -1) setExpandedTask(nextIdx);
        }
      }
      
      // Update firebase asynchronously
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

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
         <PaubellGuide className="w-48 h-48 mb-8" />
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
           <Sparkles className="w-8 h-8 text-indigo-400" />
         </motion.div>
         <p className="mt-4 text-slate-500 font-medium">Preparando tu espacio...</p>
      </div>
    );
  }

  const bgColor = data && step === 'plan' ? getBgColor(data.estetica_interfaz?.fondo_sugerido || '') : "#F8FAFC";
  const textColor = data && step === 'plan' ? getTextColor(data.estetica_interfaz?.fondo_sugerido || '') : "text-slate-700";
  const cardBg = data && step === 'plan' ? getCardBg(data.estetica_interfaz?.fondo_sugerido || '') : "bg-white border border-slate-200/60 shadow-sm";
  const accentColor = data && step === 'plan' ? (data.estetica_interfaz?.color_enfasis || "#818CF8") : "#818CF8"; // indigo-400

  const renderCheckin = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} translate="no" animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-10">
      <div className="text-center space-y-4 flex flex-col items-center">
        <PaubellGuide className="w-32 h-32 mb-2" mood="happy" />
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Check-in de Bienestar</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">Ajustemos tu día a lo que tu cuerpo y mente necesitan hoy.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
            <Flame className="w-6 h-6 text-orange-400" />
            ¿Cómo está tu batería de energía?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'Alta', icon: BatteryFull, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
              { id: 'Media', icon: BatteryMedium, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200 text-amber-800' },
              { id: 'Baja', icon: BatteryLow, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200 text-rose-800' }
            ].map(opt => (
              <button key={opt.id} onClick={() => setEnergia(opt.id)} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${energia === opt.id ? opt.bg : 'border-transparent bg-slate-50 hover:border-slate-300 hover:bg-slate-100/80 hover:scale-[1.02]'}`}>
                <opt.icon className={`w-10 h-10 mb-3 ${opt.color}`} />
                <span className="font-bold">{opt.id}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
            <HeartPulse className="w-6 h-6 text-rose-400" />
            ¿Cuál es tu estado de ánimo?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'Motivado', icon: Smile },
              { id: 'En Calma', icon: Wind },
              { id: 'Agotado', icon: Meh },
              { id: 'Estresado', icon: Frown }
            ].map(opt => (
              <button key={opt.id} onClick={() => setAnimo(opt.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2 ${animo === opt.id ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-transparent bg-slate-50 hover:border-slate-300 hover:bg-slate-100/80 hover:scale-[1.02]'}`}>
                <opt.icon className="w-8 h-8 mb-2 opacity-80" />
                <span className="font-semibold text-sm">{opt.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={() => setStep('prompt')} disabled={!energia || !animo} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          Continuar <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderPrompt = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mt-20">
      <div className="text-center mb-10 flex flex-col items-center">
        <PaubellGuide className="w-32 h-32 mb-4" mood="focus" />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-white/50 text-slate-600 font-medium mb-6 text-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          Energía: {energia} | Ánimo: {animo}
          <button onClick={() => setStep('checkin')} className="ml-2 text-indigo-500 font-semibold hover:text-indigo-600 transition-colors">Cambiar</button>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-4">¿Qué responsabilidades tienes hoy?</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">Paubéll adaptará tu carga de trabajo a tu nivel de energía actual para no saturarte.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full rounded-3xl shadow-xl shadow-indigo-100">
        <div className="relative flex items-center text-slate-700">
          <input
            ref={inputRef} type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Tengo que modelar en ZBrush y enviar 3 correos..."
            className="w-full rounded-3xl p-6 pr-20 outline-none transition-all duration-300 bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-slate-800 placeholder-slate-400 text-lg shadow-none"
          />
          <button type="submit" disabled={loading || !prompt.trim()} className="absolute right-3 w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:hover:bg-indigo-500 shadow-md">
            {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Clock className="w-6 h-6 text-white" /></motion.div> : <Send className="w-5 h-5 text-white" />}
          </button>
        </div>
      </form>
      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center justify-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</motion.div>}
    </motion.div>
  );

  const renderPlan = () => {
    if (!data) return null;
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <PaubellGuide className="w-14 h-14" mood="calm" />
            <div>
              <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-1">Divulgación Progresiva</p>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Project Focus</h1>
            </div>
          </div>
          <button onClick={startNewDay} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            Nuevo Día
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className={`p-8 rounded-3xl ${cardBg}`}>
              <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-4 flex items-center gap-2"><Smile className="w-4 h-4" /> Mensaje de Paubéll</h2>
              <p className="text-slate-700 text-xl leading-relaxed font-semibold mb-8">"{data.interaccion.mensaje_ia}"</p>
              <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-800 italic font-medium shadow-inner">{data.interaccion.frase_motivacional}</div>
            </div>

            {data.analisis_logico.alertas_bienestar.tipo && (
              <div className={`p-6 rounded-3xl flex items-center gap-5 ${cardBg}`}>
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center flex-shrink-0">
                  {data.analisis_logico.alertas_bienestar.tipo === 'comida' ? <Coffee className="w-7 h-7"/> :
                   data.analisis_logico.alertas_bienestar.tipo === 'sueño' ? <Moon className="w-7 h-7"/> : <HeartPulse className="w-7 h-7"/>}
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-rose-400 uppercase mb-1">Cuidado Personal</h3>
                  <div className="text-slate-800 font-bold mb-1">{data.analisis_logico.alertas_bienestar.hora}</div>
                  <p className="text-sm font-medium text-slate-600">{data.analisis_logico.alertas_bienestar.mensaje}</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className={`p-6 md:p-10 rounded-3xl min-h-full ${cardBg}`}>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-2 text-slate-800"><CheckCircle2 className="w-7 h-7" style={{ color: accentColor }} /> Focus Mode</h2>
              <p className="text-slate-500 font-medium mb-8">Concéntrate solo en la tarea actual. El resto puede esperar.</p>

              <div className="space-y-5">
                {(() => {
                  const firstUncompletedIndex = data.analisis_logico.tareas.findIndex((_, i) => !completedTasks.has(i));
                  const isAllDone = firstUncompletedIndex === -1;

                  if (isAllDone) {
                    return (
                      <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 px-6 mt-4 shadow-sm">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                          <CheckCircle2 className="w-12 h-12" />
                        </motion.div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-4">¡Excelente, día completado!</h3>
                        <p className="text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed text-lg">Has terminado todas tus responsabilidades apoyando tu nivel de energía actual. Para mantener el flujo, define un objetivo o agenda tus pendientes.</p>
                        
                        <div className="max-w-xl mx-auto flex flex-col gap-4 text-left">
                          <textarea 
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white resize-none h-32 shadow-inner font-medium"
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
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                             }}
                             className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 transition-colors text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
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
                          className="rounded-3xl border border-slate-100 bg-slate-50/50 flex items-center p-5 gap-5"
                        >
                           <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center">
                             <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                           </div>
                           <h3 className="font-semibold text-slate-500 flex-1 truncate text-lg">{tarea.titulo}</h3>
                           <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100"><Clock className="w-3 h-3 inline mr-1" /> {tarea.tiempo_estimado}</span>
                        </motion.div>
                      );
                    }

                    if (isCurrent) {
                      return (
                        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={idx}
                          className="rounded-3xl border-2 bg-white shadow-xl shadow-indigo-100/50 z-10 relative overflow-hidden"
                          style={{ borderColor: accentColor }}
                        >
                          <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
                            <div className="flex-1 space-y-6">
                              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}>
                                <Flame className="w-4 h-4" /> En Progreso
                              </div>
                              <h3 className="font-bold text-3xl leading-tight text-slate-800">{tarea.titulo}</h3>
                              
                              <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-wider text-slate-500">
                                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl"><Clock className="w-5 h-5" /> {tarea.tiempo_estimado}</span>
                                <span className="flex items-center gap-2">Prioridad: <span className={tarea.prioridad?.toLowerCase().includes('alta') ? 'text-rose-500' : 'text-amber-500'}>{tarea.prioridad}</span></span>
                              </div>
                            </div>
                            
                            <button onClick={() => toggleTask(idx)} className="self-start px-8 py-4 transition-colors text-white rounded-2xl font-bold flex items-center justify-center gap-3 w-full md:w-auto shadow-lg hover:brightness-110" style={{ backgroundColor: accentColor }}>
                              <Check className="w-6 h-6" /> Completar
                            </button>
                          </div>
                          
                          {tarea.subpasos && tarea.subpasos.length > 0 && (
                            <div className="px-8 md:px-10 pb-10 pt-6 border-t border-slate-100 bg-slate-50">
                              <h4 className="text-xs font-bold tracking-widest uppercase mb-6 mt-2" style={{ color: accentColor }}>Pasos para completar:</h4>
                              <ul className="space-y-4">
                                {tarea.subpasos.map((paso, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                                    <span className="text-slate-700 text-base font-medium leading-relaxed">{paso}</span>
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
                          className="rounded-3xl bg-slate-100/50 flex items-center p-5 gap-5"
                        >
                           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-400 flex items-center justify-center flex-shrink-0">
                             <Check className="w-4 h-4" />
                           </div>
                           <h3 className="font-semibold text-slate-400 line-through truncate text-lg">{tarea.titulo}</h3>
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
    <div className={`min-h-screen transition-colors duration-1000 font-sans flex flex-col ${textColor}`} style={{ backgroundColor: bgColor }}>
      {/* Navigation App Bar */}
      {!loading && data && step === 'plan' && (
        <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <PaubellGuide className="w-8 h-8" mood="happy" />
                <span className="font-bold text-xl tracking-tight text-slate-800">Paubéll</span>
              </div>
              <div className="flex gap-1 md:gap-4">
                <button onClick={() => setActiveTab('focus')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'focus' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Target className="w-4 h-4" /> Focus
                </button>
                <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'calendar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <CalendarIcon className="w-4 h-4" /> Calendario
                </button>
                <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <BookOpen className="w-4 h-4" /> Horario
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-8 ${!loading && data && step === 'plan' ? 'mt-16' : ''}`}>
        <AnimatePresence mode="wait">
          {step === 'checkin' && <motion.div key="checkin" exit={{ opacity: 0, y: -20 }} className="pt-10">{renderCheckin()}</motion.div>}
          {step === 'prompt'  && <motion.div key="prompt" exit={{ opacity: 0, y: -20 }}>{renderPrompt()}</motion.div>}
          
          {step === 'plan' && activeTab === 'focus' && <motion.div key="plan-focus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>{renderPlan()}</motion.div>}
          {step === 'plan' && activeTab === 'calendar' && <motion.div key="plan-calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><CalendarTab /></motion.div>}
          {step === 'plan' && activeTab === 'schedule' && <motion.div key="plan-schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><ScheduleTab /></motion.div>}
        </AnimatePresence>
      </main>
    </div>
  );
}
