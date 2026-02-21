import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, getDocs, updateDoc, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
const refGlobal = doc(db, "historico", "global");
const refUsers = collection(db, "users");

// LOGIN/CADASTRO
window.mostrarCadastro = () => { document.getElementById("login").style.display="none"; document.getElementById("cadastro").style.display="flex"; }
window.mostrarLogin = () => { document.getElementById("cadastro").style.display="none"; document.getElementById("login").style.display="flex"; }

window.cadastrar = async () => {
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try { await createUserWithEmailAndPassword(auth,email,senha); alert("Usuário criado!"); mostrarLogin(); }
  catch(e){ alert(e.message); }
}

window.login = async () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try { await signInWithEmailAndPassword(auth,email,senha); }
  catch(e){ alert(e.message); }
}

// VERIFICA USUÁRIO LOGADO
onAuthStateChanged(auth, async (user)=>{
  if(user){
    document.getElementById("login").style.display="none";
    document.getElementById("cadastro").style.display="none";
    document.getElementById("painel").style.display="block";

    // ADM
    if(user.email==="gbx100k@gmail.com") document.getElementById("btnADM").style.display="inline-block";
    else document.getElementById("btnADM").style.display="none";

    loadUsers();
  }
});

// GREEN/RED GLOBAL
onSnapshot(refGlobal, docSnap=>{
  if(docSnap.exists()){
    document.getElementById("green").innerText = docSnap.data().green;
    document.getElementById("red").innerText = docSnap.data().red;
  }
});
window.addGreen = async()=>{ await updateDoc(refGlobal,{green:increment(1)}); }
window.addRed = async()=>{ await updateDoc(refGlobal,{red:increment(1)}); }

// CARREGAR USUÁRIOS PARA ADM
async function loadUsers(){
  const lista = document.getElementById("userList");
  if(!lista) return;
  lista.innerHTML="";
  const snapshot = await getDocs(refUsers);
  snapshot.forEach(docu=>{
    const data = docu.data();
    const li = document.createElement("li");
    li.innerHTML = `${data.email} - Admin: ${data.isAdmin ? "Sim" : "Não"} 
      <button onclick="toggleAdmin('${docu.id}',${data.isAdmin})">Alterar Admin</button> 
      <button onclick="resetSenha('${docu.id}')">Alterar Senha</button>`;
    lista.appendChild(li);
  });
}

// ALTERAR ADMIN
window.toggleAdmin = async(uid,atual)=>{
  await updateDoc(doc(db,"users",uid),{isAdmin:!atual});
  loadUsers();
}

// ALTERAR SENHA
window.resetSenha = async(uid)=>{
  const nova = prompt("Digite nova senha:");
  if(!nova) return;
  await updateDoc(doc(db,"users",uid),{password:nova});
  alert("Senha alterada no Firestore (Auth precisa reconfiguração manual).");
}

// ABRIR PAINEL ADM
window.abrirADM = ()=>{ document.getElementById("admPanel").style.display="block"; }