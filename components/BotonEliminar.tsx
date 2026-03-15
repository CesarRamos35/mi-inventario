'use client'

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// 1. Definimos la interfaz clara
interface BotonEliminarProps {
  id: number;
  nombre: string;
  onActualizar: () => void; 
}

export default function BotonEliminar({ id, nombre, onActualizar }: BotonEliminarProps) {
  
  const manejarEliminar = async () => {
    // Confirmación
    const confirmado = confirm(`¿Eliminar "${nombre}"?`)
    if (!confirmado) return

    try {
      const { error } = await supabase
        .from('Productos')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("Eliminado correctamente")
      
      // 2. Ejecutar el refresco que viene del padre
      onActualizar();
      
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message)
    }
  }

  return (
    <button 
      onClick={manejarEliminar}
      className="text-red-600 hover:text-red-800 font-medium transition-colors cursor-pointer"
    >
      Eliminar
    </button>
  )
}