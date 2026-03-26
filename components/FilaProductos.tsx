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
  const [subiendo, setSubiendo] = useState(false); 
  
  const [nombre, setNombre] = useState(prod.nombre);
  const [stock, setStock] = useState(prod.stock);
  const [precio, setPrecio] = useState(prod.precio);
  const [proveedorId, setProveedorId] = useState(prod.proveedor_id);
  const [nuevaImagen, setNuevaImagen] = useState<File | null>(null);

  const manejarGuardar = async () => {
    setSubiendo(true);
    try {
      let urlImagen = prod.imagen_url;

      if (nuevaImagen) {
        const fileExt = nuevaImagen.name.split('.').pop();
        // Usamos Date.now() para asegurar nombres únicos y evitar colisiones
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; 

        // Cambiado de 'imagenes-productos' a 'productos'
        const { error: uploadError } = await supabase.storage
          .from('productos') 
          .upload(filePath, nuevaImagen);

        if (uploadError) throw new Error("Error al subir la imagen al bucket 'productos'");

        const { data: urlData } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);
        
        urlImagen = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('Productos')
        .update({ 
          nombre, 
          stock, 
          precio, 
          proveedor_id: proveedorId === "" ? null : proveedorId,
          imagen_url: urlImagen 
        })
        .eq('id', prod.id);

      if (error) throw error;

      toast.success("Producto actualizado correctamente");
      setEditando(false);
      setNuevaImagen(null);
      onActualizar(); 
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-2">
          {prod.imagen_url ? (
            <img src={prod.imagen_url} alt={prod.nombre} className="w-10 h-10 object-cover rounded-lg mx-auto border border-gray-200" />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto flex items-center justify-center text-[10px] text-gray-400 uppercase font-black">N/A</div>
          )}
          
          {editando && (
            <label className="cursor-pointer">
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-black uppercase hover:bg-indigo-100 transition-colors">
                {nuevaImagen ? "Listo ✓" : "Cambiar"}
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => setNuevaImagen(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        {editando ? (
          <input 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            className="border-2 border-indigo-100 p-1 rounded-xl w-full text-black bg-white focus:border-indigo-500 outline-none text-sm font-bold" 
          />
        ) : (
          <div className="font-bold text-gray-900">{prod.nombre}</div>
        )}
      </td>

      <td className="px-6 py-4 text-sm">
        {editando ? (
          <select
            value={proveedorId || ""}
            onChange={(e) => setProveedorId(e.target.value)}
            className="border-2 border-indigo-100 p-1 rounded-xl w-full text-black bg-white text-xs font-bold outline-none focus:border-indigo-500"
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((prov) => (
              <option key={prov.id} value={prov.id}>{prov.nombre}</option>
            ))}
          </select>
        ) : (
          <span className="text-gray-500 font-medium">
            {prod.proveedores?.nombre || 'Sin proveedor'}
          </span>
        )}
      </td>

      <td className="px-6 py-4 text-center">
        {editando ? (
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(Number(e.target.value))} 
            className="border-2 border-indigo-100 p-1 rounded-xl w-16 text-center text-black bg-white font-bold outline-none" 
          />
        ) : (
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${prod.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {prod.stock} Unid.
          </span>
        )}
      </td>

      <td className="px-6 py-4 text-center font-black text-gray-900">
        {editando ? (
          <input 
            type="number" 
            value={precio} 
            onChange={(e) => setPrecio(Number(e.target.value))} 
            className="border-2 border-indigo-100 p-1 rounded-xl w-20 text-center text-black bg-white font-bold outline-none" 
          />
        ) : (
          `${prod.precio} Bs.`
        )}
      </td>

      <td className="px-6 py-4 text-right">
        {esAdmin && (
          <div className="flex justify-end gap-2">
            {editando ? (
              <>
                <button 
                  onClick={manejarGuardar} 
                  disabled={subiendo}
                  className="text-white bg-indigo-600 hover:bg-indigo-700 font-black text-[10px] uppercase px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  {subiendo ? "Subiendo..." : "Guardar"}
                </button>
                <button 
                  onClick={() => {
                    setEditando(false);
                    setNuevaImagen(null);
                    setNombre(prod.nombre);
                    setStock(prod.stock);
                    setPrecio(prod.precio);
                    setProveedorId(prod.proveedor_id);
                  }} 
                  className="text-gray-400 hover:text-gray-600 font-black text-[10px] uppercase px-4 py-2"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <div className="flex gap-4">
                <button onClick={() => setEditando(true)} className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest">
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