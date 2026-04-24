import React, { useState } from 'react';
import { BookOpen, Clock, FileText, Link as LinkIcon, Plus, X, Upload } from 'lucide-react';

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

export const ScheduleTab: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([
    { id: '1', day: 'Lunes', time: '08:00 - 10:00', subject: 'Diseño 3D (ZBrush)', materials: [{ id: 'm1', type: 'link', name: 'Tutorial de Esculpido', url: 'https://youtube.com/watch?v=123' }] }
  ]);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClass, setNewClass] = useState({ day: 'Lunes', time: '', subject: '' });
  
  const [activeMaterialClass, setActiveMaterialClass] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState({ type: 'file' as 'file'|'link', name: '', url: '' });

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.time || !newClass.subject) return;
    setClasses([...classes, { id: Date.now().toString(), ...newClass, materials: [] }]);
    setIsAddingClass(false);
    setNewClass({ day: 'Lunes', time: '', subject: '' });
  };

  const handleAddMaterial = (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    if (!newMaterial.name) return;
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return { ...c, materials: [...c.materials, { id: Date.now().toString(), ...newMaterial }] };
      }
      return c;
    }));
    setActiveMaterialClass(null);
    setNewMaterial({ type: 'file', name: '', url: '' });
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-500 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Horario de Clases</h2>
            <p className="text-slate-500 text-sm font-medium">Gestión de materias y material de estudio.</p>
          </div>
        </div>
        {!isAddingClass && (
          <button onClick={() => setIsAddingClass(true)} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> Añadir Clase
          </button>
        )}
      </div>

      {isAddingClass && (
        <form onSubmit={handleAddClass} className="mb-8 p-6 bg-white rounded-3xl shadow-sm border border-slate-100/50 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Día</label>
            <select value={newClass.day} onChange={e => setNewClass({...newClass, day: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horario</label>
            <input type="text" placeholder="Ej: 08:00 - 10:00" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400" />
          </div>
          <div className="flex-[2] min-w-[250px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Materia</label>
            <input type="text" placeholder="Nombre de la materia..." value={newClass.subject} onChange={e => setNewClass({...newClass, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsAddingClass(false)} className="px-5 py-3 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
            <button type="submit" disabled={!newClass.time || !newClass.subject} className="px-5 py-3 text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50 rounded-xl font-bold text-sm transition-colors">Guardar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {DAYS.map(day => (
          <div key={day} className="flex flex-col gap-4">
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm text-center border-b-2 border-slate-100 pb-3">{day}</h3>
            
            <div className="space-y-4">
              {classes.filter(c => c.day === day).length === 0 ? (
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm font-medium">Libre</div>
              ) : (
                classes.filter(c => c.day === day).map(c => (
                  <div key={c.id} className="relative group bg-white p-5 rounded-2xl shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow">
                    <button onClick={() => deleteClass(c.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-bold text-teal-500 mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {c.time}</div>
                    <div className="font-bold text-slate-800 text-sm mb-4 leading-tight">{c.subject}</div>

                    {/* Materials section */}
                    <div className="border-t border-slate-50 pt-3 mt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        Materiales
                        <button onClick={() => setActiveMaterialClass(c.id)} className="text-teal-500 hover:text-teal-600"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="space-y-2">
                        {c.materials.map(m => (
                          <div key={m.id} className="flex items-center gap-2 text-xs bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                            {m.type === 'link' ? <LinkIcon className="w-3 h-3 text-blue-500" /> : <FileText className="w-3 h-3 text-orange-500" />}
                            <span className="truncate flex-1 font-medium text-slate-600" title={m.name}>{m.name}</span>
                          </div>
                        ))}
                      </div>

                      {activeMaterialClass === c.id && (
                        <form onSubmit={(e) => handleAddMaterial(e, c.id)} className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <div className="flex gap-2 mb-2">
                            <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                              <input type="radio" name="type" checked={newMaterial.type === 'file'} onChange={() => setNewMaterial({...newMaterial, type: 'file'})} />
                              Archivo
                            </label>
                            <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                              <input type="radio" name="type" checked={newMaterial.type === 'link'} onChange={() => setNewMaterial({...newMaterial, type: 'link'})} />
                              Enlace
                            </label>
                          </div>
                          
                          <input type="text" placeholder={newMaterial.type === 'link' ? "Ej: Video de Youtube" : "Nombre del archivo"} value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-teal-400" />
                          
                          {newMaterial.type === 'link' ? (
                            <input type="url" placeholder="URL..." value={newMaterial.url} onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-teal-400" />
                          ) : (
                            <div className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 border-dashed bg-white text-center text-slate-500 cursor-pointer hover:bg-slate-50 flex items-center justify-center gap-2">
                              <Upload className="w-3 h-3" /> Subir PDF/DOC
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button type="button" onClick={() => setActiveMaterialClass(null)} className="flex-1 py-1.5 text-[10px] uppercase font-bold text-slate-500 bg-slate-200 rounded-lg">Cerrar</button>
                            <button type="submit" disabled={!newMaterial.name} className="flex-1 py-1.5 text-[10px] uppercase font-bold text-white bg-teal-500 disabled:opacity-50 rounded-lg">Añadir</button>
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
