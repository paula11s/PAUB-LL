import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, BookOpen, AlertCircle, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle, updateUserProfile, logOut, registerWithEmail, loginWithEmail, resendVerification, auth } from '../lib/firebase';
import { PaubellGuide } from './PaubellGuide';

interface LoginProps {
  onComplete: (career: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onComplete }) => {
  const [career, setCareer] = useState('');
  const [step, setStep] = useState<'login' | 'register' | 'setup' | 'verify'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Logout on mount to ensure fresh state if they got stuck
  useEffect(() => {
    if (step === 'login' || step === 'register') {
      logOut().catch(console.error);
    }
  }, [step]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle() as any;
      if (result) {
        if (result.profile && result.profile.career) {
          onComplete(result.profile.career);
        } else {
          setUid(result.user.uid);
          setStep('setup');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar sesión. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      if (step === 'register') {
        await registerWithEmail(email, password);
        setStep('verify');
      } else {
        const result = await loginWithEmail(email, password) as any;
        if (result.profile && result.profile.career) {
          onComplete(result.profile.career);
        } else {
          setUid(result.user.uid);
          setStep('setup');
        }
      }
    } catch (err: any) {
      if (err.message === 'NOT_VERIFIED') {
        setStep('verify');
      } else {
        setError(err.message || 'Ocurrió un error.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification();
      setError(null);
      alert('Correo reenviado. Revisa tu bandeja de entrada o spam.');
    } catch (e) {
      setError('Error al reenviar. Intenta de nuevo más tarde.');
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!career.trim() || !uid) return;
    setLoading(true);
    setError(null);
    try {
      await updateUserProfile(uid, { career: career.trim() });
      onComplete(career.trim());
    } catch (err) {
      setError('Error guardando el perfil. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0C10] text-slate-200 p-6 sm:p-12">
      {/* Soft dark-pastel gradient background orbs for Tecnología Calma */}
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[20%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] left-[10%] w-[80vw] h-[80vw] rounded-full bg-orange-200/10 blur-[140px] pointer-events-none mix-blend-screen" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10">
          <PaubellGuide className="w-36 h-36 mx-auto mb-6 drop-shadow-2xl" mood="happy" outfit="default" />
          <h1 className="text-5xl font-bold text-slate-50 mb-4 tracking-tight drop-shadow-md">Paubéll</h1>
          <p className="text-slate-300 font-medium text-base">Tu asistente personal y guía de bienestar</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-black/50">

          {error && (
            <div className="mb-6 p-4 bg-rose-900/20 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'verify' ? (
             <div className="space-y-6 text-center">
               <div className="w-16 h-16 mx-auto bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                 <Mail className="w-8 h-8" />
               </div>
               <h2 className="text-xl font-bold text-white">Verifica tu correo</h2>
               <p className="text-sm text-slate-400">Hemos enviado un enlace de confirmación a <strong>{email}</strong>. Por favor, haz clic en el enlace para activar tu cuenta.</p>
               
               <div className="flex flex-col gap-3 pt-4">
                 <button onClick={() => setStep('login')} className="w-full py-4 px-6 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-2xl font-bold text-white shadow-lg">
                   Ya verifiqué, Iniciar sesión
                 </button>
                 <button onClick={handleResend} className="text-slate-400 text-sm font-semibold hover:text-white">
                   Reenviar correo
                 </button>
               </div>
             </div>
          ) : step === 'login' || step === 'register' ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-3">{step === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
                <p className="text-sm text-slate-300">Conéctate para empezar a organizar tu vida académica y profesional.</p>
              </div>
              
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Tu usuario o correo"
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-400 transition-all text-slate-100 placeholder-slate-400 backdrop-blur-md focus:bg-black/40 shadow-inner"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password" required minLength={6}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-400 transition-all text-slate-100 placeholder-slate-400 backdrop-blur-md focus:bg-black/40 shadow-inner"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-2xl font-bold text-white shadow-lg shadow-indigo-900/20 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Cargando...' : step === 'login' ? 'Ingresar' : 'Registrarse'}
                </button>
              </form>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700/50"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold tracking-wider uppercase">O ingresa con</span>
                <div className="flex-grow border-t border-slate-700/50"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 border border-white/10 text-slate-200 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Google
              </button>

              <div className="text-center mt-4">
                <button 
                  onClick={() => { setStep(step === 'login' ? 'register' : 'login'); setError(null); }} 
                  className="text-slate-400 hover:text-white text-sm font-semibold"
                >
                  {step === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
               <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Cuéntame de ti</h2>
                <p className="text-sm text-slate-400">¿Qué carrera o profesión estás estudiando/ejerciendo? Esto me ayudará a sugerirte mejores métodos de estudio.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Carrera o Profesión</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={career}
                    onChange={e => setCareer(e.target.value)}
                    placeholder="Ej: Diseño Gráfico, Ingeniería..."
                    className="w-full bg-[#0F1218] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 transition-colors text-slate-200 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || !career.trim()}
                  className="w-full py-4 px-6 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-white shadow-lg shadow-indigo-900/20"
                >
                  {loading ? 'Guardando...' : 'Comenzar'} <ArrowRight className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => { logOut(); setStep('login'); }} className="text-slate-500 text-sm font-semibold hover:text-slate-400 p-2">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
