'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// 1. DEFINIMOS LA PROP EXACTA (Quitamos el ? para que sea obligatoria y evitar errores de tipado)
interface FormularioProps {
  onActualizar: () => void;
}

export default function FormularioProducto({ onActualizar }: FormularioProps) {
  // --- ESTADOS DEL PRODUCTO ---
  const [nombre, setNombre] = useState('')
  const [stock, setStock] = useState(0)
  const [precio, setPrecio] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const router = useRouter()

  // --- ESTADOS DE PROVEEDORES ---
  const [proveedores, setProveedores] = useState<any[]>([])
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")

  // --- CARGAR LISTA DE PROVEEDORES ---
  useEffect(() => {
    const cargarProvs = async () => {
      const { data } = await supabase
        .from('proveedores')
        .select('id, nombre')
        .order('nombre');
      setProveedores(data || []);
    };
    cargarProvs();
  }, []);

  // --- LÓGICA PARA SUBIR IMAGEN ---
  const subirImagen = async (archivo: File) => {
    try {
      const nombreLimpio = archivo.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9.-]/g, '');

      const nombreArchivo = `${Date.now()}_${nombreLimpio}`;

      const { data, error } = await supabase.storage
        .from('productos')
        .upload(nombreArchivo, archivo);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(nombreArchivo);

      return publicUrl;
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      return null;
    }
  };

  // --- GUARDAR PRODUCTO ---
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
          imagen_url: urlFinal,
          proveedor_id: proveedorSeleccionado === "" ? null : proveedorSeleccionado
        }]);

      if (error) throw error;

      toast.success(`¡${nombre} agregado con éxito!`);

      // LIMPIAR FORMULARIO
      setNombre('');
      setStock(0);
      setPrecio(0);
      setProveedorSeleccionado("");
      setImagenArchivo(null);

      // Resetear el input de file manualmente
      const form = e.target as HTMLFormElement;
      form.reset();

      // LLAMAR AL REFRESCO DE LA TABLA
      onActualizar();

      router.refresh();

    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={guardarProducto} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 block w-full border border-gray-200 rounded-xl p-3 text-black bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="Ej: Corona 330ml"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock Inicial</label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-200 rounded-xl p-3 text-black bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Venta</label>
        <input
          type="number"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-200 rounded-xl p-3 text-black bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Proveedor Asignado</label>
        <select
          value={proveedorSeleccionado}
          onChange={(e) => setProveedorSeleccionado(e.target.value)}
          className="mt-1 block w-full border border-gray-200 rounded-xl p-3 text-black bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
        >
          <option value="">Sin proveedor</option>
          {proveedores.map(prov => (
            <option key={prov.id} value={prov.id}>{prov.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImagenArchivo(e.target.files ? e.target.files[0] : null)}
          className="text-xs border border-gray-200 rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-black"
        />
      </div>

      <button
        type="submit"
        disabled={cargando}
        className="bg-indigo-600 text-white px-6 py-4 rounded-xl font-black hover:bg-indigo-700 disabled:bg-gray-400 transition-all shadow-lg lg:col-span-5 mt-2 uppercase tracking-widest text-sm"
      >
        {cargando ? 'Guardando...' : 'Confirmar Registro de Producto'}
      </button>
    </form>
  )
}