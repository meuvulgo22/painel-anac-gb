import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============================================================
// FIREBASE
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
setPersistence(auth, browserLocalPersistence);

// ============================================================
// ELEMENTOS
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
const refGlobal = doc(db, "historico", "global");

// ============================================================
// VARIÁVEIS
// ============================================================
let bloqueado = false;
let tempoRestante = 0;
let intervalo;
let avaliacaoFeita = false;
let sinalAtual = null;
let velaSelecionada = null;
let rastreadorLigado = false;
let intervaloRastreador = null;

// ============================================================
// LOGIN
// ============================================================
window.mostrarCadastro = function() {
  loginDiv.style.display = "none";
  cadastroDiv.style.display = "flex";
};

window.mostrarLogin = function() {
  cadastroDiv.style.display = "none";
  loginDiv.style.display = "flex";
};

window.cadastrar = async function() {
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  if (!email || !senha) {
    alert("Preencha todos os campos!");
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Cadastro realizado!");
    mostrarLogin();
  } catch (e) {
    alert(e.message);
  }
};

window.login = async function() {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  if (!email || !senha) {
    alert("Preencha todos os campos!");
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    console.log("✅ Login feito!");
  } catch (e) {
    alert("Erro: " + e.message);
  }
};

// ============================================================
// CONTROLE DE LOGIN
// ============================================================
onAuthStateChanged(auth, function(user) {
  console.log("🔍 Auth mudou:", user ? "logado" : "deslogado");
  if (user) {
    painelDiv.style.display = "block";
    loginDiv.style.display = "none";
    cadastroDiv.style.display = "none";
    console.log("✅ Usuário logado:", user.email);
  } else {
    painelDiv.style.display = "none";
    loginDiv.style.display = "flex";
    cadastroDiv.style.display = "none";
    console.log("❌ Ninguém logado");
  }
});

