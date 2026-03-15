"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function PaginaReportes() {
  const [datosVentas, setDatosVentas] = useState<any[]>([]);
  const [datosStock, setDatosStock] = useState<any[]>([]);
  const [valorTotal, setValorTotal] = useState(0);

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data } = await supabase.from('Productos').select('*');
      
      if (data) {
        // 1. Calcular Valor Total y Datos para Barras (Top 5 Valor)
        const procesados = data
          .map(p => ({
            nombre: p.nombre,
            valor: p.precio * p.stock
          }))
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 5);

        setDatosVentas(procesados);
        setValorTotal(data.reduce((acc, p) => acc + (p.precio * p.stock), 0));

        // 2. Datos para el gráfico de Pastel (Estado de Stock)
        const stockBajo = data.filter(p => p.stock < 5).length;
        const stockOk = data.length - stockBajo;
        setDatosStock([
          { name: 'Stock Saludable', value: stockOk },
          { name: 'Stock Crítico', value: stockBajo }
        ]);
      }
    };
    obtenerDatos();
  }, []);

  const COLORES = ['#4F46E5', '#EF4444']; // Indigo para OK, Rojo para Crítico

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-indigo-600 text-sm font-bold">← Volver al Inicio</Link>
        <h1 className="text-3xl font-black text-gray-800 mb-8 mt-2">REPORTES Y ANÁLISIS</h1>

        {/* Resumen Superior */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase">Valor Total Bodega</p>
            <h2 className="text-4xl font-black text-indigo-600 mt-1">${valorTotal.toLocaleString()}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Gráfico de Barras: Top 5 Productos por Valor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 mb-6">Top 5: Valor por Producto ($)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosVentas}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nombre" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="valor" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Pastel: Salud del Inventario */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 mb-6">Estado General del Stock</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosStock}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {datosStock.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}