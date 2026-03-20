/**
 * ClearHost Staff — App Entry Point.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './src/services/notifications';

export default function App() {
  useEffect(() => {
    // Listeners de notificaciones push
    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log('Notificación recibida:', notification);
    });

    const responseSub = addNotificationResponseListener((response) => {
      console.log('Notificación tocada:', response);
      // Aquí se podría navegar a la tarea correspondiente
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />
      <AppNavigator />
    </>
  );
}
