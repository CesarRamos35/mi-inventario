"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PaginaProveedores() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productosSurtidos, setProductosSurtidos] = useState<any[]>([]);
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);

  // Estados para el formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);

  const cargarProveedores = async () => {
    const { data } = await supabase.from('proveedores').select('*').order('nombre');
    setProveedores(data || []);
    setCargando(false);
  };

  useEffect(() => { cargarProveedores(); }, []);

  // 1. CARGAR PRODUCTOS DEL PROVEEDOR
  const seleccionarProveedor = async (prov: any) => {
    setIdSeleccionado(prov.id);
    setNombre(prov.nombre);
    setTelefono(prov.telefono || "");
    setDireccion(prov.direccion || "");
    setEditando(true);

    const { data } = await supabase
      .from('Productos')
      .select('*')
      .eq('proveedor_id', prov.id);
    setProductosSurtidos(data || []);
  };

  // 2. AGREGAR O EDITAR
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editando && idSeleccionado) {
      const { error } = await supabase
        .from('proveedores')
        .update({ nombre, telefono, direccion })
        .eq('id', idSeleccionado);

      if (!error) alert("✅ Proveedor actualizado");
    } else {
      const { error } = await supabase
        .from('proveedores')
        .insert([{ nombre, telefono, direccion }]);

      if (!error) alert("✅ Proveedor registrado");
    }

    cancelarEdicion();
    cargarProveedores();
  };

  // 3. ELIMINAR PROVEEDOR (Nueva función)
  const borrarProveedor = async (id: number, nombreProv: string) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar a "${nombreProv}"? Esta acción no se puede deshacer.`);

    if (confirmar) {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Error al eliminar: " + error.message);
      } else {
        alert("🗑️ Proveedor eliminado");
        // Si el que borramos es el que estaba seleccionado, limpiamos la vista
        if (idSeleccionado === id) cancelarEdicion();
        cargarProveedores();
      }
    }
  };

  const cancelarEdicion = () => {
    setNombre(""); setTelefono(""); setDireccion("");
    setEditando(false); setIdSeleccionado(null);
    setProductosSurtidos([]);
  };

  return (
    <main className="p-10 max-w-6xl mx-auto text-black min-h-screen">
      <Link href="/" className="text-indigo-600 font-bold text-sm">← Volver al Panel</Link>
      <h1 className="text-4xl font-black my-6 tracking-tighter uppercase">Directorio de Proveedores 🤝</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* FORMULARIO DINÁMICO */}
        <section className={`p-8 rounded-3xl shadow-xl border transition-all h-fit ${editando ? 'bg-slate-900 text-white border-slate-800' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black">{editando ? "Editar Proveedor" : "Registrar Nuevo"}</h2>
            {editando && (
              <button onClick={cancelarEdicion} className="text-[10px] bg-slate-700 px-2 py-1 rounded-lg">CANCELAR</button>
            )}
          </div>

          <form onSubmit={manejarEnvio} className="space-y-4">
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${editando ? 'text-slate-400' : 'text-gray-400'}`}>Nombre Empresa</label>
              <input
                type="text" className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${editando ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50'}`}
                value={nombre} onChange={(e) => setNombre(e.target.value)} required
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${editando ? 'text-slate-400' : 'text-gray-400'}`}>Teléfono</label>
              <input
                type="text" className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${editando ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50'}`}
                value={telefono} onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${editando ? 'text-slate-400' : 'text-gray-400'}`}>Dirección</label>
              <input
                type="text" className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${editando ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50'}`}
                value={direccion} onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
            <button className={`w-full py-4 rounded-2xl font-black transition-all shadow-lg ${editando ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {editando ? "GUARDAR CAMBIOS" : "GUARDAR PROVEEDOR"}
            </button>
          </form>
        </section>

        {/* TABLA Y LISTA DE PRODUCTOS */}

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto"> {/* <--- ESTA LÍNEA ES MAGIA */}
              <table className="min-w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Empresa</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Contacto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {proveedores.map(p => (
                    <tr key={p.id} className={`transition-colors ${idSeleccionado === p.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 font-bold text-gray-800">{p.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.telefono || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => seleccionarProveedor(p)}
                            className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            GESTIONAR
                          </button>
                          <button
                            onClick={() => borrarProveedor(p.id, p.nombre)}
                            className="text-[10px] font-black bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                          >
                            ELIMINAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* LISTA DE PRODUCTOS SURTIDOS */}
          {idSeleccionado && (
            <section className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-indigo-200">Productos suministrados por {nombre}</h3>
              {productosSurtidos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {productosSurtidos.map(prod => (
                    <div key={prod.id} className="bg-indigo-500/40 p-4 rounded-2xl border border-indigo-400/30 flex justify-between items-center">
                      <span className="font-bold text-sm uppercase">{prod.nombre}</span>
                      <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-md">STOCK: {prod.stock}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-indigo-200">Este proveedor aún no tiene productos asociados en el inventario.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}