import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, Clock, Navigation } from 'lucide-react';
import { getAlarms, addAlarm, updateAlarm, deleteAlarm as removeAlarm, requestNotificationPermission } from '../lib/firebase';

interface AlarmItem {
  id: string;
  time: string;
  title: string;
  enabled: boolean;
  type: string;
}

export const AlarmsTab: React.FC = () => {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState('12:00');
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchAlarms = async () => {
      try {
        const data = await getAlarms();
        if (mounted) setAlarms(data as AlarmItem[]);
      } catch (e) {
        console.error("Error loading alarms", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAlarms();
    
    if ('Notification' in window && mounted) {
      setNotificationStatus(Notification.permission);
    }
    
    return () => { mounted = false; };
  }, []);

  const handleRequestNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setNotificationStatus('granted');
      alert('¡Notificaciones activadas con éxito! 🎉');
    } else {
      setNotificationStatus('denied');
      alert('No se pudo activar las notificaciones. Verifica los permisos del navegador o abre la app en una pestaña nueva si estás en la vista previa.');
    }
  };


  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    
    const alarmData = { time: newTime, title: newLabel, enabled: true, type: 'diario' };
    const tempId = Date.now().toString();
    setAlarms([{ id: tempId, ...alarmData }, ...alarms]);
    
    setIsAdding(false);
    setNewTime('12:00');
    setNewLabel('');

    const realId = await addAlarm(alarmData);
    if (realId) {
      setAlarms(prev => prev.map(a => a.id === tempId ? { ...a, id: realId } : a));
    }
  };

  const toggleAlarm = async (id: string) => {
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;
    
    const newEnabled = !alarm.enabled;
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: newEnabled } : a));
    await updateAlarm(id, { enabled: newEnabled });
  };

  const deleteAlarm = async (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
    await removeAlarm(id);
  };

  if (loading) return <div className="text-center text-app-muted py-10">Cargando alarmas...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-400/10 flex items-center justify-center text-orange-600 dark:text-orange-300">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-app-text">Recordatorios y Alarmas</h2>
            <p className="text-app-muted text-sm">Configura alertas para tus pendientes y pausas activas.</p>
          </div>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-400 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
            <Plus className="w-5 h-5" /> Nueva Alarma
          </button>
        )}
      </div>

      {notificationStatus !== 'granted' && (
        <div className="bg-indigo-500/5 dark:bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="flex items-start gap-4">
            <Navigation className="w-6 h-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-indigo-600 dark:text-indigo-300 font-bold mb-1">Activa las Notificaciones Push</h4>
              <p className="text-app-muted text-sm leading-relaxed max-w-lg">
                Para avisarte de tus alarmas y pausas incluso si minimizas la aplicación, recíbelas directamente en tu dispositivo. ¡Ideal para tu bienestar!
              </p>
            </div>
          </div>
          <button onClick={handleRequestNotifications} className="whitespace-nowrap px-6 py-2.5 bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-400 text-white rounded-xl font-bold text-sm transition-all shadow-md">
            Permitir Alertas
          </button>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="p-6 bg-app-card border border-slate-200/50 dark:border-slate-800 rounded-3xl flex flex-wrap gap-4 items-end shadow-xl animate-in zoom-in-95 duration-300">
          <div>
            <label className="block text-xs font-bold text-app-muted uppercase tracking-widest mb-2 px-1">Hora</label>
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-app-bg border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-app-text outline-none focus:border-indigo-500 transition-colors dark:[color-scheme:dark]" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-app-muted uppercase tracking-widest mb-2 px-1">Etiqueta</label>
            <input type="text" placeholder="Ej: Revisar correos..." value={newLabel} onChange={e => setNewLabel(e.target.value)} className="w-full bg-app-bg border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-app-text outline-none focus:border-indigo-500 transition-colors placeholder-app-muted/50" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-app-muted hover:text-indigo-500 font-bold transition-colors">Cancelar</button>
            <button type="submit" disabled={!newLabel} className="px-6 py-3 bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-400 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20">Guardar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alarms.length === 0 && <p className="text-app-muted text-center py-10 font-medium italic">No hay alarmas configuradas.</p>}
        {alarms.map(alarm => (
          <div key={alarm.id} className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${alarm.enabled ? 'bg-app-card border-indigo-500/30 shadow-md' : 'bg-app-bg border-slate-200 dark:border-slate-800 opacity-60 grayscale-[0.3]'}`}>
            <div className="flex items-center gap-5">
              <div className={`text-4xl font-black font-mono tracking-tight ${alarm.enabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-app-muted'}`}>{alarm.time}</div>
              <div>
                <div className="font-bold text-app-text text-lg">{alarm.title}</div>
                <div className="text-xs font-bold text-app-muted uppercase tracking-widest mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {alarm.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleAlarm(alarm.id)} 
                className={`w-14 h-8 rounded-full p-1 transition-colors ${alarm.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${alarm.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <button onClick={() => deleteAlarm(alarm.id)} className="w-10 h-10 rounded-full hover:bg-rose-500/10 text-app-muted hover:text-rose-500 flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
