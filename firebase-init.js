// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAcNsKVHM-L2aXsIG8YVdMOMfyRZs_lG_8",
  authDomain: "reserva-canina.firebaseapp.com",
  databaseURL: "https://reserva-canina-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "reserva-canina",
  storageBucket: "reserva-canina.firebasestorage.app",
  messagingSenderId: "428071323887",
  appId: "1:428071323887:web:2a03d83e7380e9f66a331a",
  measurementId: "G-ZWLBZKJZYY"

};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar para usar en otros archivos
export { auth, db };
