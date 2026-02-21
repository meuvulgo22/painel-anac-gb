import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, collection, getDocs, updateDoc, onSnapshot, increment, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

// ELEMENTOS
const loginDiv = document.getElementById("login");
const cadastroDiv = document.getElementById("cadastro");
const painelDiv = document.getElementById("painel");
const painelADM = document.getElementById("painelADM");
const btnPainelADM = document.getElementById("btnPainelADM");

// FUNÇÕES LOGIN/CADASTRO
function mostrarCadastro(){loginDiv.style.display="none"; cadastroDiv.style.display="flex";}
function mostrarLogin(){cadastroDiv.style.display="none"; loginDiv.style.display="flex";}

window.cadastrar = async function(){
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try{
    await createUserWithEmailAndPassword(auth,email,senha);
    alert("Cadastro realizado!");
    mostrarLogin();
  }catch(e){alert(e.message);}
}

window.login = async function(){
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try{
    await signInWithEmailAndPassword(auth,email,senha);
  }catch(e){alert(e.message);}
}

// AUTENTICAÇÃO E PAINEL
onAuthStateChanged(auth,user=>{
  if(user){
    loginDiv.style.display="none";
    cadastroDiv.style.display="none";
    painelDiv.style.display="block";

    // Botão ADM apenas para admin
    btnPainelADM.style.display = (user.email === "gbx100k@gmail.com") ? "block" : "none";

  } else {
    loginDiv.style.display="flex";
    painelDiv.style.display="none";
    painelADM.style.display="none";
  }
});

// ===== CONTADOR GLOBAL =====
const refGlobal = doc(db,"historico","global");
onSnapshot(refGlobal,docSnap=>{
  if(docSnap.exists()){
    document.getElementById("contadorGlobal").innerText="Global: "+docSnap.data().green+" Green | "+docSnap.data().red+" Red";
  }
});

window.addGreen = async ()=>{await updateDoc(refGlobal,{green:increment(1)});}
window.addRed = async ()=>{await updateDoc(refGlobal,{red:increment(1)});}

// ===== JOGO =====
let bloqueado=false, intervalo, animacaoMulti, avaliacaoFeita=false, jogoAtual=null;

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
      if(multi>=limite) clearInterval(animacaoMulti);
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
}

function iniciarTimer(minutos){
  bloqueado=true;
  let tempo= minutos*60;
  clearInterval(intervalo);
  intervalo=setInterval(()=>{
    tempo--;
    document.getElementById("timer").innerText="Nova oportunidade em: "+tempo+"s";
    if(tempo<=0){
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

window.marcar=function(tipo){
  if(avaliacaoFeita) return;
  avaliacaoFeita=true;
  document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
  document.getElementById("tipoEnviado").innerText="Enviada como "+tipo;
  document.getElementById("btnGreen").disabled=true;
  document.getElementById("btnRed").disabled=true;

  // Atualiza contador global
  onAuthStateChanged(auth,user=>{
    if(user && user.email==="gbx100k@gmail.com"){
      updateDoc(refGlobal,(tipo==="GREEN")?{green:increment(1)}:{red:increment(1)});
    }
  });
}

// ===== PAINEL ADM =====
window.abrirADM=function(){
  painelADM.style.display="block";
  painelDiv.style.display="none";
  carregarUsuarios();
}

window.fecharADM=function(){
  painelADM.style.display="none";
  painelDiv.style.display="block";
}

// Listar usuários
async function carregarUsuarios(){
  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML="";
  const snapshot = await getDocs(collection(db,"usuarios"));
  snapshot.forEach(docu=>{
    const data=docu.data();
    const div = document.createElement("div");
    div.innerHTML=`<b>${docu.id}</b> | <button onclick="mudarSenha('${docu.id}')">Mudar Senha</button> | Admin: ${data.admin ? "Sim":"Não"} <button onclick="toggleADM('${docu.id}')">Alternar ADM</button>`;
    lista.appendChild(div);
  });
}

// Mudar senha
window.mudarSenha=async function(uid){
  const nova = prompt("Digite a nova senha para "+uid);
  if(nova){
    alert("No front-end você não pode alterar a senha de outros usuários diretamente sem Admin SDK. Use Firebase Console para isso.");
  }
}

// Alternar ADM
window.toggleADM=async function(uid){
  const refUser = doc(db,"usuarios",uid);
  const docSnap = await getDoc(refUser);
  if(docSnap.exists()){
    const adminAtual = docSnap.data().admin || false;
    await updateDoc(refUser,{admin:!adminAtual});
    carregarUsuarios();
  }
}