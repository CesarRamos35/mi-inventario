export default function Recibo({ venta }: { venta: any }) {
  return (
    <div id="seccion-recibo" className="hidden print:block p-8 text-black bg-white w-[80mm]">
      <div className="text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold">SISTEMA CRB</h2>
        <p className="text-xs">Soluciones Informáticas</p>
        <p className="text-[10px]">Tarija - Bolivia</p>
      </div>
      
      <div className="text-[10px] mb-4">
        <p><strong>Fecha:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Cliente:</strong> {venta.cliente || 'Público General'}</p>
      </div>

      <table className="w-full text-[10px] mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left">Cant.</th>
            <th className="text-left">Producto</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {venta.productos.map((p: any) => (
            <tr key={p.id}>
              <td>{p.cantidad}</td>
              <td>{p.nombre}</td>
              <td className="text-right">{p.subtotal} Bs.</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right font-bold text-lg border-t pt-2">
        TOTAL: {venta.total} Bs.
      </div>
      
      <p className="text-center text-[8px] mt-6 italic">
        *** Gracias por su preferencia ***
      </p>
    </div>
  );
}