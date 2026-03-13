'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'

export default function BotonEliminar({ id, nombre }: { id: number, nombre: string }) {
  const [eliminando, setEliminando] = useState(false)
  const router = useRouter()

  const eliminar = async () => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"?`)) return

    setEliminando(true)
    const { error } = await supabase
      .from('Productos')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Producto eliminado")
      router.refresh()
    }
    setEliminando(false)
  }

  return (
    <button 
      onClick={eliminar}
      disabled={eliminando}
      className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
    >
      {eliminando ? '...' : 'Eliminar'}
    </button>
  )
}