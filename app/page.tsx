"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosInicio = async () => {
      const { data } = await supabase
        .from('Historial')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(3); // Solo los 3 más recientes para el diseño

      setMovimientos(data || []);
      setCargando(false);
    };

    cargarDatosInicio();

    // Suscribirse a cambios para que el inicio se actualice solo
    const canal = supabase
      .channel('cambios-historial-inicio')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Historial' }, () => {
        cargarDatosInicio();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
          SISTEMA <span className="text-blue-600">CRB</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Panel de Control de Gestión</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">

        {/* Tarjeta Inventario - Activa */}
        <Link href="/inventario" className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-blue-500 group">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold group-hover:text-blue-600 transition-colors">📦 Inventario</h2>
            <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">Acceso Total</span>
          </div>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">Control de productos, stock crítico y edición de imágenes en la nube.</p>
        </Link>

        {/* Tarjeta Historial - ¡AHORA ACTIVA! */}
        <Link href="/inventario/historial" className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-orange-500 group flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold group-hover:text-orange-600 transition-colors">📜 Historial</h2>
              <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">En Vivo</span>
            </div>

            {/* Mini Lista de Actividad */}
            <div className="space-y-3">
              {cargando ? (
                <p className="text-xs text-gray-400 italic">Cargando actividad...</p>
              ) : movimientos.length > 0 ? (
                movimientos.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${m.accion === 'CREACIÓN' ? 'bg-green-500' :
                        m.accion === 'EDICIÓN' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                    <p className="text-[11px] text-gray-600 truncate flex-1">
                      <span className="font-bold text-gray-800">{m.producto_nombre}</span> - {m.detalles}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">Sin movimientos registrados.</p>
              )}
            </div>
          </div>
          <p className="text-indigo-600 text-[10px] font-bold mt-4 group-hover:underline">VER TODA LA AUDITORÍA →</p>
        </Link>

        {/* Tarjeta Gráficas - ¡YA ACTIVA! */}
        <Link href="/reportes" className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 border-l-8 border-l-purple-500 group">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold group-hover:text-purple-600 transition-colors">📊 Reportes y Gráficas</h2>
            <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">Estadísticas</span>
          </div>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">Visualiza el valor monetario de tu bodega y el estado crítico de tus existencias.</p>
          <p className="text-purple-600 text-[10px] font-bold mt-4 group-hover:underline">VER ANÁLISIS VISUAL →</p>
        </Link>

      </div>

      <footer className="mt-16 text-gray-400 text-[11px] font-medium tracking-widest uppercase">
        Desarrollado por CRB Gestión © 2026
      </footer>
    </main>
  );
}