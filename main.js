import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const loginDiv = document.getElementById("login");
const cadastroDiv = document.getElementById("cadastro");
const painelDiv = document.getElementById("painel");

const btnGreen = document.getElementById("btnGreen");
const btnRed = document.getElementById("btnRed");
const resultadoAvaliacao = document.getElementById("resultadoAvaliacao");
const tipoEnviado = document.getElementById("tipoEnviado");
const contadorGlobal = document.getElementById("contadorGlobal");
const oportunidade = document.getElementById("oportunidade");
const aviatorVisual = document.getElementById("aviatorVisual");

const refGlobal = doc(db, "historico", "global");


// 🔥 FUNÇÕES GLOBAIS (mantidas exatamente como estavam)
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
  } catch (error) {
    alert(error.message);
  }
};

window.login = async function () {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    alert(error.message);
  }
};

window.gerar = function (tipo) {
  oportunidade.style.display = "block";
  oportunidade.innerText = "Oportunidade gerada para: " + tipo;

  if (tipo === "Aviator") {
    aviatorVisual.style.display = "block";
  } else {
    aviatorVisual.style.display = "none";
  }

  btnGreen.disabled = false;
  btnRed.disabled = false;
  resultadoAvaliacao.innerText = "";
  tipoEnviado.innerText = "";
};


// 🔥 GARANTE QUE O DOCUMENTO EXISTE (ANTES do onSnapshot)
async function garantirDocumento() {
  const snap = await getDoc(refGlobal);
  if (!snap.exists()) {
    await setDoc(refGlobal, { green: 0, red: 0 });
  }
}
garantirDocumento();


// 🔥 CONTADOR GLOBAL
onSnapshot(refGlobal, (docSnap) => {
  if (docSnap.exists()) {
    contadorGlobal.innerText =
      "Global: " +
      (docSnap.data().green || 0) +
      " Green | " +
      (docSnap.data().red || 0) +
      " Red";
  }
});


// 🔥 AVALIAÇÃO (mantida)
async function marcar(tipo) {
  resultadoAvaliacao.innerText = "Avaliação enviada!";
  tipoEnviado.innerText = "Resultado: " + tipo;

  btnGreen.disabled = true;
  btnRed.disabled = true;

  if (tipo === "GREEN") {
    await updateDoc(refGlobal, { green: increment(1) });
  } else {
    await updateDoc(refGlobal, { red: increment(1) });
  }
}

btnGreen.addEventListener("click", () => marcar("GREEN"));
btnRed.addEventListener("click", () => marcar("RED"));


// 🔥 AUTH
onAuthStateChanged(auth, (user) => {
  painelDiv.style.display = user ? "block" : "none";
  loginDiv.style.display = user ? "none" : "flex";
});