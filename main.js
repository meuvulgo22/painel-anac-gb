import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCuPyJWr0aDNQ7vUiQ2JxzqNpBxZXozoQg",
  authDomain: "painel-anac-gb.firebaseapp.com",
  projectId: "painel-anac-gb",
  storageBucket: "painel-anac-gb.appspot.com",
  messagingSenderId: "941890806312",
  appId: "1:941890806312:web:323f01daf1f9ddcf1a0b1d"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== LOGIN/CADASTRO =====
function mostrarCadastro(){ document.getElementById("login").style.display="none"; document.getElementById("cadastro").style.display="flex"; }
function mostrarLogin(){ document.getElementById("cadastro").style.display="none"; document.getElementById("login").style.display="flex"; }

window.cadastrar = async function(){
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try{
    await createUserWithEmailAndPassword(auth,email,senha);
    alert("Cadastro realizado!");
    mostrarLogin();
  }catch(e){ alert(e.message); }
}

window.login = async function(){
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try{
    await signInWithEmailAndPassword(auth,email,senha);
  }catch(e){ alert(e.message); }
}

// ===== AUTENTICAÇÃO =====
onAuthStateChanged(auth, user=>{
  if(user){
    document.getElementById("login").style.display="none";
    document.getElementById("cadastro").style.display="none";
    document.getElementById("painel").style.display="block";

    // ADM
    if(user.email === "gbx100k@gmail.com"){
      const admBtn = document.getElementById("admBtnContainer");
      admBtn.innerHTML = `<button onclick="abrirADM()">Abrir Painel ADM</button>`;
    }

    // Atualizar contador global em tempo real
    const refGlobal = doc(db,"historico","global");
    onSnapshot(refGlobal, snap=>{
      if(snap.exists()){
        document.getElementById("resultadoAvaliacao").innerText = `Global: ${snap.data().green} Green | ${snap.data().red} Red`;
      }
    });
  }
});

// ===== PAINEL ADM =====
window.abrirADM = function(){
  document.getElementById("painel").style.display="none";
  document.getElementById("painelADM").style.display="block";
}

window.mostrarUsuarios = async function(){
  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML = "<b>Carregando usuários...</b>";
  const usersCol = collection(db,"users");
  const snap = await getDoc(doc(db,"historico","global")); // só pra demo
  // Aqui você vai buscar usuários reais via Firestore, ex: users collection
  lista.innerHTML = "<b>Lista de usuários carregada</b>";
}

// ===== FUNÇÕES DE JOGO =====
// Copiar do seu código antigo: gerar(), marcar(), iniciarTimer()...