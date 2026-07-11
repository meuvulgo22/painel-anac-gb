import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
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

// ============================================================
// ELEMENTOS DA INTERFACE
// ============================================================
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
const loadingSinal = document.getElementById("loadingSinal");
const historicoLista = document.getElementById("historicoLista");
const barraProb = document.getElementById("barraProb");
const textoProb = document.getElementById("textoProb");

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
let bloqueado = false;
let tempoRestante = 0;
let intervalo;
let avaliacaoFeita = false;
let sinalAtual = null;
const refGlobal = doc(db, "historico", "global");

// ============================================================
// SISTEMA DE IA (APRENDIZADO)
// ============================================================
class IAAviator {
  constructor() {
    this.historico = [];
    this.padroes = {
      '3X': { acertos: 0, tentativas: 0, taxa: 0 },
      '10X': { acertos: 0, tentativas: 0, taxa: 0 },
      '30X': { acertos: 0, tentativas: 0, taxa: 0 }
    };
    this.estrategiaAtual = 'balanceada';
    this.confianca = 50;
    this.totalSinais = 0;
    this.taxaAcertoGlobal = 0;
    this.carregarHistorico();
  }

  carregarHistorico() {
    try {
      const salvo = localStorage.getItem('ia_historico_aviator');
      if (salvo) {
        const dados = JSON.parse(salvo);
        this.historico = dados.historico || [];
        this.padroes = dados.padroes || this.padroes;
        this.totalSinais = dados.totalSinais || 0;
        this.taxaAcertoGlobal = dados.taxaAcertoGlobal || 0;
        this.confianca = dados.confianca || 50;
        this.atualizarEstatisticas();
      }
    } catch (e) {
      console.log('Nenhum histórico encontrado, iniciando IA do zero');
    }
  }

  salvarHistorico() {
    try {
      localStorage.setItem('ia_historico_aviator', JSON.stringify({
        historico: this.historico,
        padroes: this.padroes,
        totalSinais: this.totalSinais,
        taxaAcertoGlobal: this.taxaAcertoGlobal,
        confianca: this.confianca
      }));
    } catch (e) {}
  }

  registrarResultado(tipo, multiplicador, resultado) {
    const entrada = { tipo, multiplicador, resultado, timestamp: new Date().toISOString() };
    this.historico.unshift(entrada);
    if (this.historico.length > 100) this.historico.pop();

    if (this.padroes[tipo]) {
      this.padroes[tipo].tentativas++;
      if (resultado === 'green') this.padroes[tipo].acertos++;
      this.padroes[tipo].taxa = (this.padroes[tipo].acertos / this.padroes[tipo].tentativas) * 100;
    }

    this.totalSinais++;
    this.atualizarEstatisticas();
    this.salvarHistorico();
  }

  atualizarEstatisticas() {
    const total = this.historico.length;
    if (total === 0) return;
    const verdes = this.historico.filter(h => h.resultado === 'green').length;
    this.taxaAcertoGlobal = (verdes / total) * 100;

    const fatorDados = Math.min(total / 30, 1) * 30;
    const fatorAcerto = (this.taxaAcertoGlobal / 100) * 40;
    this.confianca = Math.min(30 + fatorDados + fatorAcerto, 95);

    if (this.taxaAcertoGlobal > 70) this.estrategiaAtual = 'agressiva';
    else if (this.taxaAcertoGlobal > 50) this.estrategiaAtual = 'balanceada';
    else this.estrategiaAtual = 'conservadora';

    this.atualizarInterfaceIA();
  }

  atualizarInterfaceIA() {
    const taxa = document.getElementById('taxaAcerto');
    const total = document.getElementById('totalSinais');
    const aprendizado = document.getElementById('iaAprendizado');
    const rtp = document.getElementById('rtp');
    if (taxa) taxa.textContent = `🎯 Taxa: ${this.taxaAcertoGlobal.toFixed(1)}%`;
    if (total) total.textContent = `📊 Sinais: ${this.totalSinais}`;
    if (aprendizado) {
      const mapa = { 'agressiva': '🔥 Agressivo', 'balanceada': '⚖️ Balanceado', 'conservadora': '🛡️ Conservador' };
      aprendizado.textContent = `🧠 ${mapa[this.estrategiaAtual] || 'Aprendizado'} - Confiança: ${this.confianca.toFixed(0)}%`;
    }
    if (rtp) rtp.textContent = `🧠 IA: ${this.taxaAcertoGlobal.toFixed(1)}% de acerto | ${this.totalSinais} sinais`;
  }

  gerarSinal(jogo) {
    let melhorTipo = '10X';
    let melhorTaxa = 0;
    for (const [tipo, dados] of Object.entries(this.padroes)) {
      if (dados.tentativas > 3 && dados.taxa > melhorTaxa) {
        melhorTaxa = dados.taxa;
        melhorTipo = tipo;
      }
    }
    if (this.totalSinais < 10) {
      const tipos = ['3X', '10X', '30X'];
      melhorTipo = tipos[Math.floor(Math.random() * tipos.length)];
    }

    let min, max, topo, probabilidade;
    switch (this.estrategiaAtual) {
      case 'agressiva':
        min = (Math.random() * 0.5 + 1.2).toFixed(2);
        max = (Math.random() * 1.5 + 2.5).toFixed(2);
        topo = (Math.random() * 8 + 4).toFixed(2);
        probabilidade = Math.floor(Math.random() * 10) + 85;
        break;
      case 'conservadora':
        min = (Math.random() * 0.3 + 1.0).toFixed(2);
        max = (Math.random() * 0.8 + 1.5).toFixed(2);
        topo = (Math.random() * 4 + 2).toFixed(2);
        probabilidade = Math.floor(Math.random() * 15) + 70;
        break;
      default:
        min = (Math.random() * 0.5 + 1.0).toFixed(2);
        max = (Math.random() * 1.0 + 2.0).toFixed(2);
        topo = (Math.random() * 6 + 3).toFixed(2);
        probabilidade = Math.floor(Math.random() * 12) + 80;
    }
    const ajuste = (this.confianca - 50) / 100 * 10;
    probabilidade = Math.min(Math.max(probabilidade + ajuste, 60), 99);

    if (melhorTipo === '3X') {
      min = (Math.random() * 0.3 + 1.0).toFixed(2);
      max = (Math.random() * 0.5 + 1.8).toFixed(2);
      topo = (Math.random() * 3 + 2.5).toFixed(2);
    }

    return {
      jogo, tipo: melhorTipo,
      min: parseFloat(min), max: parseFloat(max), topo: parseFloat(topo),
      probabilidade, confianca: this.confianca, estrategia: this.estrategiaAtual
    };
  }
}

