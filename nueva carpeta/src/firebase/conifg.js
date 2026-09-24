import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <--- TE FALTABA ESTA LÍNEA

const firebaseConfig = {
  apiKey: "AIzaSyBnMV9iUEwUYdMhC6JHNDtUNp1pGxGkmq8",
  authDomain: "prueba-29000.firebaseapp.com",
  projectId: "prueba-29000",
  storageBucket: "prueba-29000.firebasestorage.app",
  messagingSenderId: "6824932303",
  appId: "1:6824932303:web:91b75a472ba5cba1dcd8ba",
  measurementId: "G-E58T0PWJBF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar las herramientas para usarlas en Registro.jsx y Login.jsx
export const db = getFirestore(app); // Exportamos la base de datos para usarla en el registro, creación de donaciones, etc.
export const auth = getAuth(app); // Exportamos la autenticación para usarla en el registro y login