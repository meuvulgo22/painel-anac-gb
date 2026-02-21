// ===================== FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Config Firebase
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

// ===================== ELEMENTOS =====================
const loginDiv = document.getElementById("login");
const cadastroDiv = document.getElementById("cadastro");
const painelDiv = document.getElementById("painel");

const btnGreen = document.getElementById("btnGreen");
const btnRed = document.getElementById("btnRed");
const resultadoAvaliacao = document.getElementById("resultadoAvaliacao");
const tipoEnviado = document.getElementById("tipoEnviado");
const contadorGlobal = document.getElementById("contadorGlobal");

// ===================== LOGIN / CADASTRO =====================
function mostrarCadastro(){ loginDiv.style.display="none"; cadastroDiv.style.display="flex"; }
function mostrarLogin(){ cadastroDiv.style.display="none"; loginDiv.style.display="flex"; }

window.cadastrar = async function(){
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try {
    await createUserWithEmailAndPassword(auth,email,senha);
    alert("Cadastro realizado!");
    mostrarLogin();
  } catch(e){ alert(e.message); }
}

window.login = async function(){
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try {
    await signInWithEmailAndPassword(auth,email,senha);
  } catch(e){ alert(e.message); }
}

// Persistência de login
onAuthStateChanged(auth, user => {
  if(user){
    loginDiv.style.display="none";
    cadastroDiv.style.display="none";
    painelDiv.style.display="block";
    document.getElementById("avaliacao").style.display="block";
  } else {
    loginDiv.style.display="flex";
    cadastroDiv.style.display="none";
    painelDiv.style.display="none";
  }
});

// ===================== CONTADOR GLOBAL =====================
const refGlobal = doc(db,"historico","global");
onSnapshot(refGlobal, docSnap => {
  if(docSnap.exists()){
    contadorGlobal.innerText="Global: "+docSnap.data().green+" Green | "+docSnap.data().red+" Red";
  }
});

async function addGreen(){ await updateDoc(refGlobal,{green:increment(1)}); }
async function addRed(){ await updateDoc(refGlobal,{red:increment(1)}); }

// ===================== JOGO =====================
let bloqueado=false;
let tempoRestante=0;
let intervalo;
let animacaoMulti;
let avaliacaoFeita=false;
let jogoAtual=null;

window.gerar = function(jogo){
  if(bloqueado){ alert("Aguarde o tempo acabar."); return; }

  jogoAtual = jogo.toLowerCase();
  document.getElementById("avaliacao").style.display="block";
  resultadoAvaliacao.innerText="";
  tipoEnviado.innerText="";
  avaliacaoFeita=false;
  btnGreen.disabled=false;
  btnRed.disabled=false;

  let minutos = Math.floor(Math.random()*2)+1;

  // Aviator
  if(jogo==="Aviator"){
    document.getElementById("aviatorVisual").style.display="block";
    let multi=1.00;
    let limite=(Math.random()*5.45 + 1).toFixed(2);
    clearInterval(animacaoMulti);
    animacaoMulti=setInterval(()=>{
      multi+=0.05;
      document.getElementById("multiplicador").innerText=multi.toFixed(2)+"X";
      if(multi>=limite){ clearInterval(animacaoMulti); }
    },100);
    iniciarTimer(minutos);
  }

  // Tigre / Touro
  if(jogo==="Tigre" || jogo==="Touro"){
    let op=document.getElementById("oportunidade");
    let bet = (jogo==="Tigre") ? (Math.random()<0.5?0.40:0.80) : (Math.random()<0.5?0.50:1.00);
    let normal=Math.floor(Math.random()*10)+1;
    let turbo=Math.floor(Math.random()*10)+1;

    op.innerHTML=`
      <b>✅ OPORTUNIDADE GERADA!</b><br><br>
      🦁 ${jogo} 🦁<br>
      ⏰ Válido por: ${minutos} minuto(s)<br>
      💰 Bet: R$ ${bet.toFixed(2)}<br>
      👉 ${normal}x Normal<br>
      ⚡ ${turbo}x Turbo
    `;
    op.style.display="block";
    iniciarTimer(minutos);
  }
}

// ===================== TIMER =====================
function iniciarTimer(minutos){
  bloqueado=true;
  tempoRestante=minutos*60;
  clearInterval(intervalo);
  intervalo=setInterval(()=>{
    tempoRestante--;
    document.getElementById("timer").innerText="Nova oportunidade em: "+tempoRestante+"s";
    if(tempoRestante<=0){
      clearInterval(intervalo);
      bloqueado=false;
      avaliacaoFeita=false;
      resultadoAvaliacao.innerText="";
      tipoEnviado.innerText="";
      btnGreen.disabled=false;
      btnRed.disabled=false;
      document.getElementById("timer").innerText="";
    }
  },1000);
}

// ===================== AVALIAÇÃO =====================
window.marcar = function(tipo){
  if(avaliacaoFeita) return;
  avaliacaoFeita=true;

  resultadoAvaliacao.innerText="✅ Avaliação enviada!";
  tipoEnviado.innerText="Enviada como "+tipo;

  btnGreen.disabled=true;
  btnRed.disabled=true;

  if(tipo==="GREEN") addGreen();
  else addRed();
}