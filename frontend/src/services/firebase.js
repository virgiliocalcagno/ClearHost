import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuración idéntica a la App móvil
const firebaseConfig = {
  apiKey: "AIzaSyBWy6yTsByw_nC1UQIZrUaOfT8lHkZTe0g",
  authDomain: "clearhost-c8919.firebaseapp.com",
  databaseURL: "https://clearhost-c8919-default-rtdb.firebaseio.com/",
  projectId: "clearhost-c8919",
  storageBucket: "clearhost-c8919.firebasestorage.app",
  messagingSenderId: "986952569979",
  appId: "1:986952569979:android:956180c97039c80f8cbede"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
