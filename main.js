import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// LOGIN/CADASTRO
function mostrarCadastro(){document.getElementById("login").style.display="none";document.getElementById("cadastro").style.display="flex";}
function mostrarLogin(){document.getElementById("cadastro").style.display="none";document.getElementById("login").style.display="flex";}

window.cadastrar = async function(){
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth,email,senha);
    // salva no Firestore
    await setDoc(doc(db,"usuarios",userCredential.user.uid),{
      email:userCredential.user.email,
      adm:false
    });
    alert("Cadastro realizado!");
    mostrarLogin();
  } catch(e){alert(e.message);}
}

window.login = async function(){
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try {
    await signInWithEmailAndPassword(auth,email,senha);
  } catch(e){alert(e.message);}
}

// PAINEL
let jogoAtual=null;
let bloqueado=false;
let intervalo;
let animacaoMulti;
let avaliacaoFeita=false;

onAuthStateChanged(auth, async (user)=>{
  if(user){
    document.getElementById("login").style.display="none";
    document.getElementById("cadastro").style.display="none";
    
    // verifica se é ADM
    const usuarioDoc = await getDoc(doc(db,"usuarios",user.uid));
    let isADM = false;
    if(usuarioDoc.exists()){
      isADM = usuarioDoc.data().adm || user.email==="gbx100k@gmail.com";
    }

    if(isADM){
      document.getElementById("painelADM").style.display="flex";
      carregarUsuariosADM();
    } else {
      document.getElementById("painel").style.display="flex";
    }

    // contador global sempre visível para todos
    onSnapshot(doc(db,"historico","global"),(docSnap)=>{
      if(docSnap.exists()){
        document.getElementById("contadorGlobal").innerText="Global: "+docSnap.data().green+" Green | "+docSnap.data().red+" Red";
      }
    });
  }
});

// GERAÇÃO DE USUÁRIOS ADM
async function carregarUsuariosADM(){
  const snapshot = await getDocs(collection(db,"usuarios"));
  const container = document.getElementById("usuariosADM");
  container.innerHTML="";
  snapshot.forEach(docu=>{
    const data = docu.data();
    const div = document.createElement("div");
    div.classList.add("userADM");
    div.innerHTML = `
      <span>${data.email}</span>
      <input type="password" placeholder="Nova senha" id="senha_${docu.id}">
      <button onclick="alterarSenha('${docu.id}')">Alterar senha</button>
      <button onclick="promoverADM('${docu.id}')">Tornar ADM</button>
    `;
    container.appendChild(div);
  });
}

// ALTERAR SENHA
window.alterarSenha = async function(uid){
  const input = document.getElementById("senha_"+uid);
  const novaSenha = input.value;
  if(!novaSenha) return alert("Digite a nova senha");
  const userDoc = doc(db,"usuarios",uid);
  try {
    await updatePassword(auth.currentUser,{password:novaSenha});
    alert("Senha alterada!");
    input.value="";
  } catch(e){alert(e.message);}
}

// PROMOVER CO-ADM
window.promoverADM = async function(uid){
  try {
    await updateDoc(doc(db,"usuarios",uid),{adm:true});
    alert("Usuário promovido a ADM!");
    carregarUsuariosADM();
  } catch(e){alert(e.message);}
}

// FUNÇÕES DE JOGO (Tigre, Touro, Aviator)
window.iniciarTimer = function(minutos){
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
      if(multi>=limite) clearInterval(animacaoMulti);
    },100);
    iniciarTimer(minutos);
  }

  if((jogo==="Tigre" || jogo==="Touro")){
    let op=document.getElementById("oportunidade");
    let bet=(jogo==="Tigre")?(Math.random()<0.5?0.40:0.80):(Math.random()<0.5?0.50:1.00);
    let normal=Math.floor(Math.random()*10)+1;
    let turbo=Math.floor(Math.random()*10)+1;
    op.innerHTML=`<b>✅ OPORTUNIDADE GERADA!</b><br><br>🦁 ${jogo} 🦁<br>⏰ Válido por: ${minutos} minuto(s)<br>💰 Bet: R$ ${bet.toFixed(2)}<br>👉 ${normal}x Normal<br>⚡ ${turbo}x Turbo`;
    op.style.display="block";
    iniciarTimer(minutos);
  }
}

window.marcar = function(tipo){
  if(avaliacaoFeita||!jogoAtual) return;
  avaliacaoFeita=true;
  document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
  document.getElementById("tipoEnviado").innerText="Enviada como "+tipo;
  document.getElementById("btnGreen").disabled=true;
  document.getElementById("btnRed").disabled=true;

  // Atualiza global para todos
  const ref = doc(db,"historico","global");
  updateDoc(ref,(tipo==="GREEN")?{green:increment(1)}:{red:increment(1)});
}

// VOLTAR DO ADM PARA PAINEL NORMAL
window.mostrarPainelNormal = function(){
  document.getElementById("painelADM").style.display="none";
  document.getElementById("painel").style.display="flex";
}