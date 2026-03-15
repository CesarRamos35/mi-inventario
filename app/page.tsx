"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import Image from 'next/image'; // Importamos el componente para imágenes

export default function Home() {
  const [sesion, setSesion] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setCargando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (cargando) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 italic">Cargando CRB...</div>;

  // PANTALLA DE LOGIN
  if (!sesion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-white">
          <div className="text-center mb-8">
            {/* REEMPLAZO DEL EMOJI POR TU LOGO */}
            <div className="flex justify-center mb-4">
              <Image 
                src="/logo-crb.png" 
                alt="CRB Soluciones Informáticas" 
                width={180} 
                height={120}
                priority 
                className="drop-shadow-sm"
              />
            </div>
            <h2 className="text-4xl font-black text-gray-800 tracking-tighter">SISTEMA DE <span className="text-indigo-600">VENTAS</span></h2>
          </div>
          <AuthForm />
        </div>
      </main>
    );
  }

  // PANEL PRINCIPAL
  return (
    <main className="p-10 max-w-6xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          {/* LOGO PEQUEÑO EN EL PANEL PRINCIPAL */}
          <Image 
            src="/logo-crb.png" 
            alt="Logo" 
            width={50} 
            height={40} 
            className="opacity-80"
          />
          <div>
            <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Administración General</p>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Panel de Control</h1>
          </div>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
        >
          CERRAR SESIÓN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Aquí siguen tus tarjetas de Ventas, Inventario, etc. */}
        {/* ... el resto del código se mantiene igual ... */}
        
        {/* TARJETA DE VENTAS */}
        <Link href="/ventas" className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-green-600">
          <div className="flex justify-between items-start">
            <span className="text-3xl">💰</span>
            <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Salidas</span>
          </div>
          <h2 className="text-2xl font-black mt-4 group-hover:text-green-600 transition-colors">Registrar Venta</h2>
          <p className="text-gray-500 mt-2 text-sm leading-tight">Descuenta stock y registra ingresos automáticamente.</p>
          <p className="text-green-600 text-[10px] font-bold mt-4 tracking-widest uppercase">Nueva Venta →</p>
        </Link>

        {/* INVENTARIO */}
        <Link href="/inventario" className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <span className="text-3xl">📦</span>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Stock</span>
          </div>
          <h2 className="text-2xl font-black mt-4 group-hover:text-indigo-600 transition-colors">Inventario</h2>
          <p className="text-gray-500 mt-2 text-sm leading-tight">Gestiona productos, carga stock y descarga reportes PDF.</p>
          <p className="text-indigo-600 text-[10px] font-bold mt-4 tracking-widest uppercase">Entrar →</p>
        </Link>

        {/* PROVEEDORES */}
        <Link href="/proveedores" className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-teal-500">
          <div className="flex justify-between items-start">
            <span className="text-3xl">🤝</span>
            <span className="bg-teal-100 text-teal-700 text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Contactos</span>
          </div>
          <h2 className="text-2xl font-black mt-4 group-hover:text-teal-600 transition-colors">Proveedores</h2>
          <p className="text-gray-500 mt-2 text-sm leading-tight">Administra tu lista de surtidores y contactos comerciales.</p>
          <p className="text-teal-600 text-[10px] font-bold mt-4 tracking-widest uppercase">Gestionar →</p>
        </Link>
      </div>
    </main>
  );
}