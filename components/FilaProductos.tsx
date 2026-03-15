'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import BotonEliminar from './BotonEliminar'

interface FilaProductoProps {
  prod: any;
  esAdmin: boolean;
  proveedores: any[];
  onActualizar: () => void;
}

export default function FilaProducto({ prod, esAdmin, proveedores, onActualizar }: FilaProductoProps) {
  const [editando, setEditando] = useState(false);
  
  // Estados para la edición
  const [nombre, setNombre] = useState(prod.nombre);
  const [stock, setStock] = useState(prod.stock);
  const [precio, setPrecio] = useState(prod.precio);
  const [proveedorId, setProveedorId] = useState(prod.proveedor_id); // <--- Estado para el proveedor

  const manejarGuardar = async () => {
    try {
      const { error } = await supabase
        .from('Productos')
        .update({ 
          nombre, 
          stock, 
          precio, 
          proveedor_id: proveedorId === "" ? null : proveedorId // Actualizamos el proveedor en la DB
        })
        .eq('id', prod.id);

      if (error) throw error;

      toast.success("Producto actualizado");
      setEditando(false);
      onActualizar(); 
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      {/* IMAGEN */}
      <td className="px-6 py-4 text-center">
        {prod.imagen_url ? (
          <img src={prod.imagen_url} alt={prod.nombre} className="w-10 h-10 object-cover rounded-lg mx-auto" />
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto flex items-center justify-center text-[10px] text-gray-400">N/A</div>
        )}
      </td>

      {/* NOMBRE */}
      <td className="px-6 py-4">
        {editando ? (
          <input 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            className="border p-1 rounded w-full text-black bg-white" 
          />
        ) : (
          <div className="font-medium text-gray-900">{prod.nombre}</div>
        )}
      </td>

      {/* PROVEEDOR (EDITABLE) */}
      <td className="px-6 py-4 text-sm">
        {editando ? (
          <select
            value={proveedorId || ""}
            onChange={(e) => setProveedorId(e.target.value)}
            className="border p-1 rounded w-full text-black bg-white text-xs"
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.nombre}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-gray-500">
            {prod.proveedores?.nombre || 'Sin proveedor'}
          </span>
        )}
      </td>

      {/* STOCK */}
      <td className="px-6 py-4 text-center">
        {editando ? (
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(Number(e.target.value))} 
            className="border p-1 rounded w-16 text-center text-black bg-white" 
          />
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${prod.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {prod.stock} u.
          </span>
        )}
      </td>

      {/* PRECIO */}
      <td className="px-6 py-4 text-center font-bold text-gray-700">
        {editando ? (
          <input 
            type="number" 
            value={precio} 
            onChange={(e) => setPrecio(Number(e.target.value))} 
            className="border p-1 rounded w-20 text-center text-black bg-white" 
          />
        ) : (
          `$${prod.precio}`
        )}
      </td>

      {/* ACCIONES */}
      <td className="px-6 py-4 text-right">
        {esAdmin && (
          <div className="flex justify-end gap-2">
            {editando ? (
              <>
                <button 
                  onClick={manejarGuardar} 
                  className="text-green-600 hover:text-green-800 font-bold text-xs uppercase bg-green-50 px-3 py-1 rounded-lg"
                >
                  Guardar
                </button>
                <button 
                  onClick={() => {
                    setEditando(false);
                    setNombre(prod.nombre);
                    setStock(prod.stock);
                    setPrecio(prod.precio);
                    setProveedorId(prod.proveedor_id); // Resetear proveedor al cancelar
                  }} 
                  className="text-gray-500 hover:text-gray-700 font-bold text-xs uppercase bg-gray-50 px-3 py-1 rounded-lg"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditando(true)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase">
                  Editar
                </button>
                <BotonEliminar id={prod.id} nombre={prod.nombre} onActualizar={onActualizar} />
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}