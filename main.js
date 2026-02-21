import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// CONFIG FIREBASE
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

// ===== LOGIN/CADASTRO =====
function mostrarCadastro(){document.getElementById("login").style.display="none";document.getElementById("cadastro").style.display="flex";}
function mostrarLogin(){document.getElementById("cadastro").style.display="none";document.getElementById("login").style.display="flex";}

window.cadastrar = async function(){
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try{
    await createUserWithEmailAndPassword(auth,email,senha);
    alert("Cadastro realizado!");
    mostrarLogin();
  }catch(e){alert(e.message);}
};

window.login = async function(){
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try{
    await signInWithEmailAndPassword(auth,email,senha);
  }catch(e){alert(e.message);}
};

// ===== PAINEL =====
let bloqueado=false;
let intervalo;
let animacaoMulti;
let avaliacaoFeita=false;
let jogoAtual=null;

onAuthStateChanged(auth,(user)=>{
  if(user){
    document.getElementById("login").style.display="none";
    document.getElementById("cadastro").style.display="none";
    document.getElementById("painel").style.display="block";
  }else{
    document.getElementById("login").style.display="flex";
    document.getElementById("cadastro").style.display="none";
    document.getElementById("painel").style.display="none";
  }
});

// Firestore - Contador global
const ref = doc(db,"historico","global");
onSnapshot(ref,(docSnap)=>{
  if(docSnap.exists()){
    document.getElementById("contadorGlobal").innerText="Global: "+docSnap.data().green+" Green | "+docSnap.data().red+" Red";
  }
});

window.addGreen = async function(){await updateDoc(ref,{green:increment(1)});};
window.addRed = async function(){await updateDoc(ref,{red:increment(1)});};

// ===== FUNÇÕES DE JOGO =====
function iniciarTimer(minutos){
  bloqueado=true;
  let tempoRestante=minutos*60;
  clearInterval(intervalo);
  intervalo=setInterval(()=>{
    tempoRestante--;
    document.getElementById("timer").innerText="Nova oportunidade em: "+tempoRestante+"s";
    if(tempoRestante<=0){
      clearInterval(intervalo);
      bloqueado=false;
      avaliacaoFeita=false;
      document.getElementById("resultadoAvaliacao").innerText="";
      document.getElementById("tipoEnviado").innerText="";
      document.getElementById("btnGreen").disabled=false;
      document.getElementById("btnRed").disabled=false;
      document.getElementById("timer").innerText="";
    }
  },1000);
}

window.gerar = function(jogo){
  if(bloqueado){alert("Aguarde o tempo acabar."); return;}
  jogoAtual=jogo.toLowerCase();
  document.getElementById("avaliacao").style.display="block";
  document.getElementById("resultadoAvaliacao").innerText="";
  document.getElementById("tipoEnviado").innerText="";
  avaliacaoFeita=false;
  document.getElementById("btnGreen").disabled=false;
  document.getElementById("btnRed").disabled=false;

  let minutos=Math.floor(Math.random()*2)+1;

  if(jogo==="Aviator"){
    document.getElementById("aviatorVisual").style.display="block";
    let multi=1.00;
    let limite=(Math.random()*5.45 + 1).toFixed(2);
    clearInterval(animacaoMulti);
    animacaoMulti=setInterval(()=>{
      multi+=0.05;
      document.getElementById("multiplicador").innerText=multi.toFixed(2)+"X";
      if(multi>=limite){clearInterval(animacaoMulti);}
    },100);
    iniciarTimer(minutos);
  }

  if(jogo==="Tigre" || jogo==="Touro"){
    let op=document.getElementById("oportunidade");
    let bet=(jogo==="Tigre")?(Math.random()<0.5?0.40:0.80):(Math.random()<0.5?0.50:1.00);
    let normal=Math.floor(Math.random()*10)+1;
    let turbo=Math.floor(Math.random()*10)+1;
    op.innerHTML=`<b>✅ OPORTUNIDADE GERADA!</b><br><br>🦁 ${jogo} 🦁<br>⏰ Válido por: ${minutos} minuto(s)<br>💰 Bet: R$ ${bet.toFixed(2)}<br>👉 ${normal}x Normal<br>⚡ ${turbo}x Turbo`;
    op.style.display="block";
    iniciarTimer(minutos);
  }
};

window.marcar = function(tipo){
  if(avaliacaoFeita||!jogoAtual)return;
  avaliacaoFeita=true;
  document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
  document.getElementById("tipoEnviado").innerText="Enviada como "+tipo;
  document.getElementById("btnGreen").disabled=true;
  document.getElementById("btnRed").disabled=true;
};