"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

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

  if (cargando) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Cargando CRB...</div>;

  // PANTALLA DE LOGIN
  if (!sesion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-white">
          <div className="text-center mb-8">
            <span className="text-4xl">🍺</span>
            <h1 className="text-4xl font-black text-gray-800 tracking-tighter mt-2">SISTEMA <span className="text-indigo-600">CRB</span></h1>
            <p className="text-gray-400 font-medium text-sm mt-1">Control de Inventario y Ventas</p>
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
        <div>
          <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Administración General</p>
          <h1 className="text-4xl font-black text-gray-900 mt-1">Panel de Control</h1>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
        >
          CERRAR SESIÓN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* VENTAS - NUEVA */}
        <Link href="/ventas" className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-green-600">
          <div className="flex justify-between items-start">
            <span className="text-3xl">💰</span>
            <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Salidas</span>
          </div>
          <h2 className="text-2xl font-black mt-4 group-hover:text-green-600 transition-colors">Registrar Venta</h2>
          <p className="text-gray-500 mt-2 text-sm leading-tight">Descuenta stock y registra ingresos de dinero automáticamente.</p>
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

        {/* PROVEEDORES - NUEVA */}
        <Link href="/proveedores" className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-teal-500">
          <div className="flex justify-between items-start">
            <span className="text-3xl">🤝</span>
            <span className="bg-teal-100 text-teal-700 text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Contactos</span>
          </div>
          <h2 className="text-2xl font-black mt-4 group-hover:text-teal-600 transition-colors">Proveedores</h2>
          <p className="text-gray-500 mt-2 text-sm leading-tight">Administra tu lista de surtidores y contactos comerciales.</p>
          <p className="text-teal-600 text-[10px] font-bold mt-4 tracking-widest uppercase">Gestionar →</p>
        </Link>

        {/* REPORTES */}
        <Link href="/reportes" className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-purple-500">
          <div className="flex justify-between items-start">
            <span className="text-3xl">📊</span>
            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Análisis</span>
          </div>
          <h2 className="text-2xl font-black mt-4 group-hover:text-purple-600 transition-colors">Estadísticas</h2>
          <p className="text-gray-500 mt-2 text-sm leading-tight">Visualiza gráficas de inversión y estados de salud del negocio.</p>
          <p className="text-purple-600 text-[10px] font-bold mt-4 tracking-widest uppercase">Ver →</p>
        </Link>

        {/* HISTORIAL */}
        <Link href="/inventario/historial" className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-orange-500 lg:col-span-2">
          <div className="flex justify-between items-start">
            <span className="text-3xl">🕒</span>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-md tracking-tighter uppercase">Bitácora</span>
          </div>
          <h2 className="text-2xl font-black mt-4 group-hover:text-orange-600 transition-colors">Historial de Movimientos</h2>
          <p className="text-gray-500 mt-2 text-sm leading-tight">Auditoría detallada de cada entrada, salida y cambio en el sistema.</p>
          <p className="text-orange-600 text-[10px] font-bold mt-4 tracking-widest uppercase">Revisar →</p>
        </Link>

      </div>
    </main>
  );
}