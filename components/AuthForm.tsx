"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos");
      setCargando(false);
    } else {
      // El onAuthStateChange en app/page.tsx detectará el login automáticamente
      window.location.reload(); 
    }
  };

  return (
    <form onSubmit={manejarLogin} className="space-y-4">
      <div>
        <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1">
          Correo Electrónico
        </label>
        <input
          type="email"
          required
          placeholder="admin@crb.com"
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1">
          Contraseña
        </label>
        <input
          type="password"
          required
          placeholder="••••••••"
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100 animate-pulse">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
      >
        {cargando ? "VERIFICANDO..." : "ENTRAR AL SISTEMA"}
      </button>
    </form>
  );
}