const ia = new IAAviator();

// ============================================================
// FUNÇÕES DE ANIMAÇÃO
// ============================================================
function animarNumero(el, final, duracao = 1500) {
  const inicio = performance.now();
  const inicial = parseFloat(el.textContent) || 0;
  function update(agora) {
    const p = Math.min((agora - inicio) / duracao, 1);
    el.textContent = (inicial + (final - inicial) * p).toFixed(2) + 'X';
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function animarPorcentagem(el, final, duracao = 2000) {
  const inicio = performance.now();
  function update(agora) {
    const p = Math.min((agora - inicio) / duracao, 1);
    el.textContent = Math.floor(final * p) + '%';
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function animarBarra(el, final, duracao = 1500) {
  const inicio = performance.now();
  function update(agora) {
    const p = Math.min((agora - inicio) / duracao, 1);
    el.style.width = (final * p) + '%';
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function animarPulse(el) {
  el.style.transition = 'transform 0.1s';
  el.style.transform = 'scale(1.1)';
  setTimeout(() => el.style.transform = 'scale(1)', 200);
}

function animarFadeIn(el) {
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.5s';
  setTimeout(() => el.style.opacity = '1', 50);
}

// ============================================================
// LOGIN / CADASTRO
// ============================================================
window.mostrarCadastro = () => { loginDiv.style.display = "none"; cadastroDiv.style.display = "flex"; };
window.mostrarLogin = () => { cadastroDiv.style.display = "none"; loginDiv.style.display = "flex"; };

window.cadastrar = async () => {
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  if (!email || !senha) return alert("Preencha todos os campos!");
  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Cadastro realizado!");
    mostrarLogin();
  } catch (e) { alert(e.message); }
};

window.login = async () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  if (!email || !senha) return alert("Preencha todos os campos!");
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    loginDiv.style.display = "none";
    cadastroDiv.style.display = "none";
    painelDiv.style.display = "block";
    ia.atualizarInterfaceIA();
  } catch (e) { alert(e.message); }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    painelDiv.style.display = "block";
    loginDiv.style.display = "none";
    cadastroDiv.style.display = "none";
    ia.atualizarInterfaceIA();
  } else {
    painelDiv.style.display = "none";
    loginDiv.style.display = "flex";
  }
});

// ============================================================
// FIREBASE - CONTADOR GLOBAL
// ============================================================
async function garantirDocumento() {
  const snap = await getDoc(refGlobal);
  if (!snap.exists()) await setDoc(refGlobal, { green: 0, red: 0 });
}
garantirDocumento();

onSnapshot(refGlobal, (docSnap) => {
  if (docSnap.exists()) {
    let green = docSnap.data().green || 0, red = docSnap.data().red || 0;
    let total = green + red;
    let rtp = total > 0 ? ((green / total) * 100).toFixed(2) : 0;
    document.getElementById("rtp").innerText = "RTP: " + rtp + "%";
    contadorGlobal.innerText = "Global: " + green + " Green | " + red + " Red";
  }
});

// ============================================================
// AVALIAÇÃO (GREEN / RED)
// ============================================================
async function marcar(tipo) {
  if (avaliacaoFeita) return;
  avaliacaoFeita = true;
  resultadoAvaliacao.innerText = "✅ Avaliação enviada!";
  tipoEnviado.innerText = "Enviada como " + tipo;
  btnGreen.disabled = true;
  btnRed.disabled = true;

  if (sinalAtual) {
    const tipoSinal = sinalAtual.tipo || '10X';
    const multiplicador = (sinalAtual.min + sinalAtual.max) / 2;
    ia.registrarResultado(tipoSinal, multiplicador, tipo.toLowerCase());
    sinalAtual = null;
  }

  if (tipo === "GREEN") await updateDoc(refGlobal, { green: increment(1) });
  else await updateDoc(refGlobal, { red: increment(1) });
}

btnGreen.addEventListener("click", () => marcar("GREEN"));
btnRed.addEventListener("click", () => marcar("RED"));

// ============================================================
// TIMER
// ============================================================
function iniciarTimer(minutos) {
  bloqueado = true;
  tempoRestante = minutos * 60;
  clearInterval(intervalo);
  intervalo = setInterval(() => {
    tempoRestante--;
    document.getElementById("timer").innerText = "Nova oportunidade em: " + tempoRestante + "s";
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

// ============================================================
// GERAR SINAL COM IA + ANIMAÇÕES
// ============================================================
window.gerar = function (jogo) {
  if (bloqueado) return alert("Aguarde o tempo acabar.");
  loadingSinal.style.display = "block";
  oportunidade.style.display = "none";
  aviatorVisual.style.display = "none";

  let contador = 4;
  loadingSinal.innerText = "🧠 IA analisando... " + contador;