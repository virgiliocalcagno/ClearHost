/**
 * ClearHost Staff — Servicio de Notificaciones Push.
 * Solo para plataformas nativas (iOS/Android).
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { actualizarFCMToken } from './api';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registrar el dispositivo para push notifications y enviar el token al backend.
 */
export async function registerForPushNotifications(staffId) {
  if (!Device.isDevice) {
    console.log('Push notifications requieren un dispositivo físico');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permisos de notificación denegados');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    const token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ClearHost',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00BFA6',
      });
    }

    if (staffId) {
      await actualizarFCMToken(staffId, token);
    }

    console.log('Push token registrado:', token);
    return token;
  } catch (error) {
    console.error('Error registrando push token:', error);
    return null;
  }
}

/**
 * Listener para cuando se recibe una notificación.
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listener para cuando el usuario toca una notificación.
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
