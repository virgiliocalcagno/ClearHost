import { useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../services/firebase';

/**
 * Hook para escuchar cambios globales o específicos en el Admin Panel.
 */
export const useRealtimeSync = (onSync, staffId = null) => {
  useEffect(() => {
    const refs = [];
    
    // Escuchar cambios globales (ej: nuevas incidencias, tareas completadas)
    const globalSyncRef = ref(database, 'sync/global');
    refs.push(globalSyncRef);

    // Opcional: escuchar cambios de un staff específico si se proporciona
    let staffSyncRef = null;
    if (staffId) {
      staffSyncRef = ref(database, `sync/${staffId}`);
      refs.push(staffSyncRef);
    }

    const handleUpdate = (snapshot) => {
      const data = snapshot.val();
      if (data && onSync) {
        onSync(data);
      }
    };

    onValue(globalSyncRef, handleUpdate);
    if (staffSyncRef) {
      onValue(staffSyncRef, handleUpdate);
    }

    return () => {
      refs.forEach(r => off(r));
    };
  }, [onSync, staffId]);
};
