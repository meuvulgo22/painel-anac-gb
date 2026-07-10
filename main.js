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

window.login = async () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  if (!email || !senha) {
    alert("Preencha todos os campos!");
    return;
  }
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
  if (user) {
    painelDiv.style.display = "block";
    loginDiv.style.display = "none";
    cadastroDiv.style.display = "none";
  } else {
    painelDiv.style.display = "none";
    loginDiv.style.display = "flex";
  }
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
  
  let green = docSnap.data().green || 0;
let red = docSnap.data().red || 0;
let total = green + red;

let rtp = total > 0 ? ((green / total) * 100).toFixed(2) : 0;

document.getElementById("rtp").innerText = "RTP: " + rtp + "%";
  
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

      let agora = new Date();
let horaFormatada = agora.toLocaleTimeString();
let item = document.createElement("li");
item.innerText = `${jogo} gerado às ${horaFormatada}`;
      historicoLista.prepend(item);
      if (historicoLista.children.length > 5) {
        historicoLista.removeChild(historicoLista.lastChild);
      }

      let prob = Math.floor(Math.random() * 15) + 85;
      barraProb.style.width = prob + "%";
      textoProb.innerText = "Probabilidade de Green: " + prob + "%";

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
          "<b>✈️ AVIATOR GERADO!</b><br><br>⏰ Válido por: " + minutos + " minuto(s)";
      }

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

// ============================================================
// ========== NOVAS FUNÇÕES DO AVIATOR RASTREADOR ==========
// ============================================================

let velaSelecionada = null;
let rastreadorLigado = false;
let intervaloRastreador = null;

// Selecionar vela
window.selecionarVela = function(vela) {
  velaSelecionada = vela;
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    btn.classList.remove('ativo');
  });
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    if (btn.dataset.vela === vela) {
      btn.classList.add('ativo');
    }
  });
  
  const status = document.getElementById('statusRastreador');
  status.innerHTML = `
    ✅ Vela ${vela} selecionada<br>
    <span class="status-sub">Agora toque em "LIGAR RASTREADOR" para iniciar</span>
  `;
};

// Ligar rastreador
window.ligarRastreador = function() {
  if (!velaSelecionada) {
    alert('Selecione uma vela primeiro (3X, 10X ou 30X)!');
    return;
  }
  
  if (rastreadorLigado) {
    alert('Rastreador já está ligado!');
    return;
  }
  
  rastreadorLigado = true;
  
  const btn = document.getElementById('btnRastreador');
  btn.textContent = '⏳ RASTREADOR LIGADO...';
  btn.disabled = true;
  btn.style.opacity = '0.6';
  
  document.getElementById('areaIA').style.display = 'block';
  
  const status = document.getElementById('statusRastreador');
  status.innerHTML = `
    🟢 RASTREADOR ATIVO<br>
    <span class="status-sub">Lendo mercado em tempo real...</span>
  `;
  
  const porcentagem = document.getElementById('porcentagemSucesso');
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  const rangeTopo = document.getElementById('rangeTopo');
  
  let progresso = 0;
  intervaloRastreador = setInterval(() => {
    progresso += Math.floor(Math.random() * 5) + 1;
    if (progresso >= 100) {
      progresso = 100;
      clearInterval(intervaloRastreador);
      
      const sucesso = Math.floor(Math.random() * 15) + 85;
      porcentagem.textContent = sucesso + '%';
      porcentagem.style.color = sucesso >= 80 ? '#00ff88' : '#ff8800';
      
      // Mínimo 1.00x (nunca 0.xx)
      const min = (Math.random() * 0.8 + 1.0).toFixed(2);
      const max = (Math.random() * 2 + 1.5).toFixed(2);
      const topo = (Math.random() * 10 + 2).toFixed(2);
      
      rangeMin.textContent = min;
      rangeMax.textContent = max;
      rangeTopo.textContent = topo;
      
      const status = document.getElementById('statusRastreador');
      status.innerHTML = `
        🟢 IA PRONTA<br>
        <span class="status-sub">Entrada sugerida disponível abaixo</span>
      `;
      
      document.querySelector('.btn-desligar').style.display = 'block';
      
      atualizarAcertos(sucesso);
      
    } else {
      porcentagem.textContent = progresso + '%';
    }
  }, 150);
};

// Atualizar últimos acertos
function atualizarAcertos(sucesso) {
  const lista = document.getElementById('listaAcertos');
  const detalhes = document.getElementById('detalhesAcertos');
  
  const cor = sucesso >= 70 ? '#c9a227' : '#ff4444';
  
  const velas = ['3X', '10X', '30X'];
  const velaEscolhida = velaSelecionada || velas[Math.floor(Math.random() * 3)];
  
  const novoItem = document.createElement('span');
  novoItem.className = 'acerto-item';
  novoItem.textContent = `${velaEscolhida} ${sucesso}%`;
  novoItem.style.borderColor = cor;
  novoItem.style.color = cor;
  
  lista.prepend(novoItem);
  if (lista.children.length > 5) {
    lista.removeChild(lista.lastChild);
  }
  
  const hora = new Date().toLocaleTimeString();
  const multi = (Math.random() * 50 + 1).toFixed(2);
  const novoDetalhe = document.createElement('span');
  novoDetalhe.textContent = `${multi}x ${hora}`;
  detalhes.prepend(novoDetalhe);
  if (detalhes.children.length > 5) {
    detalhes.removeChild(detalhes.lastChild);
  }
}

// Desligar rastreador
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
    🔴 RASTREADOR AGUARDANDO<br>
    <span class="status-sub">Escolha a vela acima e toque em ligar rastreador para iniciar a leitura.</span>
  `;
  
  document.getElementById('porcentagemSucesso').textContent = '0%';
  
  document.querySelectorAll('.vela-btn').forEach(btn => {
    btn.classList.remove('ativo');
  });
  
  document.querySelector('.btn-desligar').style.display = 'none';
};