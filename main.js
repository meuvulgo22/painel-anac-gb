import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyCuPyJWr0aDNQ7vUiQ2JxzqNpBxZXozoQg",
  authDomain: "painel-anac-gb.firebaseapp.com",
  projectId: "painel-anac-gb",
  storageBucket: "painel-anac-gb.appspot.com",
  messagingSenderId: "941890806312",
  appId: "1:941890806312:web:323f01daf1f9ddcf1a0b1d",
  measurementId: "G-HG4KDJBP3G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ================= ELEMENTOS =================
const loginDiv = document.getElementById("login");
const cadastroDiv = document.getElementById("cadastro");
const painelDiv = document.getElementById("painel");

const btnGreen = document.getElementById("btnGreen");
const btnRed = document.getElementById("btnRed");
const resultadoAvaliacao = document.getElementById("resultadoAvaliacao");
const tipoEnviado = document.getElementById("tipoEnviado");
const contadorGlobal = document.getElementById("contadorGlobal");

// ================= LOGIN / CADASTRO =================
window.mostrarCadastro = function () {
  loginDiv.style.display = "none";
  cadastroDiv.style.display = "flex";
};

window.mostrarLogin = function () {
  cadastroDiv.style.display = "none";
  loginDiv.style.display = "flex";
};

window.cadastrar = async function () {
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;

  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Cadastro realizado!");
    mostrarLogin();
  } catch (e) {
    alert(e.message);
  }
};

window.login = async function () {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (e) {
    alert(e.message);
  }
};

// ================= PERSISTÊNCIA LOGIN =================
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginDiv.style.display = "none";
    cadastroDiv.style.display = "none";
    painelDiv.style.display = "block";
  } else {
    loginDiv.style.display = "flex";
    cadastroDiv.style.display = "none";
    painelDiv.style.display = "none";
  }
});

// ================= CONTADOR GLOBAL =================
const refGlobal = doc(db, "historico", "global");

onSnapshot(refGlobal, (docSnap) => {
  if (docSnap.exists() && contadorGlobal) {
    contadorGlobal.innerText =
      "Global: " +
      (docSnap.data().green || 0) +
      " Green | " +
      (docSnap.data().red || 0) +
      " Red";
  }
});

async function addGreen() {
  await updateDoc(refGlobal, { green: increment(1) });
}

async function addRed() {
  await updateDoc(refGlobal, { red: increment(1) });
}

// ================= MARCAR GREEN / RED =================
function marcar(tipo) {
  if (!resultadoAvaliacao) return;

  resultadoAvaliacao.innerText = "Avaliação enviada!";
  tipoEnviado.innerText = "Resultado: " + tipo;

  btnGreen.disabled = true;
  btnRed.disabled = true;

  if (tipo === "GREEN") {
    addGreen();
  } else {
    addRed();
  }
}

// 🔥 AQUI ESTAVA O ERRO NO SEU SISTEMA
// Agora conectando corretamente os botões
if (btnGreen) {
  btnGreen.addEventListener("click", () => marcar("GREEN"));
}

if (btnRed) {
  btnRed.addEventListener("click", () => marcar("RED"));
}