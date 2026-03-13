'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import BotonEliminar from './BotonEliminar'

export default function FilaProducto({ prod, esAdmin }: { prod: any, esAdmin: boolean }) {  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(prod.nombre)
  const [stock, setStock] = useState(prod.stock)
  const [precio, setPrecio] = useState(prod.precio)
  const router = useRouter()

  const guardarCambios = async () => {
    const { error } = await supabase
      .from('Productos')
      .update({ nombre, stock, precio })
      .eq('id', prod.id)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      toast.success("Producto actualizado")
      setEditando(false)
      router.refresh()
    }
  }

  if (editando) {
    return (
      <tr className="border-b border-gray-200 bg-blue-50">
        <td className="px-5 py-4"><input className="border p-1 rounded w-full text-black" value={nombre} onChange={e => setNombre(e.target.value)} /></td>
        <td className="px-5 py-4"><input type="number" className="border p-1 rounded w-full text-black" value={stock} onChange={e => setStock(Number(e.target.value))} /></td>
        <td className="px-5 py-4"><input type="number" className="border p-1 rounded w-full text-black" value={precio} onChange={e => setPrecio(Number(e.target.value))} /></td>
        <td className="px-5 py-4 text-right space-x-2">
          <button onClick={guardarCambios} className="text-green-600 font-bold">Guardar</button>
          <button onClick={() => setEditando(false)} className="text-gray-500">Cancelar</button>
        </td>
      </tr>
    )
  }

 return (
    <tr className="border-b border-gray-200">
      <td className="px-5 py-5 text-sm">{prod.nombre}</td>
      <td className="px-5 py-5 text-sm">{prod.stock}</td>
      <td className="px-5 py-5 text-sm">${prod.precio}</td>
      
      {/* 2. Renderizado condicional de acciones */}
      <td className="px-5 py-5 text-right text-sm space-x-4">
        {esAdmin ? (
          <>
            <button onClick={() => setEditando(true)} className="text-blue-600 font-medium">Editar</button>
            <BotonEliminar id={prod.id} nombre={prod.nombre} />
          </>
        ) : (
          <span className="text-gray-400 italic font-light">Solo lectura</span>
        )}
      </td>
    </tr>
  )
}