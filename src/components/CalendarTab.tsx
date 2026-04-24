import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Check } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface PendingTask {
  id: string;
  date: Date;
  title: string;
  completed: boolean;
}

export const CalendarTab: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const selectedDateTasks = tasks.filter(t => isSameDay(t.date, selectedDate));

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now().toString(), date: selectedDate, title: newTaskTitle.trim(), completed: false }
    ]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendario</h2>
          <p className="text-slate-500 text-sm font-medium">Organiza tus pendientes a futuro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Fill empty days */}
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-2xl"></div>
            ))}
            {days.map((day, i) => {
              const hasTasks = tasks.some(t => isSameDay(t.date, day) && !t.completed);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200
                    ${isSameDay(selectedDate, day) ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-200 cursor-default scale-105' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 font-medium'}
                    ${isToday(day) && !isSameDay(selectedDate, day) ? 'ring-2 ring-indigo-200 ring-offset-2' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {hasTasks && (
                    <div className={`w-1.5 h-1.5 rounded-full absolute bottom-2 ${isSameDay(selectedDate, day) ? 'bg-white' : 'bg-indigo-400'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[400px]">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100/50 flex flex-col h-full flex-grow">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              Pendientes para <span className="text-indigo-500 capitalize">{format(selectedDate, 'dd MMM', { locale: es })}</span>
            </h3>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-6">
              {selectedDateTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-slate-300" />
                  </div>
                  <p>No tienes tareas pendientes para este día. ¡Todo libre!</p>
                </div>
              ) : (
                selectedDateTasks.map(task => (
                  <div key={task.id} className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 text-transparent hover:border-indigo-400'}`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.title}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addTask} className="mt-auto pt-4 relative">
              <input
                type="text"
                placeholder="Añadir tarea..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all pr-14"
              />
              <button 
                type="submit" 
                disabled={!newTaskTitle.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:bg-indigo-400 text-white rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
