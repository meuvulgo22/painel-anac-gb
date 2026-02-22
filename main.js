import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
const oportunidade = document.getElementById("oportunidade");
const aviatorVisual = document.getElementById("aviatorVisual");
const multiplicador = document.getElementById("multiplicador");

// ================= VARIÁVEIS DE LOGIC =================
let bloqueado = false;
let tempoRestante = 0;
let intervalo;
let animacaoMulti;
let avaliacaoFeita = false;

const refGlobal = doc(db, "historico", "global");

// ================= LOGIN / CADASTRO =================
window.mostrarCadastro = () => {
  loginDiv.style.display = "none";
  cadastroDiv.style.display = "flex";
};

window.mostrarLogin = () => {
  cadastroDiv.style.display = "none";
  loginDiv.style.display = "flex";
};

window.cadastrar = async () => {
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

window.login = async () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (e) {
    alert(e.message);
  }
};

// ================= GARANTIR DOCUMENTO GLOBAL =================
async function garantirDocumento() {
  const snap = await getDoc(refGlobal);
  if (!snap.exists()) {
    await setDoc(refGlobal, { green: 0, red: 0 });
  }
}
garantirDocumento();

// ================= CONTADOR GLOBAL =================
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

// ================= MARCAR AVALIAÇÃO =================
async function marcar(tipo) {
  if (avaliacaoFeita) return;

  avaliacaoFeita = true;
  resultadoAvaliacao.innerText = "✅ Avaliação enviada!";
  tipoEnviado.innerText = "Enviada como " + tipo;
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

// ================= TIMER =================
function iniciarTimer(minutos) {
  bloqueado = true;
  tempoRestante = minutos * 60;
  clearInterval(intervalo);

  intervalo = setInterval(() => {
    tempoRestante--;
    document.getElementById("timer").innerText =
      "Nova oportunidade em: " + tempoRestante + "s";

    if (tempoRestante <= 0) {
      clearInterval(intervalo);
      bloqueado = false;
      avaliacaoFeita = false;
      btnGreen.disabled = false;
      btnRed.disabled = false;
      document.getElementById("timer").innerText = "";
    }
  }, 1000);
}

// ================= GERAR SINAL =================
window.gerar = function (jogo) {
  if (bloqueado) {
    alert("Aguarde o tempo acabar.");
    return;
  }

  let minutos = Math.floor(Math.random() * 2) + 1;
  oportunidade.style.display = "block";
  btnGreen.disabled = false;
  btnRed.disabled = false;
  resultadoAvaliacao.innerText = "";
  tipoEnviado.innerText = "";

  // ================= AVIATOR =================
  if (jogo === "Aviator") {
    aviatorVisual.style.display = "block";
    let multi = 1.00;
    let limite = (Math.random() * 5.45 + 1).toFixed(2);
    clearInterval(animacaoMulti);

    animacaoMulti = setInterval(() => {
      multi += 0.05;
      multiplicador.innerText = multi.toFixed(2) + "X";
      if (multi >= limite) clearInterval(animacaoMulti);
    }, 100);

    oportunidade.innerHTML =
      "<b>✈️ AVIATOR GERADO!</b><br><br>⏰ Válido por: " + minutos + " minuto(s)";
    iniciarTimer(minutos);
  }

  // ================= TIGRE / TOURO =================
  if (jogo === "Tigre" || jogo === "Touro") {
    aviatorVisual.style.display = "none";

    let bet = jogo === "Tigre" ? (Math.random() < 0.5 ? 0.40 : 0.80) : Math.random() < 0.5 ? 0.50 : 1.0;
    let normal = Math.floor(Math.random() * 10) + 1;
    let turbo = Math.floor(Math.random() * 10) + 1;

    oportunidade.innerHTML = `
      <b>✅ OPORTUNIDADE GERADA!</b><br><br>
      🦁 ${jogo} 🦁<br>
      ⏰ Válido por: ${minutos} minuto(s)<br>
      💰 Bet: R$ ${bet.toFixed(2)}<br>
      👉 ${normal}x Normal<br>
      ⚡ ${turbo}x Turbo
    `;

    iniciarTimer(minutos);
  }
};

// ================= AUTH STATE =================
onAuthStateChanged(auth, (user) => {
  painelDiv.style.display = user ? "block" : "none";
  loginDiv.style.display = user ? "none" : "flex";
});