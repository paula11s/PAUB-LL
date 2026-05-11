import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Check, Trash2 } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCalendarTasks, addCalendarTask, updateCalendarTask, deleteCalendarTask as removeCalendarTask } from '../lib/firebase';
import { getPauvelTip } from '../lib/gemini';
import { PaubellGuide } from './PaubellGuide';

interface PendingTask {
  id: string;
  date: Date;
  title: string;
  completed: boolean;
}

export const CalendarTab: React.FC<{ userProfile?: any }> = ({ userProfile }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState<{text: string, mood: 'happy'|'calm'|'focus'} | null>(null);

  useEffect(() => {
    let mounted = true;
    getPauvelTip('Calendario', userProfile?.career || 'Universidad').then(res => {
      if (mounted) setTip(res);
    });
    
    const fetchTasks = async () => {
      try {
        const data = await getCalendarTasks();
        if (mounted) setTasks(data as PendingTask[]);
      } catch (e) {
        console.error("Error loading calendar tasks", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTasks();
    return () => { mounted = false; };
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const selectedDateTasks = tasks.filter(t => isSameDay(t.date, selectedDate));

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const taskData = {
      date: selectedDate,
      title: newTaskTitle.trim(),
      completed: false
    };
    const tempId = Date.now().toString();
    setTasks([...tasks, { id: tempId, ...taskData }]);
    setNewTaskTitle('');

    const realId = await addCalendarTask(taskData);
    if (realId) {
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: realId } : t));
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    await updateCalendarTask(id, { completed: newCompleted });
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await removeCalendarTask(id);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 relative">
      {/* Soft organic background blobs */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-40 -right-20 w-96 h-96 bg-teal-500/5 blur-[140px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-10 relative z-10"
      >
        <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/5">
          <CalendarIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-50 tracking-tight">Calendario</h2>
          <p className="text-slate-400 font-medium text-sm">Visualiza y organiza tus metas futuras con claridad.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Main Calendar Card */}
        <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden relative">
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="bg-indigo-500/10 dark:bg-indigo-500/20 px-6 py-2.5 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-inner">
              <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-300 capitalize tracking-tight">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h3>
            </div>
            <div className="flex gap-3">
              <button onClick={prevMonth} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 active:scale-95">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 active:scale-95">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-6 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest relative z-10">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-3 sm:gap-4 relative z-10">
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {days.map((day, i) => {
              const isSel = isSameDay(selectedDate, day);
              const isTod = isToday(day);
              const dayTasks = tasks.filter(t => isSameDay(t.date, day) && !t.completed);
              const hasTasks = dayTasks.length > 0;

              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: isSel ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border
                    ${isSel 
                      ? 'bg-gradient-to-br from-indigo-500/90 to-violet-500/90 text-white font-bold shadow-2xl shadow-indigo-500/30 border-white/20 scale-110 z-20' 
                      : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-100 hover:border-white/10 font-medium'
                    }
                    ${isTod && !isSel ? 'border-indigo-500/40 text-indigo-400' : ''}
                  `}
                >
                  <span className="text-lg">{format(day, 'd')}</span>
                  {hasTasks && !isSel && (
                    <motion.div 
                      layoutId={`task-dot-${format(day, 'yyyy-MM-dd')}`}
                      className="absolute bottom-2.5 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-glow" 
                    />
                  )}
                  {isTod && (
                    <div className={`absolute top-2 right-2 w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-indigo-500 animate-pulse'}`} />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Info & Tasks Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          {tip && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex items-center gap-5 shadow-xl">
              <PaubellGuide className="w-16 h-16 flex-shrink-0 drop-shadow-xl" mood={tip.mood} outfit={userProfile?.outfit || 'default'} />
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-500">CONSEJO DE PAUBELL</p>
                <p className="text-slate-300 text-sm leading-relaxed italic pr-2">"{tip.text}"</p>
              </div>
            </div>
          )}

          <div className="bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col h-full flex-grow relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="capitalize">{format(selectedDate, "d 'de' MMMM", { locale: es })}</span>
              </h3>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-8 custom-scrollbar min-h-[300px]">
              {selectedDateTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                    <Check className="w-10 h-10 text-slate-700" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed">No tienes tareas para este día.<br/>¡Disfruta tu tiempo libre!</p>
                </div>
              ) : (
                selectedDateTasks.map(task => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={task.id} 
                    className="group flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/20 transition-all relative overflow-hidden"
                  >
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-600 text-transparent hover:border-indigo-400'}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-sm font-medium leading-relaxed flex-1 ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                      {task.title}
                    </span>
                    <button
                       onClick={() => deleteTask(task.id)}
                       className="p-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <form onSubmit={addTask} className="mt-auto relative group">
              <input
                type="text"
                placeholder="Añadir una responsabilidad..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4.5 text-sm font-medium outline-none focus:border-indigo-500 focus:bg-black/30 text-slate-100 placeholder-slate-600 transition-all pr-16 shadow-inner"
              />
              <button 
                type="submit" 
                disabled={!newTaskTitle.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:grayscale text-white rounded-xl transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
