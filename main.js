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

// ===== SALVAR LOGIN AUTOMATICAMENTE =====
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Login será salvo automaticamente!");
  })
  .catch((error) => {
    console.error("❌ Erro ao salvar login:", error);
  });

// ============================================================
// ELEMENTOS
// ============================================================
const loginDiv = document.getElementById("login");
const cadastroDiv = document.getElementById("cadastro");
const painelDiv = document.getElementById("painel");
const btnGreen = document.getElementById("btnGreen");
const btnRed = document.getElementById("btnRed");
const btnTigre = document.getElementById("btnTigre");
const btnTouro = document.getElementById("btnTouro");
const btnAviator = document.getElementById("btnAviator");
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

// ============================================================
// LOGIN / CADASTRO
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
// CONTROLE DE LOGIN (SALVO AUTOMATICAMENTE)
// ============================================================
onAuthStateChanged(auth, function(user) {
  if (user) {
    // USUÁRIO LOGADO - MOSTRA PAINEL
    painelDiv.style.display = "block";
    loginDiv.style.display = "none";
    cadastroDiv.style.display = "none";
    console.log("✅ Usuário logado:", user.email);
    console.log("🔒 Login salvo - não precisa logar de novo!");
  } else {
    // USUÁRIO DESLOGADO - MOSTRA TELA DE LOGIN
    painelDiv.style.display = "none";
    loginDiv.style.display = "flex";
    cadastroDiv.style.display = "none";
    console.log("❌ Ninguém logado");
  }
});

// ============================================================
// GARANTIR DOCUMENTO GLOBAL
// ============================================================
async function garantirDocumento() {
  try {
    const snap = await getDoc(refGlobal);
    if (!snap.exists()) {
      await setDoc(refGlobal, { green: 0, red: 0 });
      console.log("📄 Documento global criado");
    }
  } catch (e) {
    console.error("Erro ao garantir documento:", e);
  }
}
garantirDocumento();

// ============================================================
// CONTADOR GLOBAL
// ============================================================
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
// AVALIAÇÃO (GREEN / RED)
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
    console.error("Erro ao marcar:", e);
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
// SISTEMA DE IA
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
// ANIMAÇÕES
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

// ============================================================
// GERAR SINAL COM IA
// ============================================================
window.gerar = function(jogo) {
  if (bloqueado) {
    alert("Aguarde o tempo acabar.");
    return;
  }

  loadingSinal.style.display = "block";
  oportunidade.style.display = "none";
  aviatorVisual.style.display = "none";

  let contador = 4;
  loadingSinal.innerText = "🧠 IA analisando... " + contador;

  let contagem = setInterval(() => {
    contador--;
    loadingSinal.innerText = "🧠 IA analisando... " + contador;

    if (contador <= 0) {
      clearInterval(contagem);
      loadingSinal.style.display = "none";
      
      const sinalIA = ia.gerarSinal(jogo);
      sinalAtual = sinalIA;
      mostrarSinal(jogo, sinalIA);
    }
  }, 800);
};

