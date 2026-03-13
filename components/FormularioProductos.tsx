'use client' // Esto le dice a Next.js que este componente tiene interactividad

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function FormularioProducto() {
  const [nombre, setNombre] = useState('')
  const [stock, setStock] = useState(0)
  const [precio, setPrecio] = useState(0)
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const guardarProducto = async (e: React.FormEvent) => {
  e.preventDefault()
  setCargando(true)

  const { error } = await supabase
    .from('Productos')
    .insert([{ nombre, stock, precio }])

  setCargando(false)
  
  if (error) {
    toast.error("No se pudo guardar el producto") // Notificación de error roja
  } else {
    // ¡Aquí está la magia!
    toast.success(`¡${nombre} agregado con éxito!`) 
    
    setNombre('')
    setStock(0)
    setPrecio(0)
    router.refresh()
  }
}

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
      <button 
        type="submit" 
        disabled={cargando}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {cargando ? 'Guardando...' : 'Agregar Producto'}
      </button>
    </form>
  )
}