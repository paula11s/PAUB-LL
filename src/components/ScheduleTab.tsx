import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, Link as LinkIcon, Plus, X, Upload, Sparkles, Loader2 } from 'lucide-react';
import { getClasses, addClass, updateClass, deleteClass as removeClass } from '../lib/firebase';
import { getSuggestedMaterials, getPauvelTip } from '../lib/gemini';
import { PaubellGuide } from './PaubellGuide';

interface ClassItem {
  id: string;
  day: string;
  time: string;
  subject: string;
  materials: Material[];
}

interface Material {
  id: string;
  type: 'file' | 'link';
  name: string;
  url?: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const ScheduleTab: React.FC<{ userProfile?: any }> = ({ userProfile }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClass, setNewClass] = useState({ day: 'Lunes', time: '', subject: '' });
  
  const [activeMaterialClass, setActiveMaterialClass] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState({ type: 'file' as 'file'|'link', name: '', url: '' });
  const [loading, setLoading] = useState(true);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);
  const [tip, setTip] = useState<{text: string, mood: 'happy'|'calm'|'focus'} | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    
    getPauvelTip('Horario', userProfile?.career || 'Universidad').then(res => {
      if (mounted) setTip(res);
    });

    const fetchClasses = async () => {
      try {
        const data = await getClasses();
        if (mounted) setClasses(data as ClassItem[]);
      } catch (e) {
        console.error("Error loading classes", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchClasses();
    return () => { mounted = false; };
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.time || !newClass.subject) return;
    
    const classData = { ...newClass, materials: [] };
    const tempId = Date.now().toString();
    setClasses([...classes, { id: tempId, ...classData }]);
    
    setIsAddingClass(false);
    setNewClass({ day: 'Lunes', time: '', subject: '' });

    const realId = await addClass(classData);
    if (realId) {
      setClasses(prev => prev.map(c => c.id === tempId ? { ...c, id: realId } : c));
    }
  };

  const handleAddMaterial = async (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    if (!newMaterial.name) return;
    
    const theClass = classes.find(c => c.id === classId);
    if (!theClass) return;

    const updatedMaterials = [...theClass.materials, { id: Date.now().toString(), ...newMaterial }];
    
    setClasses(classes.map(c => c.id === classId ? { ...c, materials: updatedMaterials } : c));
    setActiveMaterialClass(null);
    setNewMaterial({ type: 'file', name: '', url: '' });

    await updateClass(classId, { materials: updatedMaterials });
  };

  const handleSuggestMaterial = async (classId: string, subject: string) => {
    setSuggestingFor(classId);
    const suggestions = await getSuggestedMaterials(subject, userProfile?.career || 'General');
    
    if (suggestions && suggestions.length > 0) {
      const theClass = classes.find(c => c.id === classId);
      if (theClass) {
        const newMats = suggestions.map((s, idx) => ({
          id: `suggest_${Date.now()}_${idx}`,
          type: s.type || 'link',
          name: s.name,
          url: s.url
        }));
        
        const updatedMaterials = [...theClass.materials, ...newMats];
        setClasses(classes.map(c => c.id === classId ? { ...c, materials: updatedMaterials } : c));
        await updateClass(classId, { materials: updatedMaterials });
      }
    }
    setSuggestingFor(null);
  }

  const deleteClass = async (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    await removeClass(id);
  };

  if (loading) return <div className="text-center text-slate-400 py-10">Cargando horario...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-app-text">Horario de Clases</h2>
            <p className="text-app-muted text-sm font-medium">Gestión de materias y material de estudio.</p>
          </div>
        </div>
        {!isAddingClass && (
          <button onClick={() => setIsAddingClass(true)} className="px-5 py-2.5 bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-400 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> Añadir Clase
          </button>
        )}
      </div>

      {tip && (
        <div className="bg-app-card border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
          <PaubellGuide className="w-14 h-14 flex-shrink-0" mood={tip.mood} outfit={userProfile?.outfit || 'default'} />
          <p className="text-indigo-600 dark:text-indigo-200 text-sm font-medium leading-relaxed italic pr-4">"{tip.text}"</p>
        </div>
      )}

      {isAddingClass && (
        <form onSubmit={handleAddClass} className="mb-8 p-6 bg-app-card rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 px-1">Día</label>
            <select value={newClass.day} onChange={e => setNewClass({...newClass, day: e.target.value})} className="w-full bg-app-bg border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-app-text transition-colors">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 px-1">Horario</label>
            <input type="text" placeholder="Ej: 08:00 - 10:00" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} className="w-full bg-app-bg border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-app-text placeholder-app-muted/50 transition-colors" />
          </div>
          <div className="flex-[2] min-w-[250px]">
            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 px-1">Materia</label>
            <input type="text" placeholder="Nombre de la materia..." value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})} className="w-full bg-app-bg border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-app-text placeholder-app-muted/50 transition-colors" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsAddingClass(false)} className="px-5 py-3 text-app-muted bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
            <button type="submit" disabled={!newClass.time || !newClass.subject} className="px-5 py-3 text-white bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-400 disabled:opacity-50 rounded-xl font-bold text-sm transition-colors">Guardar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {DAYS.map(day => (
          <div key={day} className="flex flex-col gap-4">
            <h3 className="font-bold text-app-muted uppercase tracking-widest text-xs text-center border-b-2 border-slate-200 dark:border-slate-800 pb-3">{day}</h3>
            
            <div className="space-y-4">
              {classes.filter(c => c.day === day).length === 0 ? (
                <div className="p-4 bg-app-card/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-app-muted text-xs font-medium italic">Libre</div>
              ) : (
                classes.filter(c => c.day === day).map(c => (
                  <div key={c.id} className="relative group bg-app-card p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800 hover:border-indigo-400/50 transition-all">
                    <button onClick={() => deleteClass(c.id)} className="absolute top-3 right-3 text-app-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {c.time}</div>
                    <div className="font-bold text-app-text text-sm mb-4 leading-tight">{c.subject}</div>

                    {/* Materials section */}
                    <div className="border-t border-slate-200/50 dark:border-slate-800 pt-3 mt-3">
                      <div className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center justify-between">
                        Materiales
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSuggestMaterial(c.id, c.subject)} 
                            disabled={suggestingFor === c.id}
                            title="Sugerir material"
                            className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                          >
                            {suggestingFor === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setActiveMaterialClass(c.id)} className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-400 dark:hover:text-indigo-300"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {c.materials.length === 0 && <span className="text-[11px] text-app-muted opacity-60 block text-center italic">Sin material</span>}
                        {c.materials.map(m => (
                          <div key={m.id} className="flex items-center gap-2 text-xs bg-app-bg px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-[1.02]">
                            {m.type === 'link' ? <LinkIcon className="w-3 h-3 text-blue-500 dark:text-blue-400" /> : <FileText className="w-3 h-3 text-orange-500 dark:text-orange-400" />}
                            {m.url ? (
                              <a href={m.url} target="_blank" rel="noreferrer" className="truncate flex-1 font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 hover:underline" title={m.name}>{m.name}</a>
                            ) : (
                              <span className="truncate flex-1 font-medium text-app-text" title={m.name}>{m.name}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {activeMaterialClass === c.id && (
                        <form onSubmit={(e) => handleAddMaterial(e, c.id)} className="mt-3 p-3 bg-app-bg rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-inner">
                          <div className="flex gap-4 mb-2 px-1">
                            <label className="flex items-center gap-1.5 text-xs text-app-muted cursor-pointer font-bold uppercase tracking-widest">
                              <input type="radio" name="type" checked={newMaterial.type === 'file'} onChange={() => setNewMaterial({...newMaterial, type: 'file'})} className="accent-indigo-500" />
                              Archivo
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-app-muted cursor-pointer font-bold uppercase tracking-widest">
                              <input type="radio" name="type" checked={newMaterial.type === 'link'} onChange={() => setNewMaterial({...newMaterial, type: 'link'})} className="accent-indigo-500" />
                              Enlace
                            </label>
                          </div>
                          
                          <input type="text" placeholder={newMaterial.type === 'link' ? "Ej: Video de Youtube" : "Nombre del archivo"} value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 bg-app-card text-app-text placeholder-app-muted/50" />
                          
                          {newMaterial.type === 'link' ? (
                            <input type="url" placeholder="URL..." value={newMaterial.url} onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 bg-app-card text-app-text placeholder-app-muted/50" />
                          ) : (
                            <>
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setNewMaterial({ ...newMaterial, name: file.name });
                                  }
                                }}
                              />
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full text-xs px-3 py-4 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed bg-app-card text-center text-app-muted cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                              >
                                {newMaterial.name && newMaterial.type === 'file' ? (
                                  <span className="text-indigo-500 font-bold flex items-center gap-2 truncate px-2">
                                    <FileText className="w-3.5 h-3.5" /> {newMaterial.name}
                                  </span>
                                ) : (
                                  <><Upload className="w-3.5 h-3.5" /> Subir PDF/DOC</>
                                )}
                              </div>
                            </>
                          )}

                          <div className="flex gap-2">
                            <button type="button" onClick={() => setActiveMaterialClass(null)} className="flex-1 py-2 text-[10px] uppercase font-black text-app-muted bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cerrar</button>
                            <button type="submit" disabled={!newMaterial.name} className="flex-1 py-2 text-[10px] uppercase font-black text-white bg-indigo-500 dark:bg-indigo-600 disabled:opacity-50 rounded-lg shadow-lg shadow-indigo-500/10 transition-transform active:scale-95">Añadir</button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
