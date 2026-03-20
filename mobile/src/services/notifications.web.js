/**
 * ClearHost Staff — Notificaciones Push (Web Stub).
 * En web, push notifications no están disponibles.
 */

export async function registerForPushNotifications(staffId) {
  console.log('Push notifications no disponibles en web');
  return null;
}

export function addNotificationReceivedListener(callback) {
  return { remove: () => {} };
}

export function addNotificationResponseListener(callback) {
  return { remove: () => {} };
}
