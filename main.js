import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, increment, collection, getDocs } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Atualizar GREEN/RED em tempo real
onSnapshot(historicoRef, (docSnap) => {
  if(docSnap.exists()){
    document.getElementById("btnGreen").innerText = "GREEN ✅ " + docSnap.data().green;
    document.getElementById("btnRed").innerText = "RED ❌ " + docSnap.data().red;
  }
});

// Funções de login e registro
window.entrar = async function(){
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const userDoc = doc(db, "usuarios", email);
  const snap = await getDoc(userDoc);

  if(!snap.exists()){
    alert("Usuário não encontrado");
    return;
  }

  if(snap.data().senha === senha){
    document.getElementById("login").style.display="none";
    document.getElementById("painel").style.display="flex";

    if(snap.data().adm){
      document.getElementById("admBotaoContainer").style.display="block";
      localStorage.setItem("admUser", email);
    }
  }else{
    alert("Senha incorreta");
  }
};

window.registrar = async function(){
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if(!email || !senha){
    alert("Preencha todos os campos");
    return;
  }

  const userDoc = doc(db, "usuarios", email);
  const snap = await getDoc(userDoc);

  if(snap.exists()){
    alert("Usuário já cadastrado");
    return;
  }

  await setDoc(userDoc, { senha: senha, adm:false });
  alert("Usuário registrado com sucesso!");
};

// ADM
window.abrirADM = async function(){
  document.getElementById("painelADM").style.display="flex";
  const usuariosList = document.getElementById("usuariosList");
  usuariosList.innerHTML = "";

  const col = collection(db,"usuarios");
  const snapshot = await getDocs(col);

  snapshot.forEach((docu)=>{
    const data = docu.data();
    const div = document.createElement("div");
    div.style.border="1px solid #c9a227";
    div.style.margin="5px";
    div.style.padding="5px";
    div.innerHTML = `<b>${docu.id}</b> - ADM: ${data.adm} 
      <button onclick="tornarADM('${docu.id}')">Dar ADM</button>
      <button onclick="alterarSenha('${docu.id}')">Alterar Senha</button>`;
    usuariosList.appendChild(div);
  });
};

window.tornarADM = async function(email){
  const userDoc = doc(db,"usuarios",email);
  await updateDoc(userDoc,{adm:true});
  alert(email+" agora é ADM!");
};

window.alterarSenha = async function(email){
  const nova = prompt("Digite a nova senha para "+email);
  if(nova) {
    const userDoc = doc(db,"usuarios",email);
    await updateDoc(userDoc,{senha:nova});
    alert("Senha alterada!");
  }
};

// Green/Red
window.addGreen = async function(){
  await updateDoc(historicoRef,{green:increment(1)});
};

window.addRed = async function(){
  await updateDoc(historicoRef,{red:increment(1)});
};