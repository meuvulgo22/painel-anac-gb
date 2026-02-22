import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginDiv = document.getElementById("login");
const cadastroDiv = document.getElementById("cadastro");
const painelDiv = document.getElementById("painel");

const btnGreen = document.getElementById("btnGreen");
const btnRed = document.getElementById("btnRed");
const contadorGlobal = document.getElementById("contadorGlobal");
const resultadoAvaliacao = document.getElementById("resultadoAvaliacao");
const tipoEnviado = document.getElementById("tipoEnviado");

const refGlobal = doc(db,"historico","global");

// cria documento se não existir
async function garantirDocumento(){
  await setDoc(refGlobal,{ green:0, red:0 },{ merge:true });
}
garantirDocumento();

// contador em tempo real
onSnapshot(refGlobal,(snap)=>{
  if(snap.exists()){
    const data = snap.data();
    contadorGlobal.innerText =
      "Global: " + data.green + " Green | " + data.red + " Red";
  }
});

function mostrarCadastro(){
  loginDiv.style.display="none";
  cadastroDiv.style.display="flex";
}
window.mostrarCadastro = mostrarCadastro;

function mostrarLogin(){
  cadastroDiv.style.display="none";
  loginDiv.style.display="flex";
}
window.mostrarLogin = mostrarLogin;

window.cadastrar = async function(){
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  await createUserWithEmailAndPassword(auth,email,senha);
};

window.login = async function(){
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  await signInWithEmailAndPassword(auth,email,senha);
};

onAuthStateChanged(auth,(user)=>{
  if(user){
    loginDiv.style.display="none";
    cadastroDiv.style.display="none";
    painelDiv.style.display="flex";
  } else {
    loginDiv.style.display="flex";
    cadastroDiv.style.display="none";
    painelDiv.style.display="none";
  }
});

btnGreen.addEventListener("click",async()=>{
  await updateDoc(refGlobal,{ green: increment(1) });
  resultadoAvaliacao.innerText="✅ Avaliação enviada!";
  tipoEnviado.innerText="Enviada como GREEN";
});

btnRed.addEventListener("click",async()=>{
  await updateDoc(refGlobal,{ red: increment(1) });
  resultadoAvaliacao.innerText="✅ Avaliação enviada!";
  tipoEnviado.innerText="Enviada como RED";
});