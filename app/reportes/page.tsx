"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importaciones de Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Title
);

export default function PaginaReportes() {
  const [vista, setVista] = useState<'inventario' | 'ventas'>('inventario');
  const [datos, setDatos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DE FILTROS ---
  const [busqueda, setBusqueda] = useState("");
  const [limite, setLimite] = useState<number>(0);
  const [precioMin, setPrecioMin] = useState<number | "">("");
  const [precioMax, setPrecioMax] = useState<number | "">("");

  const cargarDatos = async () => {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || "Usuario no identificado");

    try {
      if (vista === 'inventario') {
        const { data } = await supabase
          .from('Productos')
          .select('*, proveedores(nombre)')
          .order('nombre', { ascending: true });
        setDatos(data || []);
      } else {
        const { data } = await supabase
          .from('ventas')
          .select('*, Productos(nombre)')
          .order('created_at', { ascending: false });
        setDatos(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setBusqueda("");
    setPrecioMin("");
    setPrecioMax("");
    cargarDatos();
  }, [vista]);

  // --- LÓGICA DE FILTRADO ---
  const datosFiltrados = datos.filter(item => {
    if (!item) return false;
    const nombre = vista === 'inventario' ? (item.nombre || "") : (item.Productos?.nombre || "");
    const coincideNombre = nombre.toLowerCase().includes(busqueda.toLowerCase());

    const valorReferencia = vista === 'inventario'
      ? ((item.precio || 0) * (item.stock || 0))
      : (item.total || 0);

    const coincideMin = precioMin === "" ? true : valorReferencia >= precioMin;
    const coincideMax = precioMax === "" ? true : valorReferencia <= precioMax;
    return coincideNombre && coincideMin && coincideMax;
  }).slice(0, limite > 0 ? limite : undefined);

  // --- CÁLCULO DEL SUBTOTAL GENERAL ---
  const subtotalGeneral = datosFiltrados.reduce((acc, item) => {
    const valor = vista === 'inventario'
      ? ((item.precio || 0) * (item.stock || 0))
      : (item.total || 0);
    return acc + valor;
  }, 0);

  // --- CONFIGURACIÓN DE GRÁFICOS ---
  const chartData = {
    labels: datosFiltrados.slice(0, 10).map(item => vista === 'inventario' ? item.nombre : new Date(item.created_at).toLocaleTimeString()),
    datasets: [{
      label: vista === 'inventario' ? 'Stock Disponible' : 'Monto Venta ($)',
      data: datosFiltrados.slice(0, 10).map(item => vista === 'inventario' ? item.stock : item.total),
      backgroundColor: vista === 'inventario' ? 'rgba(79, 70, 229, 0.6)' : 'rgba(34, 197, 94, 0.6)',
      borderColor: vista === 'inventario' ? 'rgb(79, 70, 229)' : 'rgb(34, 197, 94)',
      borderWidth: 1,
    }]
  };

  // --- EXPORTAR PDF CON GRÁFICO Y TOTAL ---
  const exportarPDF = async () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    const colorPrimario = vista === 'inventario' ? [79, 70, 229] : [34, 197, 94];
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text(`REPORTE ESTRATÉGICO DE ${vista.toUpperCase()}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado por: ${userEmail}`, 14, 28);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 34);
    doc.text(`Subtotal de esta vista: $${subtotalGeneral.toLocaleString()}`, 14, 40);

    // Capturar Gráfico
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const chartImage = canvas.toDataURL('image/png', 1.0);
      doc.addImage(chartImage, 'PNG', 14, 45, 180, 70);
    }

    const headers = vista === 'inventario'
      ? [['Producto', 'Proveedor', 'Stock', 'Valor Total']]
      : [['Fecha', 'Producto', 'Cantidad', 'Total']];

    const body = datosFiltrados.map(item => (
      vista === 'inventario'
        ? [item.nombre, item.proveedores?.nombre || 'N/A', item.stock, `$${((item.precio || 0) * (item.stock || 0)).toLocaleString()}`]
        : [new Date(item.created_at).toLocaleDateString(), item.Productos?.nombre || 'Eliminado', item.cantidad, `$${(item.total || 0).toLocaleString()}`]
    ));

    // Fila de Total
    body.push(['', '', 'TOTAL GENERAL:', `$${subtotalGeneral.toLocaleString()}`]);

    const colorIndigoRGB: [number, number, number] = [79, 70, 229];
    const colorVerdeRGB: [number, number, number] = [34, 197, 94];
    const colorGrisRGB: [number, number, number] = [245, 245, 245];

    autoTable(doc, {
      startY: 120,
      head: headers,
      body: body,
      headStyles: {
        // Usamos el color según la vista con un casting de tipo
        fillColor: vista === 'inventario' ? colorIndigoRGB : colorVerdeRGB
      },
      didParseCell: (data) => {
        // Aplicar estilo a la fila del total
        if (data.row.index === body.length - 1) {
          const cellStyles = data.cell.styles;
          cellStyles.fontStyle = 'bold';
          cellStyles.fillColor = colorGrisRGB; // Usamos la constante definida arriba
        }
      }
    });

    doc.save(`Reporte_${vista}_${Date.now()}.pdf`);
  };

  return (
    <main className="p-10 max-w-7xl mx-auto text-black bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <Link href="/" className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">← Inicio</Link>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Inteligencia de Datos</h1>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Analizando: <span className={vista === 'inventario' ? "text-indigo-500" : "text-green-600"}>{vista}</span></p>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <button onClick={exportarPDF} className="bg-black text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg">Descargar PDF</button>
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200">
            <button onClick={() => setVista('inventario')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${vista === 'inventario' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>INVENTARIO</button>
            <button onClick={() => setVista('ventas')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${vista === 'ventas' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>VENTAS</button>
          </div>
        </div>
      </div>

      {/* GRÁFICOS DINÁMICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm h-80">
          <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4">Tendencia de {vista}</h3>
          <Bar data={chartData} options={{ maintainAspectRatio: false, animation: { duration: 0 } }} />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm h-80 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal General</p>
          <p className={`text-4xl font-black ${vista === 'inventario' ? 'text-indigo-600' : 'text-green-600'} mb-6`}>
            ${subtotalGeneral.toLocaleString()}
          </p>
          <div className="w-full h-40">
            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Buscar por nombre</label>
          <input type="text" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-black" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Mostrar</label>
          <select className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none text-black" value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
            <option value={0}>Todos</option>
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Monto Mín.</label>
          <input type="number" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none text-black" value={precioMin} onChange={(e) => setPrecioMin(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Monto Máx.</label>
          <input type="number" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none text-black" value={precioMax} onChange={(e) => setPrecioMax(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className={vista === 'inventario' ? "bg-indigo-600 text-white" : "bg-green-600 text-white"}>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-left">Referencia</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-center">Detalles</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-black">
            {cargando ? (
              <tr><td colSpan={3} className="p-20 text-center font-bold text-gray-400 animate-pulse uppercase tracking-widest">Cargando inteligencia...</td></tr>
            ) : datosFiltrados.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                {vista === 'inventario' ? (
                  <>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{item.nombre}</p>
                      <p className="text-[10px] text-indigo-500 font-black uppercase">{item.proveedores?.nombre || "Sin Proveedor"}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">Stock: {item.stock} u.</td>
                    <td className="px-6 py-4 text-right font-black">${((item.precio || 0) * (item.stock || 0)).toLocaleString()}</td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-800">{new Date(item.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">{new Date(item.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-bold text-sm">{item.Productos?.nombre || "Eliminado"}</p>
                      <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase">Cantidad: {item.cantidad}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-green-700">${(item.total || 0).toLocaleString()}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}