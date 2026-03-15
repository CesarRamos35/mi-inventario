"use client";

import { supabase } from '@/lib/supabase';
import FormularioProducto from '@/components/FormularioProductos';
import FilaProducto from '@/components/FilaProductos';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Home() {
  const [sesion, setSesion] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("todos"); // "todos", "critico", "normal"
  const [precioMax, setPrecioMax] = useState<number | "">("");

  // --- LÓGICA DE FILTRADO INTELIGENTE ---
  const productoFiltrados = productos.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());

    const coincideStock =
      filtroStock === "todos" ? true :
        filtroStock === "critico" ? p.stock < 5 :
          p.stock >= 5;

    const coincidePrecio = precioMax === "" ? true : p.precio <= precioMax;

    return coincideNombre && coincideStock && coincidePrecio;
  });

  // 1. Cargar sesión y productos
  useEffect(() => {
    const cargarProductos = async () => {
      const { data } = await supabase
        .from('Productos')
        .select('*')
        .order('created_at', { ascending: false });
      setProductos(data || []);
      setCargando(false);
    };

    cargarProductos();

    // --- REALTIME ---
    const canal = supabase
      .channel('cambios-en-productos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Productos' },
        () => {
          cargarProductos();
        }
      )
      .subscribe();

    // Escuchar sesión
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => {
      supabase.removeChannel(canal);
      authSub.unsubscribe();
    };
  }, []);

  const totalInversion = productos?.reduce((acc, p) => acc + (p.precio * p.stock), 0) || 0;
  const totalProductos = productos?.length || 0;
  const stockCritico = productos?.filter(p => p.stock < 5).length || 0;
  const estaAutenticado = !!sesion;

  // --- CONFIGURACIÓN DEL PDF ---
  const exportarPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();

    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("INFORME DE INVENTARIO", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${fecha}`, 14, 30);
    doc.text("Estado actual del almacén en tiempo real", 14, 35);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 42, 182, 35, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.text("MÉTRICAS CLAVE", 20, 50);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(`Inversión Total: $${totalInversion.toLocaleString()}`, 20, 58);
    doc.text(`Variedad de Productos: ${totalProductos} tipos`, 20, 66);

    if (stockCritico > 0) {
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
      doc.text(`ALERTA: ${stockCritico} productos en stock crítico.`, 90, 58);
    }

    const cuerpoTabla = productos.map(p => [
      p.nombre,
      p.stock,
      `$${p.precio.toLocaleString()}`,
      `$${(p.precio * p.stock).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: cuerpoTabla,
      headStyles: { fillColor: [79, 70, 229], halign: 'center' },
      styles: { fontSize: 9 }
    });

    doc.save(`Reporte_Inventario_${fecha}.pdf`);
  };

  if (cargando) return <div className="p-10 text-center text-gray-500">Cargando inventario...</div>;

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/" className="text-indigo-600 text-sm hover:underline font-medium">← Volver al Inicio</Link>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Inventario</h1>
        </div>
        {estaAutenticado ? (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="text-sm bg-gray-200 hover:bg-red-100 hover:text-red-600 px-4 py-2 rounded-lg transition-colors font-medium">
            Cerrar Sesión
          </button>
        ) : (
          <Link href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Entrar como Admin
          </Link>
        )}
      </div>


      {estaAutenticado && <FormularioProducto />}

      {/* DASHBOARD DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Valor del Inventario</p>
          <p className="text-2xl font-bold text-gray-900">${totalInversion.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Productos Totales</p>
          <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
        </div>
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${stockCritico > 0 ? 'border-l-red-500' : 'border-l-gray-300'}`}>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Stock Crítico</p>
          <p className={`text-2xl font-bold ${stockCritico > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stockCritico} <span className="text-sm font-normal text-gray-500">items bajos</span>
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Búsqueda por Nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Cerveza..."
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro por Estado de Stock */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Estado de Stock</label>
            <select
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black bg-white"
              value={filtroStock}
              onChange={(e) => setFiltroStock(e.target.value)}
            >
              <option value="todos">Todos los productos</option>
              <option value="critico">Stock Crítico {"(< 5)"}</option>
              <option value="normal">Stock Saludable {"(>= 5)"}</option>
            </select>
          </div>

          {/* Filtro por Precio Máximo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Precio Máximo</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">$</span>
              <input
                type="number"
                placeholder="Ej: 50"
                className="w-full p-2 pl-7 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 flex justify-between items-center text-sm">
          <p className="text-gray-500">
            Mostrando <span className="font-bold text-indigo-600">{productoFiltrados.length}</span> productos
          </p>
          {(busqueda || filtroStock !== "todos" || precioMax !== "") && (
            <button
              onClick={() => { setBusqueda(""); setFiltroStock("todos"); setPrecioMax(""); }}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* DESCARGAR PDF */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-400 uppercase invisible">Exportar</label>
        <button
          onClick={exportarPDF}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all active:scale-95 group"
        >
          <span className="text-lg group-hover:animate-bounce">📄</span>
          <span className="text-sm">Exportar Informe</span>
        </button>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3 text-center w-20">Vista</th>
              <th className="px-5 py-3">Nombre del Producto</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Precio</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productoFiltrados.map((prod) => (
              <FilaProducto key={prod.id} prod={prod} esAdmin={estaAutenticado} />
            ))}
          </tbody>
        </table>
      </div>
      <Link 
  href="/inventario/historial" 
  className="text-xs bg-white border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-50 font-bold text-gray-600 transition-all shadow-sm"
>
  Ver Historial 🕒
</Link>
    </main>
  );
}