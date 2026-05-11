import React, { useState, useEffect } from 'react';
import { Palette, Shirt, Check, GraduationCap, ChevronRight, Play, RotateCw, Sparkles, Info, X } from 'lucide-react';
import { PaubellGuide } from './PaubellGuide';
import { updateUserProfile, auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface FinalProject {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  status: 'pendiente' | 'en proceso' | 'completado';
}

export const AssistantTab: React.FC<{ userProfile: any, setUserProfile: any }> = ({ userProfile, setUserProfile }) => {
  const currentOutfit = userProfile?.outfit || 'default';
  const unlockedOutfits = userProfile?.unlockedOutfits || ['default'];
  
  const [finals, setFinals] = useState<FinalProject[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const outfits = [
    { id: 'default', name: 'Original', color: 'bg-slate-700' },
    { id: 'casual', name: 'Estilo Casual', color: 'bg-indigo-400' },
    { id: 'tech', name: 'Modo Tech', color: 'bg-teal-400' },
    { id: 'royal', name: 'Corona Real', color: 'bg-orange-300' }
  ];

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

  const [flashMsg, setFlashMsg] = useState('');

  const displayFlash = (msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(''), 4000);
  };

  const handleSelectOutfit = async (id: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      displayFlash("¡Mmm! Parece que este accesorio está bloqueado. Completa un Trabajo Final para desbloquear esta recompensa.");
      return;
    }
    setUserProfile({ ...userProfile, outfit: id });
    if (auth.currentUser) {
      await updateUserProfile(auth.currentUser.uid, { outfit: id });
    }
    triggerRotation();
  };

  const triggerRotation = () => {
    if (isRotating) return;
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 800); // match css duration
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
      
      // If completed, unlock a random outfit
      if (isCompleted) {
        const lockedList = outfits.map(o => o.id).filter(o => !unlockedOutfits.includes(o));
        if (lockedList.length > 0) {
          const toUnlock = lockedList[0];
          const newUnlocked = [...unlockedOutfits, toUnlock];
          setUserProfile({ ...userProfile, unlockedOutfits: newUnlocked });
          await updateUserProfile(auth.currentUser.uid, { unlockedOutfits: newUnlocked });
          displayFlash(`¡Felicidades! Al completar tu trabajo final has desbloqueado un nuevo accesorio: ${outfits.find(o => o.id === toUnlock)?.name}`);
          triggerRotation();
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
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      
      {/* 1. SECCIÓN PRINCIPAL: AVATAR Y MENSAJE */}
      <div className="flex flex-col items-center pt-8">
        <style>{`
          @keyframes spin-360 {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
          }
          .animate-spin-360 {
            animation: spin-360 0.8s ease-in-out;
          }
        `}</style>
        
        <div className="relative mb-6 cursor-pointer group" onClick={triggerRotation}>
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 opacity-40 transition-opacity group-hover:opacity-70"></div>
          <div className="w-56 h-56 bg-app-card border border-slate-200/20 dark:border-slate-700/50 rounded-full flex items-center justify-center relative shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className={`transition-transform duration-300 transform scale-110 ${isRotating ? 'animate-spin-360' : 'group-hover:scale-125'}`}>
              <PaubellGuide className="w-40 h-40" mood="happy" outfit={currentOutfit} />
            </div>
            {!isRotating && (
              <div className="absolute bottom-4 right-4 bg-app-card/80 p-2 rounded-full border border-slate-200/20 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <RotateCw className="w-4 h-4 text-indigo-400" />
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-indigo-500/10 dark:bg-indigo-900/30 border border-indigo-500/30 px-6 py-4 rounded-2xl max-w-lg text-center backdrop-blur-md shadow-sm">
          <p className="text-indigo-600 dark:text-indigo-200 font-medium leading-relaxed italic">
            "¡Hola! Cada vez que completas tareas y proyectos, subes de nivel y desbloqueas nuevos accesorios para mí. ¡Tu progreso es mi motivación!"
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/10">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Sube de nivel para ropa</span>
          </div>
          <div className="flex items-center gap-2 bg-teal-500/5 px-3 py-1.5 rounded-full border border-teal-500/10">
            <Info className="w-4 h-4 text-teal-500" />
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Tarea Alta: +50 XP | Media: +25 XP | Baja: +10 XP</span>
          </div>
        </div>
        {flashMsg && (
          <div className="mt-4 px-6 py-3 bg-orange-400/20 text-orange-200 border border-orange-500/30 rounded-xl text-center text-sm font-bold uppercase tracking-wider animate-pulse max-w-lg">
            {flashMsg}
          </div>
        )}
      </div>

      {/* 2. SISTEMA DE PERSONALIZACIÓN */}
      <div className="bg-app-card border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="mb-8 pb-4 border-b border-slate-200/50 dark:border-slate-800">
          <h2 className="text-xl font-bold text-app-text flex items-center gap-2"><Palette className="w-5 h-5 text-indigo-400" /> Personalizar Asistente</h2>
          <p className="text-sm text-app-muted mt-1">Usa los accesorios que has desbloqueado.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {outfits.map(outfit => {
            const isUnlocked = unlockedOutfits.includes(outfit.id);
            return (
              <button 
                key={outfit.id} 
                onClick={() => handleSelectOutfit(outfit.id, isUnlocked)}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 relative overflow-hidden ${currentOutfit === outfit.id ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-900/20' : 'border-slate-200 dark:border-slate-800 bg-app-bg hover:border-indigo-400/50'} ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
              >
                {!isUnlocked && <div className="absolute inset-0 bg-app-bg/60 backdrop-blur-[1px] flex items-center justify-center z-10"><span className="text-[10px] font-bold uppercase tracking-wider text-app-muted bg-app-card px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700">Bloqueado</span></div>}
                
                <div className={`w-16 h-16 rounded-full ${outfit.color} flex items-center justify-center opacity-90 relative shadow-inner`}>
                   {currentOutfit === outfit.id && <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white border-2 border-app-card"><Check className="w-3 h-3" /></div>}
                   <Shirt className="w-8 h-8 text-white opacity-60" />
                </div>
                <span className="font-bold text-app-text text-sm whitespace-nowrap text-center">{outfit.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