function mostrarSinal(jogo, sinalIA) {
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
  item.textContent = `${jogo} | ${sinalIA.tipo} | ${sinalIA.min}x-${sinalIA.max}x | ${sinalIA.probabilidade}%`;
  historicoLista.prepend(item);
  if (historicoLista.children.length > 10) {
    historicoLista.removeChild(historicoLista.lastChild);
  }

  animarBarra(barraProb, sinalIA.probabilidade);
  textoProb.innerText = "🧠 IA: " + sinalIA.probabilidade + "% de confiança";
  animarPulse(textoProb);

  if (jogo === "Aviator") {
    aviatorVisual.style.display = "block";
    
    const status = document.getElementById('statusRastreador');
    status.innerHTML = `
      🧠 IA PRONTA<br>
      <span class="status-sub">Estratégia: ${sinalIA.estrategia} | Confiança: ${sinalIA.confianca.toFixed(0)}%</span>
    `;
    
    const porcentagemEl = document.getElementById('porcentagemSucesso');
    animarPorcentagem(porcentagemEl, sinalIA.probabilidade);
    porcentagemEl.style.color = sinalIA.probabilidade >= 80 ? '#00ff88' : '#ff8800';
    
    const rangeMin = document.getElementById('rangeMin');
    const rangeMax = document.getElementById('rangeMax');
    const rangeTopo = document.getElementById('rangeTopo');
    
    rangeMin.textContent = '0.00';
    rangeMax.textContent = '0.00';
    rangeTopo.textContent = '0.00';
    
    setTimeout(() => {
      animarNumero(rangeMin, sinalIA.min, 1000);
      setTimeout(() => animarNumero(rangeMax, sinalIA.max, 1000), 300);
      setTimeout(() => animarNumero(rangeTopo, sinalIA.topo, 1000), 600);
    }, 200);
    
    document.getElementById('areaIA').style.display = 'block';
    document.querySelector('.btn-desligar').style.display = 'block';
    
    ia.atualizarInterfaceIA();
    
    oportunidade.innerHTML = `
      <b>✈️ AVIATOR - IA GEROU!</b><br><br>
      🎯 ${sinalIA.tipo} | ${sinalIA.min}x-${sinalIA.max}x<br>
      🧠 Confiança: ${sinalIA.confianca.toFixed(0)}%<br>
      ⏰ Válido por: 2 minuto(s)
    `;
  }

  if (jogo === "Tigre" || jogo === "Touro") {
    aviatorVisual.style.display = "none";
    oportunidade.innerHTML = `
      <b>✅ OPORTUNIDADE GERADA PELA IA!</b><br><br>
      🦁 ${jogo} | ${sinalIA.tipo}<br>
      🎯 ${sinalIA.min}x-${sinalIA.max}x<br>
      🧠 Confiança: ${sinalIA.confianca.toFixed(0)}%<br>
      ⏰ Válido por: 2 minuto(s)
    `;
  }

  iniciarTimer(2);
}

// ============================================================
// FUNÇÕES DO RASTREADOR
// ============================================================
let velaSelecionada = null;
let rastreadorLigado = false;
let intervaloRastreador = null;

window.selecionarVela = function(vela) {
  velaSelecionada = vela;
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    btn.classList.remove('ativo');
  });
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    if (btn.dataset.vela === vela) {
      btn.classList.add('ativo');
      animarPulse(btn);
    }
  });
  
  const status = document.getElementById('statusRastreador');
  status.innerHTML = `
    ✅ Vela ${vela} selecionada<br>
    <span class="status-sub">IA pronta para analisar este padrão</span>
  `;
  animarPulse(status);
};

