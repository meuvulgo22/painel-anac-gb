import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updatePassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// LOGIN / CADASTRO
function mostrarCadastro() {
  document.getElementById("login").style.display = "none";
  document.getElementById("cadastro").style.display = "flex";
}
function mostrarLogin() {
  document.getElementById("cadastro").style.display = "none";
  document.getElementById("login").style.display = "flex";
}

window.cadastrar = async () => {
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try {
    const cred = await createUserWithEmailAndPassword(auth,email,senha);
    await setDoc(doc(db,"users",cred.user.uid),{email:email,adm:false});
    alert("Cadastro realizado!");
    mostrarLogin();
  } catch(e){alert(e.message);}
}

window.login = async () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try{
    await signInWithEmailAndPassword(auth,email,senha);
  }catch(e){alert(e.message);}
}

// ======= AUTENTICAÇÃO E PAINEL =======
onAuthStateChanged(auth,user=>{
  if(user){
    document.getElementById("login").style.display="none";
    document.getElementById("cadastro").style.display="none";
    document.getElementById("painel").style.display="block";

    // ADM
    if(user.email==="gbx100k@gmail.com") mostrarADM();
  }else{
    document.getElementById("painel").style.display="none";
  }
});

// ======= CONTADOR GREEN/RED =======
const ref = doc(db,"historico","global");
onSnapshot(ref,docSnap=>{
  if(docSnap.exists()){
    document.getElementById("contadorGlobal").innerText="Global: "+docSnap.data().green+" Green | "+docSnap.data().red+" Red";
  }
});

window.addGreen = async ()=>{await updateDoc(ref,{green:increment(1)});}
window.addRed = async ()=>{await updateDoc(ref,{red:increment(1)});}

// ======= JOGO =======
let bloqueado=false;
let avaliacaoFeita=false;
let jogoAtual=null;

window.gerar = (jogo)=>{
  if(bloqueado){alert("Aguarde o tempo acabar.");return;}
  jogoAtual=jogo.toLowerCase();
  document.getElementById("avaliacao").style.display="block";
  avaliacaoFeita=false;
  document.getElementById("btnGreen").disabled=false;
  document.getElementById("btnRed").disabled=false;
  let minutos=Math.floor(Math.random()*2)+1;
  iniciarTimer(minutos);
};

function iniciarTimer(minutos){
  bloqueado=true;
  let tempoRestante=minutos*60;
  const intervalo=setInterval(()=>{
    tempoRestante--;
    document.getElementById("timer").innerText="Nova oportunidade em: "+tempoRestante+"s";
    if(tempoRestante<=0){
      clearInterval(intervalo);
      bloqueado=false;
      avaliacaoFeita=false;
      document.getElementById("btnGreen").disabled=false;
      document.getElementById("btnRed").disabled=false;
      document.getElementById("timer").innerText="";
    }
  },1000);
}

window.marcar=(tipo)=>{
  if(avaliacaoFeita) return;
  avaliacaoFeita=true;
  document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
  document.getElementById("tipoEnviado").innerText="Enviada como "+tipo;
  document.getElementById("btnGreen").disabled=true;
  document.getElementById("btnRed").disabled=true;

  // Atualiza global se ADM
  onAuthStateChanged(auth,user=>{
    if(user && user.email==="gbx100k@gmail.com"){
      updateDoc(ref,(tipo==="GREEN")?{green:increment(1)}:{red:increment(1)});
    }
  });
}

// ======= FUNÇÃO ADM =======
async function mostrarADM(){
  document.getElementById("admPanel").style.display="block";
  const col = collection(db,"users");
  const listDiv = document.getElementById("usuariosList");
  listDiv.innerHTML="";

  const snapshot = await getDocs(col);
  snapshot.forEach(docu=>{
    const data = docu.data();
    const div = document.createElement("div");
    div.className="user-item";
    div.innerHTML=`${data.email} - ADM: ${data.adm} 
      <button onclick="tornarADM('${docu.id}')">Tornar ADM</button>
      <button onclick="alterarSenha('${docu.id}')">Alterar Senha</button>`;
    listDiv.appendChild(div);
  });
}

window.tornarADM = async (uid)=>{
  await updateDoc(doc(db,"users",uid),{adm:true});
  mostrarADM();
}

window.alterarSenha = async (uid)=>{
  const nova = prompt("Digite a nova senha:");
  if(!nova) return;
  try{
    const user = await getDoc(doc(db,"users",uid));
    // Envia email de reset
    await sendPasswordResetEmail(auth,user.data().email);
    alert("Email de reset enviado para "+user.data().email);
  }catch(e){alert(e.message);}
}