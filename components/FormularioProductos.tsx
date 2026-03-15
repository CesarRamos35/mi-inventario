'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function FormularioProducto() {
  const [nombre, setNombre] = useState('')
  const [stock, setStock] = useState(0)
  const [precio, setPrecio] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const router = useRouter()

  const subirImagen = async (archivo: File) => {
    // 1. Limpiamos el nombre: quitamos espacios y caracteres especiales como la 'ñ'
    const nombreLimpio = archivo.name
      .toLowerCase()
      .replace(/\s+/g, '-')     // Cambia espacios por guiones
      .replace(/[^a-z0-9.-]/g, ''); // Quita todo lo que no sea letra, número, punto o guion

    const nombreArchivo = `${Date.now()}_${nombreLimpio}`;

    const { data, error } = await supabase.storage
      .from('productos')
      .upload(nombreArchivo, archivo);

    if (error) {
      console.error("Error subiendo imagen:", error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('productos')
      .getPublicUrl(nombreArchivo);

    return publicUrl;
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      let urlFinal = "";
      if (imagenArchivo) {
        urlFinal = await subirImagen(imagenArchivo) || "";
      }

      const { error } = await supabase
        .from('Productos')
        .insert([{
          nombre,
          stock,
          precio,
          imagen_url: urlFinal
        }]);

      if (error) throw error;

      toast.success(`¡${nombre} agregado con éxito!`);

      // --- LIMPIEZA CORREGIDA AQUÍ ---
      setNombre('');
      setStock(0);
      setPrecio(0);
      setImagenArchivo(null); // Reseteamos el estado del archivo

      // Usamos el target del evento para resetear todo el formulario de golpe
      (e.target as HTMLFormElement).reset();
      // -------------------------------

      router.refresh();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={guardarProducto} className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Stock</label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Precio</label>
        <input
          type="number"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Imagen del producto</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImagenArchivo(e.target.files ? e.target.files[0] : null)}
          className="text-sm border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={cargando}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors md:col-span-4 mt-2"
      >
        {cargando ? 'Guardando e integrando imagen...' : 'Agregar Producto'}
      </button>
    </form>
  )
}