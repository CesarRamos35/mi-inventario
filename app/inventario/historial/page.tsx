"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PaginaHistorial() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");
  const [filtroProducto, setFiltroProducto] = useState(""); 
  const [filtroFecha, setFiltroFecha] = useState(""); 

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.href = "/";
    };
    verificarSesion();

    const cargarTodoElHistorial = async () => {
      const { data: historialData } = await supabase.from('Historial').select('*');

      const { data: detallesData, error }: any = await supabase
        .from('detalle_ventas')
        .select(`
          id,
          cantidad,
          subtotal,
          producto_id,
          Productos (nombre),
          ventas (created_at, usuario_email, cliente_nombre)
        `);

      if (error) console.error("Error cargando historial:", error);

      // --- LÓGICA DE DETECCIÓN MEJORADA ---
      const logsHistorial = (historialData || []).map(h => {
        const detalleMin = (h.detalles || "").toLowerCase();
        
        // Si es una edición pero el detalle menciona "false" (de tu columna activos: false)
        // o menciona "desactivado", lo tratamos como ELIMINACIÓN
        const esBorradoLogico = h.accion === 'EDICIÓN' && (
          detalleMin.includes("false") || 
          detalleMin.includes("desactivado") ||
          detalleMin.includes("activos")
        );
        
        return {
          ...h,
          accion: esBorradoLogico ? 'ELIMINACIÓN' : h.accion,
          usuario_email: h.usuario_email || "sistema@negocio.com",
          fecha: h.fecha || new Date().toISOString()
        };
      });

      const logsVentas = (detallesData || []).map((d: any) => ({
        id: d.id,
        fecha: d.ventas?.created_at,
        usuario_email: d.ventas?.usuario_email || "caja@sistema.com",
        producto_nombre: d.Productos?.nombre || "Producto Desconocido",
        accion: 'VENTA',
        detalles: `Venta a ${d.ventas?.cliente_nombre || 'Cliente'} - Cant: ${d.cantidad} (Subtotal: ${d.subtotal} Bs.)`
      }));

      const unificados = [...logsHistorial, ...logsVentas].sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setLogs(unificados);
    };

    cargarTodoElHistorial();
  }, []);

  const logsFiltrados = logs.filter(log => {
    const coincideUsuario = (log.usuario_email || "Sistema")
      .toLowerCase()
      .includes(filtroUsuario.toLowerCase());

    const coincideProducto = (log.producto_nombre || "")
      .toLowerCase()
      .includes(filtroProducto.toLowerCase());

    const coincideAccion = filtroAccion === "" ? true : log.accion === filtroAccion;

    let coincideFecha = true;
    if (filtroFecha !== "") {
      const fechaLog = new Date(log.fecha).toISOString().split('T')[0];
      coincideFecha = fechaLog === filtroFecha;
    }

    return coincideUsuario && coincideAccion && coincideProducto && coincideFecha;
  });

  return (
    <main className="p-10 max-w-7xl mx-auto text-black">
      <div className="flex justify-between items-end mb-8">
        <div>
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
          <p className="text-gray-400 text-xs font-bold uppercase">Movimientos manuales y ventas por carrito</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-2">Producto</label>
          <input
            type="text"
            placeholder="Buscar por producto..."
            className="w-full p-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-2">Fecha Exacta</label>
          <input
            type="date"
            className="w-full p-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-2">Responsable</label>
          <input
            type="text"
            placeholder="Email..."
            className="w-full p-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
          />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-2">Evento</label>
          <select
            className="w-full p-2 bg-gray-50 rounded-xl text-sm font-bold outline-none cursor-pointer"
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
          >
            <option value="">TODOS</option>
            <option value="CREACIÓN">CREACIÓN</option>
            <option value="EDICIÓN">EDICIÓN</option>
            <option value="ELIMINACIÓN">ELIMINACIÓN</option>
            <option value="VENTA">VENTA</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left whitespace-nowrap">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Responsable</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Producto</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase">Evento</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logsFiltrados.map((log) => {
                const nombreLimpio = log.usuario_email ? log.usuario_email.split('@')[0] : "usuario";
                const esVenta = log.accion === 'VENTA';
                const esEliminacion = log.accion === 'ELIMINACIÓN';

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-[11px] font-bold text-gray-500">
                      {new Date(log.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border ${esVenta ? 'bg-green-100 border-green-200 text-green-700' : 'bg-indigo-100 border-indigo-200 text-indigo-700'}`}>
                          {nombreLimpio[0]?.toUpperCase()}
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
                    <td className={`px-6 py-4 text-xs italic font-medium ${esEliminacion ? 'text-red-500' : 'text-gray-500'}`}>
                      {log.detalles}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}