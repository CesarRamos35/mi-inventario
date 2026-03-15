"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PaginaVentas() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(false);

  // 1. Verificar sesión y cargar productos con stock
  useEffect(() => {
    const verificarYCargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }

      const { data } = await supabase
        .from('Productos')
        .select('*')
        .gt('stock', 0) // Solo productos que tengan algo en stock
        .order('nombre');
      setProductos(data || []);
    };
    verificarYCargar();
  }, [router]);

  // Encontrar el producto seleccionado para mostrar precio y validar stock
  const productoActual = productos.find(p => String(p.id) === seleccionado);

  const registrarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoActual) return alert("Por favor selecciona un producto");
    if (cantidad <= 0) return alert("La cantidad debe ser mayor a 0");
    if (productoActual.stock < cantidad) return alert("¡Error! Stock insuficiente.");

    setCargando(true);

    try {
      // 1. FORMA BLINDADA DE OBTENER EL USUARIO
      const { data: { user } } = await supabase.auth.getUser(); 
      const emailResponsable = user?.email || "usuario.anonimo@test.com";
      
      console.log("Revisando email antes de enviar:", emailResponsable);

      // 2. Insertar en la tabla de Ventas
      const { error: errorVenta } = await supabase.from('ventas').insert([
        { 
          producto_id: productoActual.id, 
          cantidad: cantidad, 
          total: productoActual.precio * cantidad,
          usuario_email: emailResponsable // <-- Asegúrate que diga exactamente esto
        }
      ]);

      if (errorVenta) {
        console.error("Error de Supabase:", errorVenta);
        alert("Error al registrar venta: " + errorVenta.message);
        setCargando(false);
        return;
      }

      // 3. Actualizar el Stock
      const { error: errorStock } = await supabase
        .from('Productos')
        .update({ stock: productoActual.stock - cantidad })
        .eq('id', productoActual.id);

      if (errorStock) {
        alert("Venta registrada pero el stock NO bajó.");
      } else {
        alert(`✅ Venta exitosa por: ${emailResponsable}`);
        // En lugar de reload, podrías limpiar estados, pero reload sirve por ahora
        window.location.reload(); 
      }
    } catch (err) {
      alert("Error inesperado en el sistema");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="p-10 max-w-2xl mx-auto text-black min-h-screen">
      <Link href="/" className="text-indigo-600 font-bold text-sm">← Volver al Panel</Link>
      <h1 className="text-4xl font-black my-6 tracking-tighter">REGISTRAR VENTA 💰</h1>

      <form onSubmit={registrarVenta} className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 space-y-6">
        
        {/* Selector de Producto */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Producto a Vender</label>
          <select 
            className="w-full p-4 border border-gray-200 rounded-xl mt-1 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            required
          >
            <option value="">Selecciona un producto...</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre} — Stock: {p.stock} | ${p.precio.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad</label>
          <input 
            type="number" 
            min="1"
            className="w-full p-4 border border-gray-200 rounded-xl mt-1 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
            value={cantidad} 
            onChange={(e) => setCantidad(Number(e.target.value))}
            required
          />
        </div>

        {/* Resumen Automático */}
        {productoActual && (
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 animate-in fade-in duration-300">
            <p className="text-xs font-black text-green-600 uppercase mb-2">Resumen de Operación</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Subtotal ({cantidad} x ${productoActual.precio})</span>
              <span className="text-2xl font-black text-green-700">${(productoActual.precio * cantidad).toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-green-500 mt-2">Stock restante después de venta: {productoActual.stock - cantidad}</p>
          </div>
        )}

        {/* Botón de Acción */}
        <button 
          type="submit"
          disabled={cargando || !seleccionado}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-green-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
        >
          {cargando ? "PROCESANDO..." : "FINALIZAR VENTA"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-xs italic">Toda venta queda registrada automáticamente en el historial con fecha y hora.</p>
      </div>
    </main>
  );
}