// ============================================================
// FIREBASE GLOBAL
// ============================================================
async function garantirDocumento() {
  try {
    const snap = await getDoc(refGlobal);
    if (!snap.exists()) {
      await setDoc(refGlobal, { green: 0, red: 0 });
      console.log("📄 Documento global criado");
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}
garantirDocumento();

onSnapshot(refGlobal, function(docSnap) {
  if (docSnap.exists()) {
    let green = docSnap.data().green || 0;
    let red = docSnap.data().red || 0;
    let total = green + red;
    let rtp = total > 0 ? ((green / total) * 100).toFixed(2) : 0;
    const rtpEl = document.getElementById("rtp");
    if (rtpEl) rtpEl.innerText = "RTP: " + rtp + "%";
    if (contadorGlobal) contadorGlobal.innerText = "Global: " + green + " Green | " + red + " Red";
  }
});

// ============================================================
// AVALIAÇÃO
// ============================================================
async function marcar(tipo) {
  if (avaliacaoFeita) return;
  avaliacaoFeita = true;
  if (resultadoAvaliacao) resultadoAvaliacao.innerText = "✅ Avaliação enviada!";
  if (tipoEnviado) tipoEnviado.innerText = "Enviada como " + tipo;
  if (btnGreen) btnGreen.disabled = true;
  if (btnRed) btnRed.disabled = true;

  try {
    if (tipo === "GREEN") {
      await updateDoc(refGlobal, { green: increment(1) });
    } else {
      await updateDoc(refGlobal, { red: increment(1) });
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

if (btnGreen) btnGreen.addEventListener("click", function() { marcar("GREEN"); });
if (btnRed) btnRed.addEventListener("click", function() { marcar("RED"); });

// ============================================================
// TIMER
// ============================================================
function iniciarTimer(minutos) {
  bloqueado = true;
  tempoRestante = minutos * 60;
  clearInterval(intervalo);
  const timerEl = document.getElementById("timer");
  intervalo = setInterval(function() {
    tempoRestante--;
    if (timerEl) timerEl.innerText = "Nova oportunidade em: " + tempoRestante + "s";
    if (tempoRestante <= 0) {
      clearInterval(intervalo);
      bloqueado = false;
      avaliacaoFeita = false;
      if (btnGreen) btnGreen.disabled = false;
      if (btnRed) btnRed.disabled = false;
      if (timerEl) timerEl.innerText = "";
    }
  }, 1000);
}

// ============================================================
// GERAR SINAL
// ============================================================
window.gerar = function(jogo) {
  if (bloqueado) {
    alert("Aguarde o tempo acabar.");
    return;
  }

  loadingSinal.style.display = "block";
  oportunidade.style.display = "none";
  
  if (jogo === "Aviator") {
    aviatorVisual.style.display = "block";
    loadingSinal.style.display = "none";
    resetarRastreador();
    return;
  }

  aviatorVisual.style.display = "none";

  let contador = 3;
  loadingSinal.innerText = "⏳ Preparando sinal... " + contador;

  let contagem = setInterval(() => {
    contador--;
    loadingSinal.innerText = "⏳ Preparando sinal... " + contador;

    if (contador <= 0) {
      clearInterval(contagem);
      loadingSinal.style.display = "none";
      
      const sinal = gerarSinalAleatorio(jogo);
      sinalAtual = sinal;
      mostrarSinal(jogo, sinal);
    }
  }, 1000);
};

function gerarSinalAleatorio(jogo) {
  const tipos = ['3X', '10X', '30X'];
  const tipo = tipos[Math.floor(Math.random() * 3)];
  
  // 🔥 CORRIGIDO: mínimo 1.00x
  const min = (Math.random() * 0.8 + 1.0).toFixed(2);
  const max = (Math.random() * 1.5 + 1.8).toFixed(2);
  const topo = (Math.random() * 5 + 3).toFixed(2);
  const prob = Math.floor(Math.random() * 25) + 55;
  
  return {
    jogo: jogo,
    tipo: tipo,
    min: parseFloat(min),
    max: parseFloat(max),
    topo: parseFloat(topo),
    probabilidade: prob
  };
}

function mostrarSinal(jogo, sinal) {
  btnGreen.disabled = false;
  btnRed.disabled = false;
  resultadoAvaliacao.innerText = "";
  tipoEnviado.innerText = "";
  avaliacaoFeita = false;

  oportunidade.style.display = "block";
  oportunidade.style.opacity = "0";
  setTimeout(() => {
    oportunidade.style.opacity = "1";
    oportunidade.style.transition = "opacity 0.5s ease";
  }, 50);

  let agora = new Date();
  let horaFormatada = agora.toLocaleTimeString();
  let item = document.createElement("li");
  item.textContent = `${jogo} | ${sinal.tipo} | ${sinal.min}x-${sinal.max}x | ${sinal.probabilidade}%`;
  historicoLista.prepend(item);
  if (historicoLista.children.length > 10) {
    historicoLista.removeChild(historicoLista.lastChild);
  }

  barraProb.style.width = sinal.probabilidade + "%";
  textoProb.innerText = "Probabilidade: " + sinal.probabilidade + "%";

  oportunidade.innerHTML = `
    <b>✅ OPORTUNIDADE GERADA!</b><br><br>
    🦁 ${jogo} | ${sinal.tipo}<br>
    🎯 ${sinal.min}x-${sinal.max}x<br>
    ⏰ Válido por: 2 minuto(s)
  `;

  iniciarTimer(2);
}

// ============================================================
// RASTREADOR AVIATOR
// ============================================================
function resetarRastreador() {
  velaSelecionada = null;
  rastreadorLigado = false;
  if (intervaloRastreador) {
    clearInterval(intervaloRastreador);
    intervaloRastreador = null;
  }
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    btn.classList.remove('ativo');
  });
  
  const btn = document.getElementById('btnRastreador');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '▶️ LIGAR RASTREADOR';
    btn.className = 'oraculo-btn-ligar';
  }
  
  const status = document.getElementById('statusRastreador');
  if (status) {
    status.className = 'oraculo-status';
    status.innerHTML = `
      🔴 RASTREADOR AGUARDANDO<br>
      <span class="status-sub">Escolha a vela acima para ativar o rastreador.</span>
    `;
  }
  
  document.getElementById('areaResultado').style.display = 'none';
}

window.selecionarVela = function(vela) {
  velaSelecionada = vela;
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    btn.classList.remove('ativo');
  });
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    if (btn.textContent === vela) {
      btn.classList.add('ativo');
    }
  });
  
  const btn = document.getElementById('btnRastreador');
  if (btn) {
    btn.disabled = false;
    btn.textContent = '▶️ LIGAR RASTREADOR';
    btn.className = 'oraculo-btn-ligar';
  }
  
  const status = document.getElementById('statusRastreador');
  if (status) {
    status.className = 'oraculo-status';
    status.innerHTML = `
      ✅ VELA SELECIONADA: ${vela}<br>
      <span class="status-sub">Clique em LIGAR RASTREADOR para iniciar a análise.</span>
    `;
  }
  
  document.getElementById('areaResultado').style.display = 'none';
};

window.alternarRastreador = function() {
  if (!velaSelecionada) {
    alert('Selecione uma vela primeiro!');
    return;
  }
  
  if (rastreadorLigado) {
    desligarRastreador();
    return;
  }
  
  ligarRastreador();
};

