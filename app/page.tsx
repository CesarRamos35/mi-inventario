import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">SISTEMA DE GESTIÓN CRB</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Tarjeta Inventario */}
        <Link href="/inventario" className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-blue-500 group">
          <h2 className="text-2xl font-semibold group-hover:text-blue-500">📦 Inventario</h2>
          <p className="text-gray-500 mt-2">Gestiona productos, stock y precios en tiempo real.</p>
        </Link>

        {/* Tarjeta Gráficas (Próximamente) */}
        <div className="p-8 bg-gray-100 rounded-xl border-l-4 border-gray-300 opacity-60 cursor-not-allowed">
          <h2 className="text-2xl font-semibold">📊 Reportes y Gráficas</h2>
          <p className="text-gray-500 mt-2">Análisis visual de ventas y existencias.</p>
        </div>

        {/* Tarjeta Historial (Próximamente) */}
        <div className="p-8 bg-gray-100 rounded-xl border-l-4 border-gray-300 opacity-60 cursor-not-allowed">
          <h2 className="text-2xl font-semibold">📜 Historial</h2>
          <p className="text-gray-500 mt-2">Registro de movimientos y auditoría.</p>
        </div>
      </div>
    </main>
  );
}