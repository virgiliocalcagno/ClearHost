import { useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../services/firebase';

/**
 * Hook para escuchar cambios en tiempo real desde Firebase RTDB.
 * @param {string} staffId - ID del miembro del staff actual.
 * @param {function} onSync - Callback a ejecutar cuando se detecta un cambio.
 */
export const useRealtimeSync = (staffId, onSync) => {
  useEffect(() => {
    if (!staffId) return;

    console.log(`[Sync] Iniciando listener para staff: ${staffId}`);

    // Referencia al nodo de sincronización del staff
    const staffSyncRef = ref(database, `sync/${staffId}`);
    
    // Referencia al nodo global (ej: para nuevas tareas sin asignar)
    const globalSyncRef = ref(database, `sync/global`);

    const handleUpdate = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log(`[Sync] Cambio detectado:`, data);
        if (onSync) onSync(data);
      }
    };

    onValue(staffSyncRef, handleUpdate);
    onValue(globalSyncRef, handleUpdate);

    return () => {
      console.log(`[Sync] Deteniendo listeners`);
      off(staffSyncRef);
      off(globalSyncRef);
    };
  }, [staffId, onSync]);
};
