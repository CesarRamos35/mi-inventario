'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Error al entrar");
    } 
    else 
      {
        toast.success("¡Sesión iniciada!");
        // Esperamos un segundo para que el usuario vea el mensaje y forzamos recarga
        setTimeout(() => {
        window.location.href = "/"; 
        }, 1000);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Acceso al Panel</h2>
            <p className="text-gray-500 mt-2">Ingresa tus credenciales de administrador</p>
          </div>

          <form onSubmit={manejarLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-black bg-white"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-black bg-white"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:bg-indigo-300">
              {cargando ? 'Verificando...' : 'Entrar al Sistema'}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            ← Volver al inventario (Modo Lectura)
          </button>
        </div>
      </div>
    </div>
  )
}