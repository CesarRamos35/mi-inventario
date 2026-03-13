"use client"; // <--- ESTO ES LA CLAVE

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
  const productoFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  //DESCARGADO Y CONFIGURACION DEL DOCUMENTO PDF
  const exportarPDF = () => {
  const doc = new jsPDF();
  const fecha = new Date().toLocaleDateString();

  // 1. Configuración de Título
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // Un gris oscuro elegante
  doc.text("INFORME DE INVENTARIO", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el: ${fecha}`, 14, 30);
  doc.text("Estado actual del almacén en tiempo real", 14, 35);

  // 2. RECUADRO DEL DASHBOARD (Resumen Ejecutivo)
  doc.setFillColor(248, 250, 252); // Fondo azul grisáceo muy claro
  doc.roundedRect(14, 42, 182, 35, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.text("MÉTRICAS CLAVE", 20, 50);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.text(`Inversión Total: $${totalInversion.toLocaleString()}`, 20, 58);
  doc.text(`Variedad de Productos: ${totalProductos} tipos`, 20, 66);
  
  // Alerta de Stock en el PDF
  if (stockCritico > 0) {
    doc.setTextColor(220, 38, 38); // Rojo vibrante
    doc.setFont("helvetica", "bold");
    doc.text(`ALERTA: ${stockCritico} productos requieren reposición inmediata.`, 90, 58);
  } else {
    doc.setTextColor(22, 163, 74); // Verde éxito
    doc.text(`Estado: Stock niveles óptimos.`, 90, 58);
  }

  // 3. TABLA DE DETALLES
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Desglose de Existencias", 14, 88);

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
    headStyles: { 
      fillColor: [79, 70, 229], // El color Indigo-600 de tus botones
      fontSize: 10,
      halign: 'center' 
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  // 4. Pie de página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} - Generado por Sistema de Inventario Pro`, 14, 285);
  }

  doc.save(`Reporte_Inventario_${fecha.replace(/\//g, '-')}.pdf`);
};

  // 1. Cargar sesión y productos
  useEffect(() => {
  // Función para cargar los productos inicialmente
  const cargarProductos = async () => {
    const { data } = await supabase
      .from('Productos')
      .select('*')
      .order('created_at', { ascending: false });
    setProductos(data || []);
    setCargando(false);
  };

  cargarProductos();

  // --- AQUÍ LA MAGIA DEL REALTIME ---
  const canal = supabase
    .channel('cambios-en-productos') // Un nombre cualquiera para el canal
    .on(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'Productos' }, 
      () => {
        // Cuando pase CUALQUIER cosa (insert, update, delete), recargamos la lista
        cargarProductos();
      }
    )
    .subscribe();

  // Escuchar sesión
  const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSesion(session);
  });

  // Limpiar al cerrar el componente
  return () => {
    supabase.removeChannel(canal);
    authSub.unsubscribe();
  };
}, []);

  if (cargando) return <div className="p-10 text-center">Cargando inventario...</div>;

  const estaAutenticado = !!sesion;
  const totalInversion = productos?.reduce((acc, p) => acc + (p.precio * p.stock), 0) || 0;
  const totalProductos = productos?.length || 0;
  const stockCritico = productos?.filter(p => p.stock < 5).length || 0;

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Inventario</h1>
        {estaAutenticado ? (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="text-sm bg-gray-200 hover:bg-red-100 hover:text-red-600 px-4 py-2 rounded-lg transition-colors">
            Cerrar Sesión
          </button>
        ) : (
          <Link href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Entrar como Admin
          </Link>
        )}
      </div>

      {/* Solo mostramos el formulario si está autenticado */}
      {estaAutenticado && <FormularioProducto />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-gray-500 uppercase">Valor del Inventario</p>
          <p className="text-2xl font-bold text-gray-900">${totalInversion.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-gray-500 uppercase">Productos Totales</p>
          <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
        </div>
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${stockCritico > 0 ? 'border-l-red-500' : 'border-l-gray-300'}`}>
          <p className="text-sm font-medium text-gray-500 uppercase">Stock Crítico</p>
          <p className={`text-2xl font-bold ${stockCritico > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stockCritico} <span className="text-sm font-normal text-gray-500">items bajos</span>
          </p>
        </div>
      </div>

      <div className="mb-6">
      <input
        type="text"
        placeholder="Buscar producto por nombre..."
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
       </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Inventario de Productos</h1>
        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Conexión establecida a la Nube</span>
        <button onClick={exportarPDF}
      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors">
        Descargar PDF
      </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">Nombre del Producto</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Precio</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productoFiltrados.map((prod) => (
              <FilaProducto key={prod.id} prod={prod} esAdmin={estaAutenticado} />
              ))}
              </tbody>
        </table>
      </div>
    </main>
  );
}