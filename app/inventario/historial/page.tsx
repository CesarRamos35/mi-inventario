"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PaginaHistorial() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.href = "/";
    };
    verificarSesion();

    const cargarTodoElHistorial = async () => {
      // 1. Cargamos Logs de la tabla Historial (Edición/Creación)
      const { data: historialData } = await supabase
        .from('Historial')
        .select('*');

      // 2. Cargamos las Ventas integrando el nuevo campo usuario_email
      const { data: ventasData } = await supabase
        .from('ventas')
        .select('*, Productos(nombre)')
        .order('created_at', { ascending: false });

      // 3. Unificamos los formatos
      const logsHistorial = (historialData || []).map(h => ({
        ...h,
        usuario_email: h.usuario_email || "sistema@negocio.com",
        fecha: h.fecha || new Date().toISOString()
      }));

      const logsVentas = (ventasData || []).map(v => ({
        id: v.id,
        fecha: v.created_at,
        // CAMBIO AQUÍ: Ahora usamos el email real de la tabla ventas
        usuario_email: v.usuario_email || "venta.antigua@caja.com", 
        producto_nombre: v.Productos?.nombre || "Producto Eliminado",
        accion: 'VENTA',
        detalles: `Salida de ${v.cantidad} unidades`
      }));

      // 4. Mezclamos y ordenamos por fecha
      const unificados = [...logsHistorial, ...logsVentas].sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setLogs(unificados);
    };

    cargarTodoElHistorial();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const logsFiltrados = logs.filter(log => {
    const coincideUsuario = (log.usuario_email || "Sistema")
      .toLowerCase()
      .includes(filtroUsuario.toLowerCase());
      
    const coincideAccion = filtroAccion === "" ? true : log.accion === filtroAccion;
    return coincideUsuario && coincideAccion;
  });

  return (
    <main className="p-10 max-w-6xl mx-auto text-black">
      <div className="flex justify-between items-end mb-8">
        <div>
          {/* NUEVOS LINKS DE NAVEGACIÓN */}
          <div className="flex gap-4 mb-2">
            <Link href="/" className="text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">
              🏠 Menú Principal
            </Link>
            <span className="text-gray-300 text-[10px]">|</span>
            <Link href="/inventario" className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">
              📦 Mostrar Inventario
            </Link>
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter uppercase">Libro de Auditoría</h1>
          <p className="text-gray-400 text-xs font-bold uppercase">Movimientos manuales y ventas registradas</p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-2">Filtrar por Usuario (Email)</label>
          <input 
            type="text" 
            placeholder="Ej: admin..."
            className="w-full p-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
          />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-2">Tipo de Acción</label>
          <select 
            className="w-full p-2 bg-gray-50 rounded-xl text-sm font-bold outline-none cursor-pointer"
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
          >
            <option value="">TODAS LAS ACCIONES</option>
            <option value="CREACIÓN">CREACIÓN</option>
            <option value="EDICIÓN">EDICIÓN</option>
            <option value="ELIMINACIÓN">ELIMINACIÓN</option>
            <option value="VENTA">VENTAS (SALIDAS)</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-gray-100">
        <table className="min-w-full">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Fecha y Hora</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Responsable</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Producto</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Evento</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Descripción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logsFiltrados.map((log) => {
              // Extraemos el nombre antes del @ para el avatar y el texto
              const nombreLimpio = log.usuario_email ? log.usuario_email.split('@')[0] : "usuario";
              const esVenta = log.accion === 'VENTA';

              return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-500 whitespace-nowrap">
                    {new Date(log.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border ${esVenta ? 'bg-green-100 border-green-200 text-green-700' : 'bg-indigo-100 border-indigo-200 text-indigo-700'}`}>
                        {nombreLimpio.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-gray-700 capitalize">{nombreLimpio}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-black text-gray-900">
                    {log.producto_nombre}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                      log.accion === 'CREACIÓN' ? 'bg-green-50 text-green-600' : 
                      log.accion === 'EDICIÓN' ? 'bg-blue-50 text-blue-600' : 
                      log.accion === 'VENTA' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {log.accion}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-gray-500 italic font-medium">
                    {log.detalles}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {logsFiltrados.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-black uppercase text-xs tracking-tighter animate-pulse">Sin resultados para esta búsqueda</p>
          </div>
        )}
      </div>
    </main>
  );
}