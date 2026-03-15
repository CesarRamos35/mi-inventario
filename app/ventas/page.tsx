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
  const [vendedor, setVendedor] = useState("Cargando...");
  
  // Inicializamos con datos vacíos para que el componente siempre exista en el DOM
  const [ultimaVenta, setUltimaVenta] = useState<any>({
    producto: "",
    precio: 0,
    cantidad: 0,
    total: 0,
    vendedor: "",
    fecha: ""
  });

  useEffect(() => {
    const verificarYCargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setVendedor(session.user.email || "usuario@test.com");

      const { data } = await supabase
        .from('Productos')
        .select('*')
        .gt('stock', 0)
        .order('nombre');
      setProductos(data || []);
    };
    verificarYCargar();
  }, [router]);

  const productoActual = productos.find(p => String(p.id) === seleccionado);

  const registrarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoActual) return alert("Selecciona producto");
    setCargando(true);

    try {
      const emailResponsable = vendedor;
      const totalVenta = productoActual.precio * cantidad;

      // 1. Guardar en Supabase
      const { error: errorVenta } = await supabase.from('ventas').insert([
        {
          producto_id: productoActual.id,
          cantidad: cantidad,
          total: totalVenta,
          usuario_email: emailResponsable
        }
      ]);
      if (errorVenta) throw errorVenta;

      // 2. Actualizar el Stock
      const { error: errorStock } = await supabase
        .from('Productos')
        .update({ stock: productoActual.stock - cantidad })
        .eq('id', productoActual.id);
      if (errorStock) throw errorStock;

      // 3. PASO CLAVE: Actualizar el estado del recibo que ya está en el DOM
      setUltimaVenta({
        producto: productoActual.nombre,
        precio: productoActual.precio,
        cantidad: cantidad,
        total: totalVenta,
        vendedor: emailResponsable,
        fecha: new Date().toLocaleString('es-BO')
      });

      // 4. ESPERA PARA MÓVIL: Damos tiempo a que React escriba los textos antes de imprimir
      setTimeout(() => {
        window.print();

        // Limpieza y actualización local
        setSeleccionado("");
        setCantidad(1);
        const nuevosProductos = productos.map(p =>
          p.id === productoActual.id ? { ...p, stock: p.stock - cantidad } : p
        );
        setProductos(nuevosProductos);
        setCargando(false);
      }, 700);

    } catch (err: any) {
      alert("Error: " + (err.message || "Error inesperado"));
      setCargando(false);
    }
  };

  return (
    <main className="p-4 sm:p-10 max-w-2xl mx-auto text-black min-h-screen">
      
      {/* --- SECCIÓN DEL RECIBO (Invisible en pantalla, posicionada para que el móvil la procese) --- */}
      <div 
        id="recibo-impresion" 
        className="fixed top-0 left-[-1000px] print:static print:block p-4 text-black font-mono text-sm w-[80mm] bg-white"
      >
        <div className="text-center border-b-2 border-dashed pb-4 mb-4">
          {/* Usamos img tradicional para asegurar carga inmediata en el render de impresión */}
          <img src="/logo-crb.png" alt="Logo" className="mx-auto mb-2 w-20 h-auto" />
          <h2 className="font-bold text-lg leading-none">SISTEMA CRB</h2>
          <p className="text-[10px]">Soluciones Informáticas - Tarija</p>
        </div>
        <div className="mb-4 text-[11px]">
          <p><strong>Fecha:</strong> {ultimaVenta.fecha}</p>
          <p><strong>Vendedor:</strong> {ultimaVenta.vendedor}</p>
        </div>
        <table className="w-full mb-4 text-[11px]">
          <thead className="border-b border-dashed">
            <tr>
              <th className="text-left">Cant.</th>
              <th className="text-left">Prod.</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{ultimaVenta.cantidad}</td>
              <td className="max-w-[40mm] truncate">{ultimaVenta.producto}</td>
              <td className="text-right">{ultimaVenta.total} Bs.</td>
            </tr>
          </tbody>
        </table>
        <div className="text-right font-bold text-lg border-t-2 border-dashed pt-2">
          TOTAL: {ultimaVenta.total} Bs.
        </div>
        <p className="text-center text-[9px] mt-8 uppercase">*** Gracias por su compra ***</p>
      </div>

      {/* --- INTERFAZ NORMAL (Visible en pantalla, se oculta al imprimir) --- */}
      <div className="print:hidden">
        <Link href="/" className="text-indigo-600 font-bold text-sm">← Volver al Panel</Link>
        <h1 className="text-3xl sm:text-4xl font-black my-6 tracking-tighter">REGISTRAR VENTA 💰</h1>

        <form onSubmit={registrarVenta} className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100 space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Producto a Vender</label>
            <select
              className="w-full p-4 border border-gray-200 rounded-xl mt-1 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium text-sm"
              value={seleccionado}
              onChange={(e) => setSeleccionado(e.target.value)}
              required
            >
              <option value="">Selecciona un producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — Stock: {p.stock} | {p.precio} Bs.
                </option>
              ))}
            </select>
          </div>

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

          {productoActual && (
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-xs font-black text-green-600 uppercase mb-2">Resumen</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Total ({cantidad} x {productoActual.precio} Bs.)</span>
                <span className="text-2xl font-black text-green-700">{productoActual.precio * cantidad} Bs.</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando || !seleccionado}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-black shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
          >
            {cargando ? "PROCESANDO..." : "FINALIZAR E IMPRIMIR"}
          </button>
        </form>
      </div>
    </main>
  );
}