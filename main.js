<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, increment, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ------------------ FIREBASE ------------------
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

const historicoRef = doc(db, "historico", "global");
const usuariosRef = collection(db, "usuarios");

let usuarioLogado = null;
let bloqueado=false;
let tempoRestante=0;
let intervalo;
let animacaoMulti;
let avaliacaoFeita=false;

// ------------------ ATUALIZA GREEN/RED ------------------
onSnapshot(historicoRef, (docSnap) => {
  if(docSnap.exists()){
    document.getElementById("btnGreen").innerText = `GREEN ✅ (${docSnap.data().green})`;
    document.getElementById("btnRed").innerText = `RED ❌ (${docSnap.data().red})`;
  }
});

// ------------------ LOGIN ------------------
window.entrar = async function(){
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  if(!email || !senha){alert("Preencha os campos!"); return;}
  const userDoc = doc(db, "usuarios", email);
  const snap = await getDoc(userDoc);

  if(snap.exists() && snap.data().senha === senha){
    usuarioLogado = email;
    localStorage.setItem("usuarioLogado", email);
    document.getElementById("login").style.display="none";
    document.getElementById("painel").style.display="block";
    if(snap.data().adm) mostrarPainelADM();
  } else {
    alert("Usuário ou senha incorreta!");
  }
}

// ------------------ CADASTRO ------------------
window.registrar = async function(){
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  if(!email || !senha){alert("Preencha os campos!"); return;}
  const userDoc = doc(db, "usuarios", email);
  const snap = await getDoc(userDoc);
  if(snap.exists()){alert("Usuário já existe!"); return;}
  await setDoc(userDoc, {senha, adm:false});
  alert("Usuário registrado!");
}

// ------------------ PAINEL ADM ------------------
function mostrarPainelADM(){
  document.getElementById("painelADM").style.display="block";
  atualizarUsuariosADM();
}

async function atualizarUsuariosADM(){
  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML = "";
  const snapshot = await getDocs(usuariosRef);
  snapshot.forEach(docu => {
    const u = docu.data();
    const div = document.createElement("div");
    div.innerHTML = `
      ${docu.id} - ADM: ${u.adm} 
      <button onclick="mudarSenha('${docu.id}')">Mudar Senha</button>
    `;
    lista.appendChild(div);
  });
}

window.tornarADM = async function(){
  const novoADM = document.getElementById("novoADM").value;
  if(!novoADM){alert("Digite email"); return;}
  const docRef = doc(db, "usuarios", novoADM);
  await updateDoc(docRef, {adm:true});
  alert(novoADM + " agora é ADM!");
  atualizarUsuariosADM();
}

window.mudarSenha = async function(email){
  const nova = prompt("Digite nova senha para " + email);
  if(!nova) return;
  await updateDoc(doc(db, "usuarios", email), {senha:nova});
  alert("Senha alterada!");
}

// ------------------ GREEN / RED ------------------
window.addGreen = async function(){ await updateDoc(historicoRef, {green: increment(1)}); };
window.addRed = async function(){ await updateDoc(historicoRef, {red: increment(1)}); };

// ------------------ FUNÇÕES DE GERAR ------------------
window.gerar = function(jogo){
  if(bloqueado){alert("Aguarde o tempo acabar."); return;}

  document.getElementById("avaliacao").style.display="flex";
  document.getElementById("resultadoAvaliacao").innerText="";
  document.getElementById("tipoEnviado").innerText="";
  avaliacaoFeita=false;

  let minutos=Math.floor(Math.random()*2)+1;

  // Aviator
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

  // Tigre/Touro
  if(jogo==="Tigre" || jogo==="Touro"){
    let op=document.getElementById("oportunidade");
    let bet = jogo==="Tigre" ? (Math.random()<0.5?0.40:0.80) : (Math.random()<0.5?0.50:1.00);
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

// ------------------ TIMER ------------------
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

// ------------------ AVALIAÇÃO ------------------
window.marcar = function(tipo){
  if(avaliacaoFeita) return;
  avaliacaoFeita=true;
  document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
  document.getElementById("tipoEnviado").innerText="Enviada como "+tipo;
  document.getElementById("btnGreen").disabled=true;
  document.getElementById("btnRed").disabled=true;
}
</script>