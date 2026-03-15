'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'

export default function BotonEliminar({ id, nombre }: { id: number, nombre: string }) {
  const [eliminando, setEliminando] = useState(false)
  const router = useRouter()

  const eliminarProducto = async () => {
  const confirmar = confirm(`¿Estás seguro de eliminar ${nombre}?`);
  if (!confirmar) return;

  try {
    const { error } = await supabase
      .from('Productos')
      .delete()
      .eq('id', id);

    if (error) {
      // ESTO NOS DIRÁ EL ERROR REAL EN UN TOAST
      toast.error(`Error de Supabase: ${error.message}`);
      console.error("Detalle completo:", error);
      return;
    }

    toast.success("Producto eliminado");
  } catch (error: any) {
    toast.error("Error de conexión: " + error.message);
  }
};

  return (
    <button
      onClick={eliminarProducto}
      disabled={eliminando}
      className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
    >
      {eliminando ? '...' : 'Eliminar'}
    </button>
  )
}