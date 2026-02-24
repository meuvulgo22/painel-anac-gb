// ================= IMPORTS =================
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

// 🔥 NOVOS ELEMENTOS VISUAIS
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

// ================= GERAR SINAL =================
window.gerar = function (jogo) {

if (bloqueado) {
alert("Aguarde o tempo acabar.");
return;
}

// 🔥 LOADING + CONTAGEM
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

// 🔥 FUNÇÃO QUE BUSCA API
function buscarSinal(jogo) {

fetch(`/api/signal?jogo=${jogo}`)
.then(res => res.json())
.then(data => {

let minutos = data.minutos;

oportunidade.style.display = "block";
btnGreen.disabled = false;
btnRed.disabled = false;
resultadoAvaliacao.innerText = "";
tipoEnviado.innerText = "";

// 🔥 HISTÓRICO
let item = document.createElement("li");
item.innerText = jogo + " gerado agora";
historicoLista.prepend(item);

if (historicoLista.children.length > 5) {
historicoLista.removeChild(historicoLista.lastChild);
}

// 🔥 PROBABILIDADE
let prob = Math.floor(Math.random() * 15) + 85;
barraProb.style.width = prob + "%";
textoProb.innerText = "Probabilidade de Green: " + prob + "%";

// AVIATOR
if (jogo === "Aviator") {

aviatorVisual.style.display = "block";
clearInterval(animacaoMulti);

let multi = 1.00;
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
if (jogo === "Tigre" || jogo === "Touro") {

aviatorVisual.style.display = "none";

oportunidade.innerHTML = `
<b>✅ OPORTUNIDADE GERADA!</b><br><br>
🦁 ${jogo} 🦁<br>
⏰ Válido por: ${minutos} minuto(s)<br>
💰 Bet: R$ ${data.bet.toFixed(2)}<br>
👉 ${data.normal}x Normal<br>
⚡ ${data.turbo}x Turbo
`;
}

iniciarTimer(minutos);

})
.catch(() => {
alert("Erro ao conectar ao servidor.");
});
}