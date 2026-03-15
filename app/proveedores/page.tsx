"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PaginaProveedores() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargarProveedores = async () => {
    const { data } = await supabase.from('proveedores').select('*').order('nombre');
    setProveedores(data || []);
    setCargando(false);
  };

  useEffect(() => { cargarProveedores(); }, []);

  const agregarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('proveedores').insert([{ nombre, telefono, direccion }]);
    if (!error) {
      setNombre(""); setTelefono(""); setDireccion("");
      cargarProveedores();
    }
  };

  return (
    <main className="p-10 max-w-6xl mx-auto text-black min-h-screen">
      <Link href="/" className="text-indigo-600 font-bold text-sm">← Volver al Panel</Link>
      <h1 className="text-4xl font-black my-6 tracking-tighter uppercase">Directorio de Proveedores 🤝</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO DE REGISTRO */}
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-fit">
          <h2 className="text-xl font-black mb-6 text-gray-800">Registrar Nuevo</h2>
          <form onSubmit={agregarProveedor} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Empresa</label>
              <input 
                type="text" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={nombre} onChange={(e) => setNombre(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
              <input 
                type="text" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={telefono} onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dirección / Sucursal</label>
              <input 
                type="text" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={direccion} onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg">
              GUARDAR PROVEEDOR
            </button>
          </form>
        </section>

        {/* TABLA DE DATOS COMPLETOS */}
        <section className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Empresa</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Contacto</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Ubicación</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proveedores.map(p => (
                <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{p.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.telefono || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.direccion || '—'}</td>
                  <td className="px-6 py-4 text-right font-mono text-[10px] text-gray-300">#{p.id}</td>
                </tr>
              ))}
              {proveedores.length === 0 && !cargando && (
                <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">No hay proveedores registrados.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}