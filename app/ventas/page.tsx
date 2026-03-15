"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PaginaVentas() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [vendedor, setVendedor] = useState("Cargando...");
  const [cargando, setCargando] = useState(false);

  // Estados del Carrito
  const [seleccionado, setSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [cliente, setCliente] = useState("Público General");

  // Estado para el recibo (Ahora acepta lista de productos)
  const [ultimaVenta, setUltimaVenta] = useState<any>({
    productos: [],
    total: 0,
    vendedor: "",
    fecha: "",
    cliente: ""
  });

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }
      setVendedor(session.user.email || "usuario@test.com");

      const { data } = await supabase.from('Productos').select('*').gt('stock', 0).order('nombre');
      setProductos(data || []);
    };
    cargarDatos();
  }, [router]);

  const productoActual = productos.find(p => String(p.id) === seleccionado);

  const agregarAlCarrito = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoActual) return alert("Selecciona un producto");
    if (cantidad <= 0) return alert("Cantidad inválida");
    if (productoActual.stock < cantidad) return alert("Stock insuficiente");

    const existe = carrito.find(item => item.id === productoActual.id);
    if (existe) {
      setCarrito(carrito.map(item => 
        item.id === productoActual.id 
        ? { ...item, cantidad: item.cantidad + cantidad, subtotal: (item.cantidad + cantidad) * item.precio } 
        : item
      ));
    } else {
      setCarrito([...carrito, {
        id: productoActual.id,
        nombre: productoActual.nombre,
        precio: productoActual.precio,
        cantidad: cantidad,
        subtotal: productoActual.precio * cantidad
      }]);
    }
    setSeleccionado("");
    setCantidad(1);
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");
    setCargando(true);

    try {
      const totalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0);

      // 1. INSERTAR EN TABLA VENTAS (Cabecera)
      const { data: ventaPrincipal, error: errorVenta } = await supabase
        .from('ventas')
        .insert([{ 
          usuario_email: vendedor, 
          cliente_nombre: cliente, 
          total: totalVenta 
        }])
        .select()
        .single();

      if (errorVenta) throw errorVenta;

      // 2. INSERTAR EN DETALLE_VENTAS Y ACTUALIZAR STOCK
      for (const item of carrito) {
        await supabase.from('detalle_ventas').insert([{
          venta_id: ventaPrincipal.id,
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          subtotal: item.subtotal
        }]);

        const pOriginal = productos.find(p => p.id === item.id);
        await supabase.from('Productos')
          .update({ stock: pOriginal.stock - item.cantidad })
          .eq('id', item.id);
      }

      // 3. PREPARAR RECIBO
      setUltimaVenta({
        productos: carrito,
        total: totalVenta,
        vendedor: vendedor,
        cliente: cliente,
        fecha: new Date().toLocaleString('es-BO')
      });

      // 4. IMPRESIÓN CON RETRASO PARA MÓVILES
      setTimeout(() => {
        window.print();
        setCarrito([]);
        setCliente("Público General");
        setCargando(false);
        router.refresh(); // Refresca stock de la página
      }, 800);

    } catch (err: any) {
      alert("Error: " + err.message);
      setCargando(false);
    }
  };

  return (
    <main className="p-4 sm:p-10 max-w-5xl mx-auto text-black min-h-screen">
      
      {/* --- SECCIÓN DEL RECIBO (Solo visible al imprimir) --- */}
      <div id="recibo-impresion" className="fixed top-0 left-[-1000px] print:static print:block p-4 text-black font-mono text-[11px] w-[80mm] bg-white">
        <div className="text-center border-b border-dashed pb-2 mb-2">
          <img src="/logo-crb2.png" alt="Logo" className="mx-auto w-16 h-auto mb-1" />
          <h2 className="font-bold text-sm">SISTEMA CRB</h2>
          <p>Tarija - Bolivia</p>
        </div>
        <div className="mb-2">
          <p>Fecha: {ultimaVenta.fecha}</p>
          <p>Cliente: {ultimaVenta.cliente}</p>
          <p>Vendedor: {ultimaVenta.vendedor}</p>
        </div>
        <table className="w-full mb-2 border-t border-dashed pt-2">
          <thead>
            <tr>
              <th className="text-left">Cant.</th>
              <th className="text-left">Prod.</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ultimaVenta.productos.map((item: any, i: number) => (
              <tr key={i}>
                <td>{item.cantidad}</td>
                <td className="truncate max-w-[30mm]">{item.nombre}</td>
                <td className="text-right">{item.subtotal} Bs.</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right font-bold text-sm border-t-2 border-dashed pt-1">
          TOTAL: {ultimaVenta.total} Bs.
        </div>
        <p className="text-center mt-6 uppercase">*** Gracias por su compra ***</p>
      </div>

      {/* --- INTERFAZ DE VENTA (Oculta al imprimir) --- */}
      <div className="print:hidden">
        <Link href="/" className="text-indigo-600 font-bold text-sm">← Volver al Panel</Link>
        <h1 className="text-3xl sm:text-4xl font-black my-6 tracking-tighter uppercase italic">Venta Directa 💰</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Cliente</label>
                <input 
                  type="text" 
                  className="w-full p-4 border border-gray-200 rounded-xl mt-1 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
              </div>

              <form onSubmit={agregarAlCarrito} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Producto</label>
                  <select
                    className="w-full p-4 border border-gray-200 rounded-xl mt-1 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={seleccionado}
                    onChange={(e) => setSeleccionado(e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.stock} disp.)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      className="w-full p-4 border border-gray-200 rounded-xl mt-1 bg-gray-50 font-bold"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                    />
                    <button 
                      type="submit"
                      className="bg-indigo-600 text-white px-6 rounded-xl font-black hover:bg-indigo-700 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Tabla de Items */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4 text-center">Cant.</th>
                    <th className="p-4 text-right">Subtotal</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.length === 0 && (
                    <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">El carrito está vacío</td></tr>
                  )}
                  {carrito.map(item => (
                    <tr key={item.id} className="border-t border-gray-50">
                      <td className="p-4 font-bold text-gray-700">{item.nombre}</td>
                      <td className="p-4 text-center font-medium">{item.cantidad}</td>
                      <td className="p-4 text-right font-black text-indigo-600">{item.subtotal} Bs.</td>
                      <td className="p-4 text-right">
                        <button onClick={() => setCarrito(carrito.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600 font-bold">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha: Resumen de Pago */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl h-fit sticky top-10">
              <h2 className="text-xl font-black mb-6 flex justify-between items-center">
                PAGO 💳
                <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest">Resumen</span>
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400 font-bold text-xs uppercase">
                  <span>Subtotal Items</span>
                  <span>{carrito.length} prod.</span>
                </div>
                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                  <span className="text-gray-400 font-bold uppercase text-xs">Total a Cobrar</span>
                  <span className="text-4xl font-black text-green-400 leading-none">
                    {carrito.reduce((acc, i) => acc + i.subtotal, 0)} <small className="text-sm">Bs.</small>
                  </span>
                </div>
              </div>

              <button 
                onClick={finalizarVenta}
                disabled={cargando || carrito.length === 0}
                className="w-full bg-green-500 hover:bg-green-400 text-black py-5 rounded-2xl font-black shadow-xl shadow-green-500/20 transition-all active:scale-95 disabled:opacity-20 uppercase tracking-widest"
              >
                {cargando ? "PROCESANDO..." : "CONFIRMAR VENTA"}
              </button>

              <p className="text-[9px] text-gray-500 mt-6 text-center leading-relaxed">
                Al confirmar, se descontará el stock automáticamente y se generará la nota de venta.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}