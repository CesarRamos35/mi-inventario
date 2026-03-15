"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PaginaHistorial() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const cargarLogs = async () => {
      const { data } = await supabase
        .from('Historial')
        .select('*')
        .order('fecha', { ascending: false });
      setLogs(data || []);
    };
    cargarLogs();
  }, []);

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/inventario" className="text-indigo-600 text-sm font-medium hover:underline">
            ← Volver al Inventario
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Historial de Movimientos</h1>
          <p className="text-gray-500 text-sm">Registro detallado de auditoría por usuario</p>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              // LÓGICA DE LIMPIEZA: Extrae el nombre antes del @
              const nombreLimpio = log.usuario_email 
                ? log.usuario_email.split('@')[0] 
                : "Sistema";

              return (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  {/* FECHA */}
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.fecha).toLocaleString()}
                  </td>

                  {/* USUARIO LIMPIO CON AVATAR */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0 border border-indigo-200">
                        {nombreLimpio.substring(0, 1)}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 capitalize">
                        {nombreLimpio}
                      </span>
                    </div>
                  </td>

                  {/* PRODUCTO */}
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {log.producto_nombre}
                  </td>

                  {/* ACCIÓN */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tight ${
                      log.accion === 'CREACIÓN' ? 'bg-green-100 text-green-700' : 
                      log.accion === 'EDICIÓN' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.accion}
                    </span>
                  </td>

                  {/* DETALLES */}
                  <td className="px-6 py-4 text-sm text-gray-600 italic">
                    {log.detalles}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {logs.length === 0 && (
        <div className="text-center py-10 text-gray-400 italic">
          No hay movimientos registrados todavía.
        </div>
      )}
    </main>
  );
}