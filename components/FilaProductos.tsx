'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import BotonEliminar from './BotonEliminar'

export default function FilaProducto({ prod, esAdmin }: { prod: any, esAdmin: boolean }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(prod.nombre)
  const [stock, setStock] = useState(prod.stock)
  const [precio, setPrecio] = useState(prod.precio)
  
  // --- NUEVOS ESTADOS PARA LA IMAGEN ---
  const [imagenUrlActual, setImagenUrlActual] = useState(prod.imagen_url) // Mostramos la que ya tiene
  const [nuevaImagenArchivo, setNuevaImagenArchivo] = useState<File | null>(null) // Guardamos la nueva si la elige
  const [subiendoImagen, setSubiendoImagen] = useState(false) // Estado de carga específico para la foto
  // -------------------------------------

  const router = useRouter()

  // --- FUNCIÓN DE SUBIDA ADAPTADA PARA EDICIÓN ---
  const subirNuevaImagen = async (archivo: File) => {
    setSubiendoImagen(true)
    const nombreLimpio = archivo.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.-]/g, '');
    const nombreArchivo = `${Date.now()}_${nombreLimpio}`;
    
    // 1. Subimos la nueva foto
    const { data, error } = await supabase.storage
      .from('productos')
      .upload(nombreArchivo, archivo);

    if (error) {
      console.error("Error subiendo imagen:", error.message);
      setSubiendoImagen(false)
      return null;
    }

    // 2. Opcional: Borrar la imagen anterior para no llenar el storage (avanzado)
    // if (imagenUrlActual) {
    //   const rutaAnterior = imagenUrlActual.split('/').pop(); // Obtenemos el nombre del archivo de la URL
    //   await supabase.storage.from('productos').remove([rutaAnterior]);
    // }

    const { data: { publicUrl } } = supabase.storage
      .from('productos')
      .getPublicUrl(nombreArchivo);

    setSubiendoImagen(false)
    return publicUrl;
  };

  const guardarCambios = async () => {
    let urlFinal = imagenUrlActual; // Por defecto, mantenemos la imagen actual

    // --- LÓGICA DE ACTUALIZACIÓN DE IMAGEN ---
    if (nuevaImagenArchivo) {
      const urlSubida = await subirNuevaImagen(nuevaImagenArchivo);
      if (urlSubida) {
        urlFinal = urlSubida; // Si se subió una nueva, usamos esa URL
      } else {
        toast.error("Error al subir la nueva imagen. Los cambios de texto se guardarán.");
        // Decidimos si paramos o seguimos. Aquí seguiremos solo con el texto.
      }
    }
    // ----------------------------------------

    const { error } = await supabase
      .from('Productos')
      .update({ 
        nombre, 
        stock, 
        precio,
        imagen_url: urlFinal // Guardamos la URL final (vieja o nueva)
      })
      .eq('id', prod.id)

    if (error) {
      toast.error("Error al actualizar: " + error.message)
    } else {
      toast.success("Producto actualizado con éxito")
      setEditando(false)
      setImagenUrlActual(urlFinal) // Actualizamos la URL en pantalla
      setNuevaImagenArchivo(null) // Limpiamos el archivo temporal
      router.refresh()
    }
  }

  // --- MODO EDICIÓN ACTUALIZADO ---
  if (editando) {
    return (
      <tr className="border-b border-gray-200 bg-blue-50">
        {/* Celda de imagen editable */}
        <td className="px-5 py-4 text-center">
           <div className="flex flex-col items-center gap-2">
             {/* Mostramos la imagen actual o la nueva previsualizada */}
             <img 
               src={nuevaImagenArchivo ? URL.createObjectURL(nuevaImagenArchivo) : imagenUrlActual || '/placeholder-image.png'} 
               alt="Previsualización" 
               className="w-12 h-12 object-cover rounded-lg border border-gray-300 shadow-sm"
             />
             
             {/* Input de tipo file oculto y botón estilizado */}
             <label className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">
               Cambiar foto
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={e => setNuevaImagenArchivo(e.target.files ? e.target.files[0] : null)}
                 className="hidden" // Ocultamos el input feo por defecto
               />
             </label>
             
             {nuevaImagenArchivo && (
               <span className="text-[9px] text-gray-500 truncate w-16 text-center">{nuevaImagenArchivo.name}</span>
             )}
           </div>
        </td>
        
        <td className="px-5 py-4"><input className="border p-1 rounded w-full text-black text-sm" value={nombre} onChange={e => setNombre(e.target.value)} /></td>
        <td className="px-5 py-4"><input type="number" className="border p-1 rounded w-full text-black text-sm" value={stock} onChange={e => setStock(Number(e.target.value))} /></td>
        <td className="px-5 py-4"><input type="number" className="border p-1 rounded w-full text-black text-sm" value={precio} onChange={e => setPrecio(Number(e.target.value))} /></td>
        
        <td className="px-5 py-4 text-right space-x-2">
          <button 
            onClick={guardarCambios} 
            className="text-green-600 font-bold text-sm disabled:text-gray-400"
            disabled={subiendoImagen} // Deshabilitamos mientras sube la foto
          >
            {subiendoImagen ? 'Subiendo...' : 'Guardar'}
          </button>
          <button 
            onClick={() => {
              setEditando(false)
              setNuevaImagenArchivo(null) // Cancelamos la nueva imagen
            }} 
            className="text-gray-500 text-sm"
            disabled={subiendoImagen}
          >
            Cancelar
          </button>
        </td>
      </tr>
    )
  }

  // --- MODO LECTURA (Sin cambios) ---
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3 text-center">
        {prod.imagen_url ? (
          <img 
            src={prod.imagen_url} 
            alt={prod.nombre} 
            className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-200 mx-auto"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300">
            N/A
          </div>
        )}
      </td>

      <td className="px-5 py-5 text-sm font-medium text-gray-700">{prod.nombre}</td>
      <td className="px-5 py-5 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${prod.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
          {prod.stock} uds
        </span>
      </td>
      <td className="px-5 py-5 text-sm font-semibold text-gray-900">${prod.precio.toLocaleString()}</td>

      <td className="px-5 py-5 text-right text-sm space-x-4">
        {esAdmin ? (
          <>
            <button onClick={() => setEditando(true)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
            <BotonEliminar id={prod.id} nombre={prod.nombre} />
          </>
        ) : (
          <span className="text-gray-400 italic font-light">Solo lectura</span>
        )}
      </td>
    </tr>
  )
}