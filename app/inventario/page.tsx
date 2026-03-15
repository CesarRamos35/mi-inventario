"use client";

import { supabase } from '@/lib/supabase';
import FormularioProducto from '@/components/FormularioProductos';
import FilaProducto from '@/components/FilaProductos';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

export default function PaginaInventario() {
  const [sesion, setSesion] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DE FILTROS ---
  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("todos");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [precioMin, setPrecioMin] = useState<number | "">("");
  const [precioMax, setPrecioMax] = useState<number | "">("");

  // Función principal de carga de datos
  const cargarTodo = useCallback(async () => {
    // Traemos productos con sus proveedores
    const { data: prods, error: errorProds } = await supabase
      .from('Productos')
      .select('*, proveedores(nombre)')
      .order('created_at', { ascending: false });

    // Traemos lista de proveedores para los selects
    const { data: provs, error: errorProvs } = await supabase
      .from('proveedores')
      .select('id, nombre')
      .order('nombre');

    if (errorProds) console.error("Error productos:", errorProds.message);

    setProductos(prods || []);
    setProveedores(provs || []);
    setCargando(false);
  }, []);

  // Efecto inicial y suscripción a sesión
  useEffect(() => {
    cargarTodo();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => authSub.unsubscribe();
  }, [cargarTodo]);

  // Lógica de filtrado en tiempo real
  const productoFiltrados = productos.filter(p => {
    const nombreProd = p.nombre || "";
    const coincideNombre = nombreProd.toLowerCase().includes(busqueda.toLowerCase());
    const coincideProveedor = filtroProveedor === "todos" ? true : String(p.proveedor_id) === filtroProveedor;
    const coincideStock = filtroStock === "todos" ? true : filtroStock === "critico" ? p.stock < 5 : p.stock >= 5;
    const coincidePrecioMin = precioMin === "" ? true : p.precio >= precioMin;
    const coincidePrecioMax = precioMax === "" ? true : p.precio <= precioMax;

    return coincideNombre && coincideProveedor && coincideStock && coincidePrecioMin && coincidePrecioMax;
  });

  if (cargando) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center font-black text-indigo-600 animate-bounce uppercase tracking-tighter text-2xl">
        Cargando Sistema...
      </div>
    </div>
  );

  return (
    <main className="p-10 max-w-7xl mx-auto text-black bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <Link href="/" className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">
          ← Panel Principal
        </Link>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">INVENTARIO INTELIGENTE</h1>
      </div>

      {/* SECCIÓN: REGISTRO (Recibe onActualizar) */}
      <FormularioProducto onActualizar={cargarTodo} />

      {/* SECCIÓN: FILTROS */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none text-black focus:ring-2 focus:ring-indigo-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black"
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
          >
            <option value="todos">Todos los proveedores</option>
            {proveedores.map(prov => (
              <option key={prov.id} value={prov.id}>{prov.nombre}</option>
            ))}
          </select>

          <select
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black"
            value={filtroStock}
            onChange={(e) => setFiltroStock(e.target.value)}
          >
            <option value="todos">Cualquier stock</option>
            <option value="critico">⚠️ Crítico (Menos de 5)</option>
            <option value="normal">✅ Saludable</option>
          </select>

          <input
            type="number"
            placeholder="Precio Min $"
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value === "" ? "" : Number(e.target.value))}
          />

          <input
            type="number"
            placeholder="Precio Max $"
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
      </div>

      {/* SECCIÓN: TABLA DE PRODUCTOS */}
      <div className="bg-white shadow-xl rounded-[2rem] border border-gray-100 overflow-hidden">
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto"> {/* <--- ESTA LÍNEA ES MAGIA */}
            <table className="min-w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b text-left">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">Imagen</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                  <th className="px-6 py-5 text-[10px] font-black text-indigo-500 uppercase tracking-widest">Proveedor</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">Stock</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">Precio</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase text-right tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productoFiltrados.length > 0 ? (
                  productoFiltrados.map((prod) => (
                    <FilaProducto
                      key={prod.id}
                      prod={prod}
                      esAdmin={!!sesion}
                      proveedores={proveedores}
                      onActualizar={cargarTodo}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                      No se encontraron productos con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}