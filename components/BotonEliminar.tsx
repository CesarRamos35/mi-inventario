'use client'

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface BotonEliminarProps {
  id: number;
  nombre: string;
  onActualizar: () => void; 
}

export default function BotonEliminar({ id, nombre, onActualizar }: BotonEliminarProps) {
  
  const manejarDesactivar = async () => {
    const confirmado = confirm(`¿Estás seguro de que deseas quitar "${nombre}" del inventario activo?`);
    
    if (!confirmado) return;

    try {
      // 1. Obtenemos el usuario actual para el historial
      const { data: { session } } = await supabase.auth.getSession();
      const usuarioEmail = session?.user?.email || "sistema@negocio.com";

      // 2. Actualizamos el estado a 'activos: false'
      const { error: updateError } = await supabase
        .from('Productos')
        .update({ activos: false }) 
        .eq('id', id);

      if (updateError) throw updateError;

      // 3. INSERTAMOS EL LOG MANUALMENTE
      // Esto asegura que en el Libro de Auditoría aparezca como corresponde
      const { error: logError } = await supabase
        .from('Historial')
        .insert([{
          producto_nombre: nombre,
          accion: 'ELIMINACIÓN', // Forzamos la etiqueta aquí
          detalles: `Producto Eliminado del Inventario`,
          usuario_email: usuarioEmail,
          fecha: new Date().toISOString()
        }]);

      if (logError) console.error("Error al guardar historial:", logError);

      toast.success("Producto retirado del inventario");
      
      // 4. Refrescamos la tabla
      onActualizar();
      
    } catch (error: any) {
      toast.error("Error al retirar: " + error.message);
    }
  }

  return (
    <button 
      onClick={manejarDesactivar}
      className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
    >
      Eliminar
    </button>
  )
}