import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, collection, getDoc, getDocs, updateDoc, onSnapshot, increment } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCuPyJWr0aDNQ7vUiQ2JxzqNpBxZXozoQg",
  authDomain: "painel-anac-gb.firebaseapp.com",
  projectId: "painel-anac-gb",
  storageBucket: "painel-anac-gb.firebasestorage.app",
  messagingSenderId: "941890806312",
  appId: "1:941890806312:web:323f01daf1f9ddcf1a0b1d",
  measurementId: "G-HG4KDJBP3G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// REFERÊNCIAS
const globalRef = doc(db,"historico","global");

// ATUALIZAÇÃO EM TEMPO REAL DO GREEN/RED
onSnapshot(globalRef,(docSnap)=>{
  if(docSnap.exists()){
    document.getElementById("green").innerText = docSnap.data().green;
    document.getElementById("red").innerText = docSnap.data().red;
  }
});

// BOTÕES GREEN/RED GLOBAIS
window.addGreen = async()=>{await updateDoc(globalRef,{green:increment(1)});};
window.addRed = async()=>{await updateDoc(globalRef,{red:increment(1)});};

let usuarioAtual = null;
let bloqueado = false;
let tempoRestante = 0;
let intervalo;
let animacaoMulti;
let avaliacaoFeita = false;

// LOGIN
window.entrar = async function(){
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const userRef = doc(db,"users",email);
  const userSnap = await getDoc(userRef);

  if(userSnap.exists() && userSnap.data().senha===senha){
    usuarioAtual = userSnap.data();
    document.getElementById("login").style.display="none";
    document.getElementById("painel").style.display="block";

    // MOSTRAR ADM SE FOR ADM
    if(usuarioAtual.adm){
      document.getElementById("admPanel").style.display="block";
      carregarUsuarios();
    }
  } else alert("Email ou senha incorretos");
}

// CARREGAR USUÁRIOS PARA ADM
async function carregarUsuarios(){
  const usersCol = collection(db,"users");
  const snapshot = await getDocs(usersCol);
  const tabela = document.getElementById("usersTable");
  tabela.innerHTML = "<tr><th>Email</th><th>ADM</th><th>Ações</th></tr>";
  snapshot.forEach(doc=>{
    const u = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email}</td>
      <td>${u.adm}</td>
      <td>
        <button onclick="mudarSenha('${u.email}')">Senha</button>
        <button onclick="tornarAdm('${u.email}')">Tornar ADM</button>
      </td>`;
    tabela.appendChild(tr);
  });
}

// MUDAR SENHA
window.mudarSenha = async function(email){
  const novaSenha = prompt("Nova senha para "+email);
  if(novaSenha){
    await updateDoc(doc(db,"users",email),{senha:novaSenha});
    alert("Senha alterada!");
  }
}

// TORNAR ADM
window.tornarAdm = async function(email){
  await updateDoc(doc(db,"users",email),{adm:true});
  alert(email+" agora é ADM!");
}

// TIMER
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
      document.getElementById("resultadoAvaliacao").innerText="";
      document.getElementById("tipoEnviado").innerText="";
      document.getElementById("btnGreen").disabled=false;
      document.getElementById("btnRed").disabled=false;
      document.getElementById("timer").innerText="";
    }
  },1000);
}

// GERAR JOGOS
window.gerar = function(jogo){
  if(bloqueado){alert("Aguarde o tempo acabar."); return;}

  document.getElementById("avaliacao").style.display="block";
  avaliacaoFeita=false;
  document.getElementById("btnGreen").disabled=false;
  document.getElementById("btnRed").disabled=false;

  const minutos=Math.floor(Math.random()*2)+1;

  // AVIATOR
  if(jogo==="Aviator"){
    document.getElementById("aviatorVisual").style.display="block";
    let multi=1.00;
    let limite=(Math.random()*5.45 + 1).toFixed(2);
    clearInterval(animacaoMulti);
    animacaoMulti=setInterval(()=>{
      multi+=0.05;
      document.getElementById("multiplicador").innerText=multi.toFixed(2)+"X";
      if(multi>=limite) clearInterval(animacaoMulti);
    },100);
    iniciarTimer(minutos);
  }

  // TIGRE/TOURO
  if(jogo==="Tigre" || jogo==="Touro"){
    const op=document.getElementById("oportunidade");
    let bet = jogo==="Tigre"? (Math.random()<0.5?0.40:0.80) : (Math.random()<0.5?0.50:1.00);
    let normal=Math.floor(Math.random()*10)+1;
    let turbo=Math.floor(Math.random()*10)+1;
    op.innerHTML=`<b>✅ OPORTUNIDADE GERADA!</b><br><br>🦁 ${jogo} 🦁<br>⏰ Válido por: ${minutos} minuto(s)<br>💰 Bet: R$ ${bet.toFixed(2)}<br>👉 ${normal}x Normal<br>⚡ ${turbo}x Turbo`;
    op.style.display="block";
    iniciarTimer(minutos);
  }
}

// MARCAR GREEN/RED
window.marcar = function(tipo){
  if(avaliacaoFeita) return;
  avaliacaoFeita=true;
  document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
  document.getElementById("tipoEnviado").innerText="Enviada como "+tipo;
  document.getElementById("btnGreen").disabled=true;
  document.getElementById("btnRed").disabled=true;
  if(tipo==="GREEN") addGreen();
  if(tipo==="RED") addRed();
}