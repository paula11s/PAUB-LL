import React, { useState } from 'react';
import { LogOut, Settings, User, Bell, Moon, Sun, Monitor } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const SettingsTab: React.FC<{ userProfile: any }> = ({ userProfile }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('paubell_theme') as any) || 'dark';
  });

  React.useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    localStorage.setItem('paubell_theme', theme);
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'theme-dark' : 'theme-light');
    } else {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 pt-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-slate-800 p-3 rounded-2xl">
          <Settings className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-app-text">Ajustes</h1>
          <p className="text-app-muted">Configura tu perfil y preferencias.</p>
        </div>
      </div>

      {/* Cuenta */}
      <div className="bg-app-card border border-slate-200/20 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" /> Cuenta Actual
        </h2>
        
        <div className="bg-app-bg p-5 rounded-2xl border border-slate-200/20 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-app-muted text-sm font-bold uppercase tracking-widest mb-1">Email Registrado</p>
            <p className="text-app-text font-medium text-lg">{auth.currentUser?.email || 'Sesión anónima'}</p>
            <p className="text-app-muted text-sm mt-1">Profesión: {userProfile?.career || 'No definida'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl mt-4">
          <h3 className="text-indigo-400 font-bold mb-2">Sistema Multicuenta</h3>
          <p className="text-app-muted text-sm leading-relaxed">
            Puedes cambiar de cuenta cerrando sesión y volviendo a entrar. 
            Tus datos (tareas, progreso, historial) se mantienen estrictamente separados y seguros.
          </p>
        </div>
      </div>

      {/* Preferencias */}
      <div className="bg-app-card border border-slate-200/20 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" /> Preferencias y Apariencia
        </h2>
        
        <div className="space-y-4">
          {/* Notificaciones */}
          <div className="bg-app-bg p-5 rounded-2xl border border-slate-200/20 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><Bell className="w-5 h-5"/></div>
               <div>
                 <p className="text-app-text font-bold">Notificaciones Push</p>
                 <p className="text-app-muted text-sm">Recibir alertas de tareas y Check-in, incluso minimizado.</p>
               </div>
            </div>
            <button 
              onClick={async () => {
                if (!notificationsEnabled) {
                  // Solicitar
                  const { requestNotificationPermission } = await import('../lib/firebase');
                  const token = await requestNotificationPermission();
                  if (token) {
                    setNotificationsEnabled(true);
                  } else {
                    alert("No se pudo activar las notificaciones. Verifica los permisos del navegador e intenta en una ventana nueva.");
                  }
                } else {
                  // Desactivar visualmente (En realidad requiere revocar permisos en el SO)
                  setNotificationsEnabled(false);
                }
              }}
              className={`w-12 h-6 rounded-full flex items-center transition-colors p-1 ${notificationsEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Modo de color */}
          <div className="bg-app-bg p-5 rounded-2xl border border-slate-200/20 dark:border-slate-800/50 space-y-4">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><Sun className="w-5 h-5"/></div>
               <div>
                 <p className="text-app-text font-bold">Tema Visual</p>
                 <p className="text-app-muted text-sm">Selecciona cómo deseas ver la app.</p>
               </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
               <button onClick={() => setTheme('dark')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-app-card border-slate-200 dark:border-slate-700'}`}>
                 <Moon className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-app-muted'}`} />
                 <span className={`text-xs font-bold ${theme === 'dark' ? 'text-app-text' : 'text-app-muted'}`}>Oscuro</span>
               </button>
               <button onClick={() => setTheme('light')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-app-card border-slate-200 dark:border-slate-700'}`}>
                 <Sun className={`w-5 h-5 flex-shrink-0 ${theme === 'light' ? 'text-indigo-400' : 'text-app-muted'}`} />
                 <span className={`text-xs font-bold ${theme === 'light' ? 'text-app-text' : 'text-app-muted'}`}>Claro</span>
               </button>
               <button onClick={() => setTheme('system')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'system' ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-app-card border-slate-200 dark:border-slate-700'}`}>
                 <Monitor className={`w-5 h-5 flex-shrink-0 ${theme === 'system' ? 'text-indigo-400' : 'text-app-muted'}`} />
                 <span className={`text-xs font-bold ${theme === 'system' ? 'text-app-text' : 'text-app-muted'}`}>Sistema</span>
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