window.ligarRastreador = function() {
  if (!velaSelecionada) {
    alert('Selecione uma vela para a IA analisar!');
    return;
  }
  
  if (rastreadorLigado) {
    alert('IA já está rodando!');
    return;
  }
  
  rastreadorLigado = true;
  
  const btn = document.getElementById('btnRastreador');
  btn.textContent = '🧠 IA ANALISANDO...';
  btn.disabled = true;
  btn.style.opacity = '0.6';
  
  document.getElementById('areaIA').style.display = 'block';
  
  const status = document.getElementById('statusRastreador');
  status.innerHTML = `
    🧠 IA ATIVA<br>
    <span class="status-sub">Analisando padrões históricos...</span>
  `;
  
  const porcentagem = document.getElementById('porcentagemSucesso');
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  const rangeTopo = document.getElementById('rangeTopo');
  
  let progresso = 0;
  intervaloRastreador = setInterval(() => {
    progresso += Math.floor(Math.random() * 3) + 2;
    
    if (progresso >= 100) {
      progresso = 100;
      clearInterval(intervaloRastreador);
      
      const sinalIA = ia.gerarSinal('Aviator');
      const vela = velaSelecionada;
      
      let min = sinalIA.min;
      let max = sinalIA.max;
      let topo = sinalIA.topo;
      
      if (vela === '3X') {
        min = parseFloat((Math.random() * 0.3 + 1.0).toFixed(2));
        max = parseFloat((Math.random() * 0.5 + 1.8).toFixed(2));
        topo = parseFloat((Math.random() * 3 + 2.5).toFixed(2));
      } else if (vela === '10X') {
        min = parseFloat((Math.random() * 0.5 + 1.2).toFixed(2));
        max = parseFloat((Math.random() * 1.0 + 2.5).toFixed(2));
        topo = parseFloat((Math.random() * 5 + 3).toFixed(2));
      } else if (vela === '30X') {
        min = parseFloat((Math.random() * 0.8 + 1.5).toFixed(2));
        max = parseFloat((Math.random() * 1.5 + 3.0).toFixed(2));
        topo = parseFloat((Math.random() * 8 + 4).toFixed(2));
      }
      
      const sucesso = Math.floor(Math.random() * 15) + 80;
      
      porcentagem.textContent = '0%';
      animarPorcentagem(porcentagem, sucesso);
      porcentagem.style.color = sucesso >= 80 ? '#00ff88' : '#ff8800';
      
      rangeMin.textContent = '0.00';
      rangeMax.textContent = '0.00';
      rangeTopo.textContent = '0.00';
      
      setTimeout(() => {
        animarNumero(rangeMin, min, 800);
        setTimeout(() => animarNumero(rangeMax, max, 800), 300);
        setTimeout(() => animarNumero(rangeTopo, topo, 800), 600);
      }, 200);
      
      document.getElementById('iaDescricao').textContent = 
        `🎯 Analisando vela ${vela} | Estratégia ${ia.estrategia}`;
      
      document.getElementById('iaPassos').innerHTML = `
        <span>✅ Padrão ${vela} identificado</span>
        <span>🎯 Entrada: ${min}x - ${max}x</span>
        <span>📈 Topo estimado: ${topo}x</span>
      `;
      
      const status = document.getElementById('statusRastreador');
      status.innerHTML = `
        🧠 IA PRONTA<br>
        <span class="status-sub">Entrada sugerida disponível abaixo</span>
      `;
      
      document.querySelector('.btn-desligar').style.display = 'block';
      
      sinalAtual = { tipo: vela, min: min, max: max, topo: topo };
      ia.atualizarInterfaceIA();
      
    } else {
      porcentagem.textContent = progresso + '%';
      document.getElementById('iaDescricao').textContent = 
        `🧠 Analisando padrões... ${progresso}%`;
    }
  }, 120);
};

window.desligarRastreador = function() {
  if (intervaloRastreador) {
    clearInterval(intervaloRastreador);
    intervaloRastreador = null;
  }
  
  rastreadorLigado = false;
  velaSelecionada = null;
  
  const btn = document.getElementById('btnRastreador');
  btn.textContent = '▶️ LIGAR RASTREADOR';
  btn.disabled = false;
  btn.style.opacity = '1';
  
  document.getElementById('areaIA').style.display = 'none';
  
  const status = document.getElementById('statusRastreador');
  status.innerHTML = `
    🔴 IA AGUARDANDO<br>
    <span class="status-sub">Escolha a vela e ative a IA para análise</span>
  `;
  
  document.getElementById('porcentagemSucesso').textContent = '0%';
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    btn.classList.remove('ativo');
  });
  
  document.querySelector('.btn-desligar').style.display = 'none';
  
  sinalAtual = null;
};

// ============================================================
// REGISTRAR RESULTADO NA IA (QUANDO CLICAR GREEN/RED)
// ============================================================
const marcarOriginal = marcar;
marcar = async function(tipo) {
  if (sinalAtual) {
    const tipoSinal = sinalAtual.tipo || '10X';
    const multiplicador = (sinalAtual.min + sinalAtual.max) / 2;
    ia.registrarResultado(tipoSinal, multiplicador, tipo.toLowerCase());
    sinalAtual = null;
  }
  await marcarOriginal(tipo);
};

// ============================================================
// LOG
// ============================================================
console.log("✅ App iniciado com sucesso!");
console.log("📧 Firebase Auth:", auth ? "conectado" : "falhou");
console.log("🔒 Login será salvo automaticamente!");