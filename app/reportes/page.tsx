"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Title
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

  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [limite, setLimite] = useState<number>(0);
  const [precioMin, setPrecioMin] = useState<number | "">("");
  const [precioMax, setPrecioMax] = useState<number | "">("");

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroFecha("");
    setLimite(0);
    setPrecioMin("");
    setPrecioMax("");
  };

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
        const { data, error }: any = await supabase
          .from('detalle_ventas')
          .select(`
            id,
            cantidad,
            subtotal,
            producto_id,
            Productos (nombre),
            ventas (created_at, cliente_nombre, usuario_email)
          `);

        if (error) throw error;

        const ventasFormateadas = (data || []).map((d: any) => ({
          id: d.id,
          fecha: d.ventas?.created_at,
          producto_nombre: d.Productos?.nombre || "Producto Eliminado",
          cantidad: d.cantidad || 0,
          total: d.subtotal || 0,
          cliente: d.ventas?.cliente_nombre || "Público General",
          vendedor: d.ventas?.usuario_email || "N/A"
        }))
          .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        setDatos(ventasFormateadas);
      }
    } catch (err) {
      console.error("Error cargando reportes:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    limpiarFiltros();
    cargarDatos();
  }, [vista]);

  const datosFiltrados = datos.filter(item => {
    if (!item) return false;
    const nombre = vista === 'inventario' ? (item.nombre || "") : (item.producto_nombre || "");
    const coincideNombre = nombre.toLowerCase().includes(busqueda.toLowerCase());

    let coincideFecha = true;
    if (vista === 'ventas' && filtroFecha !== "") {
      const fechaItem = new Date(item.fecha).toISOString().split('T')[0];
      coincideFecha = fechaItem === filtroFecha;
    }

    const valorReferencia = vista === 'inventario'
      ? ((item.precio || 0) * (item.stock || 0))
      : (item.total || 0);
    const coincideMin = precioMin === "" ? true : valorReferencia >= precioMin;
    const coincideMax = precioMax === "" ? true : valorReferencia <= precioMax;

    return coincideNombre && coincideFecha && coincideMin && coincideMax;
  }).slice(0, limite > 0 ? limite : undefined);

  const subtotalGeneral = datosFiltrados.reduce((acc, item) => {
    const valor = vista === 'inventario'
      ? ((item.precio || 0) * (item.stock || 0))
      : (item.total || 0);
    return acc + valor;
  }, 0);

  const chartData = {
    labels: datosFiltrados.slice(0, 10).map(item => vista === 'inventario' ? item.nombre : item.producto_nombre),
    datasets: [{
      label: vista === 'inventario' ? 'Stock' : 'Ventas (Bs.)',
      data: datosFiltrados.slice(0, 10).map(item => vista === 'inventario' ? item.stock : item.total),
      backgroundColor: vista === 'inventario' ? 'rgba(79, 70, 229, 0.6)' : 'rgba(34, 197, 94, 0.6)',
      borderColor: vista === 'inventario' ? 'rgb(79, 70, 229)' : 'rgb(34, 197, 94)',
      borderWidth: 1,
    }]
  };

  const exportarPDF = async () => {
    // Usamos 'l' (landscape) para que quepan las 6 columnas cómodamente
    const doc = new jsPDF('l', 'mm', 'a4'); 
    doc.setFontSize(18);
    const colorPrimario = vista === 'inventario' ? [79, 70, 229] : [34, 197, 94];
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text(`REPORTE DE ${vista.toUpperCase()}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado por: ${userEmail}`, 14, 28);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 34);

    const canvas = document.querySelector('canvas');
    if (canvas) {
      const chartImage = canvas.toDataURL('image/png', 1.0);
      doc.addImage(chartImage, 'PNG', 14, 40, 100, 45); 
    }

    const headers = vista === 'inventario'
      ? [['Producto', 'Proveedor', 'Stock', 'Valor']]
      : [['Fecha', 'Cliente', 'Producto', 'Cant.', 'Vendedor', 'Total']];

    const body = datosFiltrados.map(item => (
      vista === 'inventario'
        ? [
            item.nombre, 
            item.proveedores?.nombre || 'N/A', 
            item.stock, 
            `${((item.precio || 0) * (item.stock || 0)).toLocaleString()} Bs.`
          ]
        : [
            new Date(item.fecha).toLocaleDateString(), 
            item.cliente,
            item.producto_nombre, 
            item.cantidad, 
            item.vendedor?.split('@')[0] || 'N/A', 
            `${(item.total || 0).toLocaleString()} Bs.`
          ]
    ));

    // Fila de Total
    const emptyCols = vista === 'inventario' ? ['', ''] : ['', '', '', ''];
    body.push([...emptyCols, 'TOTAL:', `${subtotalGeneral.toLocaleString()} Bs.`]);

    autoTable(doc, {
      startY: 90,
      head: headers,
      body: body,
      headStyles: { fillColor: vista === 'inventario' ? [79, 70, 229] : [34, 197, 94] },
      styles: { fontSize: 9 },
    });

    doc.save(`Reporte_CRB_${vista}.pdf`);
  };

  return (
    <main className="p-4 sm:p-10 max-w-7xl mx-auto text-black bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <Link href="/" className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">← Inicio</Link>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Inteligencia de Datos</h1>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
            Analizando: <span className={vista === 'inventario' ? "text-indigo-500" : "text-green-600"}>{vista}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 items-end w-full md:w-auto">
          <button onClick={exportarPDF} className="w-full md:w-auto bg-black text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg">Descargar PDF</button>
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 w-full md:w-auto">
            <button onClick={() => setVista('inventario')} className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${vista === 'inventario' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>INVENTARIO</button>
            <button onClick={() => setVista('ventas')} className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${vista === 'ventas' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>VENTAS</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm h-80">
          <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4">Top 10 {vista}</h3>
          <Bar data={chartData} options={{ maintainAspectRatio: false }} />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm h-80 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Total</p>
          <p className={`text-4xl font-black ${vista === 'inventario' ? 'text-indigo-600' : 'text-green-600'} mb-6`}>
            {subtotalGeneral.toLocaleString()} <small className="text-sm font-bold">Bs.</small>
          </p>
          <div className="w-full h-40">
            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col lg:flex-row gap-4 items-end">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 flex-1 w-full">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Producto</label>
            <input type="text" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Fecha</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-30" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} disabled={vista === 'inventario'} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Resultados</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none" value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
              <option value={0}>Todos</option>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Mín. Bs.</label>
            <input type="number" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" value={precioMin} onChange={(e) => setPrecioMin(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 block mb-1">Máx. Bs.</label>
            <input type="number" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" value={precioMax} onChange={(e) => setPrecioMax(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        </div>

        <button
          onClick={limpiarFiltros}
          title="Limpiar filtros"
          className="bg-red-50 text-red-500 p-3.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left whitespace-nowrap">
            <thead>
              <tr className={vista === 'inventario' ? "bg-indigo-600 text-white" : "bg-green-600 text-white"}>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Referencia</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-center">Detalles</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cargando ? (
                <tr><td colSpan={3} className="p-20 text-center font-bold text-gray-400 animate-pulse uppercase">Calculando...</td></tr>
              ) : datosFiltrados.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors text-black">
                  {vista === 'inventario' ? (
                    <>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{item.nombre}</p>
                        <p className="text-[10px] text-indigo-500 font-black uppercase">{item.proveedores?.nombre || "Sin Proveedor"}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">Stock: {item.stock} u.</td>
                      <td className="px-6 py-4 text-right font-black">{((item.precio || 0) * (item.stock || 0)).toLocaleString()} Bs.</td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-gray-800">{new Date(item.fecha).toLocaleDateString()}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Cliente: {item.cliente}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-bold text-sm">{item.producto_nombre}</p>
                        <div className="flex flex-col items-center">
                          <p className="text-[10px] text-gray-400 font-black uppercase">Cantidad: {item.cantidad}</p>
                          <p className="text-[9px] text-indigo-400 font-black uppercase">
                            Vendedor: {item.vendedor ? item.vendedor.split('@')[0] : 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-green-700">
                        {(item.total || 0).toLocaleString()} Bs.
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && datosFiltrados.length === 0 && (
            <div className="p-20 text-center text-gray-400 font-black uppercase text-xs">Sin resultados para esta búsqueda</div>
          )}
        </div>
      </div>
    </main>
  );
}