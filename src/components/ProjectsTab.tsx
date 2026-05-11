import React, { useState, useEffect } from 'react';
import { GraduationCap, Play, Target, X } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, updateUserProfile } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface FinalProject {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  status: 'pendiente' | 'en proceso' | 'completado';
}

export const ProjectsTab: React.FC<{ onClickShop: () => void; userProfile?: any }> = ({ onClickShop, userProfile }) => {
  const [finals, setFinals] = useState<FinalProject[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const outfits = [
    { id: 'default', name: 'Original', color: 'bg-slate-700' },
    { id: 'casual', name: 'Estilo Casual', color: 'bg-indigo-400' },
    { id: 'tech', name: 'Modo Tech', color: 'bg-teal-400' },
    { id: 'royal', name: 'Corona Real', color: 'bg-orange-300' }
  ];
  
  const unlockedOutfits = userProfile?.unlockedOutfits || ['default'];

  useEffect(() => {
    fetchFinals();
  }, []);

  const fetchFinals = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'users', auth.currentUser.uid, 'finals'), orderBy('dueDate', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinalProject));
      setFinals(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !auth.currentUser) return;
    
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'finals'), {
        userId: auth.currentUser.uid,
        title: newTitle,
        dueDate: newDate,
        progress: 0,
        status: 'pendiente',
        createdAt: serverTimestamp(),
      });
      setNewTitle('');
      setNewDate('');
      setShowNewForm(false);
      fetchFinals();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/finals`);
    }
  };

  const updateProgress = async (id: string, newProgress: number) => {
    if (!auth.currentUser) return;
    const isCompleted = newProgress === 100;
    const status = isCompleted ? 'completado' : (newProgress === 0 ? 'pendiente' : 'en proceso');
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'finals', id), {
        progress: newProgress,
        status
      });
      
      if (isCompleted) {
        const lockedList = outfits.map(o => o.id).filter(o => !unlockedOutfits.includes(o));
        if (lockedList.length > 0) {
          const toUnlock = lockedList[0];
          const newUnlocked = [...unlockedOutfits, toUnlock];
          await updateUserProfile(auth.currentUser.uid, { unlockedOutfits: newUnlocked });
          alert(`¡Felicidades! Al completar tu trabajo final has desbloqueado un nuevo accesorio: ${outfits.find(o => o.id === toUnlock)?.name}`);
        }
      }
      fetchFinals();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/finals/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'finals', id));
      fetchFinals();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8">
      <div className="bg-indigo-500/10 dark:bg-indigo-900/30 border border-indigo-500/30 px-6 py-4 rounded-2xl shadow-sm backdrop-blur-sm">
        <p className="text-indigo-600 dark:text-indigo-200 text-sm font-medium leading-relaxed flex items-center justify-between">
          <span className="font-medium">"Cada vez que completas un Trabajo Final, mi energía crece y podrás desbloquear nuevas prendas." - <span className="font-black text-indigo-500">PAUBELL</span></span>
          <button onClick={onClickShop} className="text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider hover:text-indigo-400 dark:hover:text-indigo-300 text-xs flex items-center gap-1">Ver Accesorios <Target className="w-3 h-3"/></button>
        </p>
      </div>

      <div className="bg-app-card border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-text">Trabajos Finales</h2>
              <p className="text-sm text-app-muted">Registra tus proyectos importantes.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            {showNewForm ? 'Cancelar' : '+ Nuevo Trabajo'}
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleAddFinal} className="mb-8 bg-app-bg border border-slate-200/50 dark:border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-app-muted uppercase tracking-widest mb-2 px-1">Título del Proyecto</label>
              <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ej: Tesis, Entrega Mates..." className="w-full bg-app-card border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-app-text outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-app-muted uppercase tracking-widest mb-2 px-1">Fecha de Entrega</label>
              <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-app-card border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-app-text outline-none focus:border-indigo-500 transition-colors dark:[color-scheme:dark]" />
            </div>
            <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl h-[50px] shadow-lg shadow-teal-500/10">
              Guardar
            </button>
          </form>
        )}

        <div className="space-y-4">
          {finals.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-app-muted font-medium italic">No tienes trabajos finales pendientes.</p>
              <p className="text-xs text-app-muted opacity-60 mt-1 uppercase tracking-widest">¡Añade uno para empezar!</p>
            </div>
          ) : (
            finals.map(f => (
              <div key={f.id} className="bg-app-bg border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-app-text">{f.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${f.status === 'completado' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : f.status === 'en proceso' ? 'bg-orange-400/10 text-orange-600 dark:text-orange-300' : 'bg-slate-200 dark:bg-slate-800 text-app-muted'}`}>
                      {f.status}
                    </span>
                  </div>
                  <p className="text-sm text-app-muted font-medium italic opacity-80">📆 Entrega: <span className="text-indigo-600 dark:text-indigo-300 font-bold">{new Date(f.dueDate).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
                </div>

                <div className="flex-1 shrink-0">
                  <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-widest px-1">
                    <span className="text-app-muted">Progreso</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{f.progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex items-center shadow-inner">
                    <div className="h-full bg-indigo-500 transition-all duration-500 ease-out shadow-lg shadow-indigo-500/20" style={{ width: `${f.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => updateProgress(f.id, Math.min(f.progress + 25, 100))} disabled={f.progress === 100} className="w-10 h-10 bg-app-card hover:bg-app-card/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-app-muted hover:text-indigo-500 transition-all disabled:opacity-50" title="Avanzar 25%">
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="w-10 h-10 bg-app-card hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-app-muted hover:text-rose-500 transition-all" title="Eliminar">
                    <X className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