function ligarRastreador() {
  rastreadorLigado = true;
  
  const btn = document.getElementById('btnRastreador');
  btn.textContent = '⏳ ANALISANDO...';
  btn.disabled = true;
  
  const status = document.getElementById('statusRastreador');
  status.className = 'oraculo-status verde';
  status.innerHTML = `
    🟢 RASTREADOR ATIVO<br>
    <span class="status-sub">Lendo mercado em tempo real...</span>
  `;
  
  const areaResultado = document.getElementById('areaResultado');
  areaResultado.style.display = 'block';
  
  const porcentagem = document.getElementById('porcentagemSucesso');
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  const rangeTopo = document.getElementById('rangeTopo');
  
  let progresso = 0;
  intervaloRastreador = setInterval(() => {
    progresso += Math.floor(Math.random() * 5) + 2;
    
    if (progresso >= 100) {
      progresso = 100;
      clearInterval(intervaloRastreador);
      
      // 🔥 CORRIGIDO: mínimo 1.00x
      const prob = Math.floor(Math.random() * 25) + 55;
      const min = (Math.random() * 0.8 + 1.0).toFixed(2);
      const max = (Math.random() * 1.5 + 1.8).toFixed(2);
      const topo = (Math.random() * 5 + 3).toFixed(2);
      
      const isBom = prob >= 60;
      
      porcentagem.textContent = prob + '%';
      porcentagem.className = 'porcentagem-grande' + (isBom ? '' : ' vermelho');
      
      rangeMin.textContent = min;
      rangeMax.textContent = max;
      rangeTopo.textContent = topo;
      
      const statusEntrada = document.getElementById('statusEntrada');
      const entradaSugerida = document.getElementById('entradaSugerida');
      
      if (isBom) {
        statusEntrada.textContent = '🎯 ENTRADA SUGERIDA, ALTA CHANCE DE SUCESSO';
        statusEntrada.className = 'entrada-titulo';
        entradaSugerida.style.borderColor = '#2e7d32';
      } else {
        statusEntrada.textContent = '🚨 FUJA DESSA ENTRADA!';
        statusEntrada.className = 'entrada-titulo vermelho';
        entradaSugerida.style.borderColor = '#c62828';
      }
      
      document.getElementById('detalheProb').textContent = prob + '%';
      document.getElementById('detalheProb').className = 'detalhe-valor' + (isBom ? '' : ' vermelho');
      
      const risco = prob >= 70 ? 'BAIXO' : prob >= 55 ? 'MÉDIO' : 'ALTO';
      document.getElementById('detalheRisco').textContent = risco;
      document.getElementById('detalheRisco').className = 'detalhe-valor' + (risco === 'BAIXO' ? '' : ' vermelho');
      
      document.getElementById('resumoTexto').textContent = 
        `Expectativa de velas entre ${min}x e ${max}x, com possibilidade de atingir ${topo}x.`;
      
      const tendencias = ['descendo', 'subindo', 'lateral'];
      const tendencia = tendencias[Math.floor(Math.random() * 3)];
      const vies = tendencia === 'descendo' ? 'BAIXA' : tendencia === 'subindo' ? 'ALTA' : 'NEUTRA';
      
      document.getElementById('analiseTexto').textContent = 
        `A tendência atual é de ${tendencia}, com a maioria das velas ${tendencia === 'descendo' ? 'abaixo' : tendencia === 'subindo' ? 'acima' : 'próximas'} do multiplicador alvo.`;
      
      const tendenciaEl = document.getElementById('tendenciaTexto');
      tendenciaEl.textContent = `📈 TENDÊNCIA: ${tendencia.toUpperCase()}`;
      tendenciaEl.className = 'tendencia' + (tendencia === 'subindo' ? ' verde' : '');
      
      document.getElementById('viesTexto').textContent = `VIÉS: ${vies}`;
      document.getElementById('viesTexto').className = 'vies' + (vies === 'ALTA' ? ' verde' : '');
      
      const btnIa = document.getElementById('btnIaPronta');
      btnIa.className = 'btn-ia-pronta' + (isBom ? '' : ' vermelho');
      btnIa.textContent = isBom ? '🧠 IA PRONTA' : '🚨 FUJA!';
      
      status.className = 'oraculo-status verde';
      status.innerHTML = `
        ✅ ANÁLISE CONCLUÍDA<br>
        <span class="status-sub">${isBom ? 'Entrada sugerida disponível' : 'FUJA desta entrada!'}</span>
      `;
      
      const btnRastreador = document.getElementById('btnRastreador');
      btnRastreador.textContent = '🔴 DESLIGAR RASTREADOR';
      btnRastreador.className = 'oraculo-btn-ligar desligado';
      btnRastreador.disabled = false;
      rastreadorLigado = true;
      
    } else {
      porcentagem.textContent = progresso + '%';
    }
  }, 120);
}

window.desligarRastreador = function() {
  if (intervaloRastreador) {
    clearInterval(intervaloRastreador);
    intervaloRastreador = null;
  }
  
  rastreadorLigado = false;
  
  const btn = document.getElementById('btnRastreador');
  btn.textContent = '▶️ LIGAR RASTREADOR';
  btn.className = 'oraculo-btn-ligar';
  btn.disabled = true;
  
  const status = document.getElementById('statusRastreador');
  status.className = 'oraculo-status';
  status.innerHTML = `
    🔴 RASTREADOR AGUARDANDO<br>
    <span class="status-sub">Escolha a vela acima para ativar o rastreador.</span>
  `;
  
  document.getElementById('areaResultado').style.display = 'none';
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    btn.classList.remove('ativo');
  });
  velaSelecionada = null;
};

console.log("✅ App iniciado com sucesso!");