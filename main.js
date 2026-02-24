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

const loadingSinal = document.getElementById("loadingSinal");
const historicoLista = document.getElementById("historicoLista");
const barraProb = document.getElementById("barraProb");
const textoProb = document.getElementById("textoProb");

// ================= VARIÁVEIS =================
let bloqueado = false;
let tempoRestante = 0;
let intervalo;
let animacaoMulti;
let avaliacaoFeita = false;

const refGlobal = doc(db, "historico", "global");

// ================= FUNÇÕES LOGIN/CADASTRO =================
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
    loginDiv.style.display = "none";
    cadastroDiv.style.display = "none";
    painelDiv.style.display = "block";
  } catch (e) {
    alert(e.message);
  }
};

// ================= CONTROLAR LOGIN =================
onAuthStateChanged(auth, (user) => {
  painelDiv.style.display = user ? "block" : "none";
  loginDiv.style.display = user ? "none" : "flex";
});

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

  loadingSinal.style.display = "block";
  oportunidade.style.display = "none";

  let contador = 3;
  loadingSinal.innerText = "⏳ Preparando sinal... " + contador;

  let contagem = setInterval(() => {
    contador--;
    loadingSinal.innerText = "⏳ Preparando sinal... " + contador;

    if (contador <= 0) {
      clearInterval(contagem);
      loadingSinal.style.display = "none";
      buscarSinal(jogo);
    }
  }, 1000);
};

function buscarSinal(jogo) {
  fetch(`/api/signal?jogo=${jogo}`)
    .then((res) => res.json())
    .then((data) => {
      let minutos = data.minutos;

      oportunidade.style.display = "block";
      btnGreen.disabled = false;
      btnRed.disabled = false;
      resultadoAvaliacao.innerText = "";
      tipoEnviado.innerText = "";

      // Histórico
      let item = document.createElement("li");
      item.innerText = jogo + " gerado agora";
      historicoLista.prepend(item);
      if (historicoLista.children.length > 5) {
        historicoLista.removeChild(historicoLista.lastChild);
      }

      // Probabilidade
      let prob = Math.floor(Math.random() * 15) + 85;
      barraProb.style.width = prob + "%";
      textoProb.innerText = "Probabilidade de Green: " + prob + "%";

      // AVIATOR
      if (jogo === "Aviator") {
        aviatorVisual.style.display = "block";
        clearInterval(animacaoMulti);

        let multi = 1.0;
        let limite = parseFloat(data.multiplicador);

        animacaoMulti = setInterval(() => {
          multi += 0.05;
          multiplicador.innerText = multi.toFixed(2) + "X";
          if (multi >= limite) clearInterval(animacaoMulti);
        }, 100);

        oportunidade.innerHTML =
          "<b>✈️ AVIATOR GERADO!</b><br><br>⏰ Válido por: " +
          minutos +
          " minuto(s)";
      }

      // TIGRE / TOURO