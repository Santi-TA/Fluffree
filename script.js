// script.js
import { auth } from './firebase-init.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.getElementById('registerBtn').addEventListener('click', () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert("Registro exitoso");
      window.location.href = "reservas.html";
    })
    .catch((error) => {
      let errorMessage  = "";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage  = "Este correo ya está registrado. Debes iniciar sesión.";
          break;
        case "auth/weak-password":
          errorMessage  = "La contraseña debe tener al menos 6 caracteres.";
          break;
        case "auth/missing-password":
          errorMessage  = "Por favor, introduce una contraseña.";
          break;
        default:
          errorMessage  = "Ocurrió un error inesperado. Inténtalo de nuevo.";
          console.error("Error: ", error.message);
          break;
      }
        alert(errorMessage);    });
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      window.location.href = "reservas.html";
    })
    .catch((error) => {
      let errorMessage  = "";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage  = "El correo electrónico o la contraseña no es válido.";
          break;
        case "auth/invalid-credential":
          errorMessage  = "El correo electrónico o la contraseña no es válido.";
          break;
        case "auth/missing-password":
          errorMessage  = "Por favor, introduce una contraseña.";
          break;
        default:
          errorMessage  = "Ocurrió un error inesperado. Inténtalo de nuevo.";
          console.error("Error: ", error.message);
          break;
      }
        alert(errorMessage);    });
});


document.getElementById('togglePassword').addEventListener('click', () => {
  const passwordInput = document.getElementById('password');
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
});


document.getElementById('resetPasswordBtn').addEventListener('click', () => {
  const email = document.getElementById("email").value;
  if (!email) {
    alert("Por favor, introduce tu correo para restablecer la contraseña.");
    return;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("Se ha enviado un correo para restablecer tu contraseña.");
    })
    .catch((error) => {
      console.error("Error al enviar el correo:", error.message);
      alert("Ocurrió un error. Verifica el correo introducido.");
    });
});
