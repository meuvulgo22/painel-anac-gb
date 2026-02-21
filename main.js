import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// CONFIGURAÇÃO FIREBASE
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

// ELEMENTOS
const loginDiv = document.getElementById("login");
const cadastroDiv = document.getElementById("cadastro");
const painelDiv = document.getElementById("painel");

const btnLogin = document.getElementById("btnLogin");
const btnCadastro = document.getElementById("btnCadastro");
const btnLogout = document.getElementById("btnLogout");

const linkCadastro = document.getElementById("linkCadastro");
const linkLogin = document.getElementById("linkLogin");

const contadorGlobal = document.getElementById("contadorGlobal");

// MOSTRAR TELA
function mostrarLogin(){loginDiv.style.display="flex"; cadastroDiv.style.display="none";}
function mostrarCadastroFn(){loginDiv.style.display="none"; cadastroDiv.style.display="flex";}

// EVENTOS
linkCadastro.addEventListener("click", mostrarCadastroFn);
linkLogin.addEventListener("click", mostrarLogin);

// CADASTRO
btnCadastro.addEventListener("click", async ()=>{
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try{
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Cadastro realizado! Faça login.");
    mostrarLogin();
  }catch(e){alert("Erro: "+e.message);}
});

// LOGIN
btnLogin.addEventListener("click", async ()=>{
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try{
    await signInWithEmailAndPassword(auth, email, senha);
  }catch(e){alert("Erro: "+e.message);}
});

// LOGOUT
btnLogout.addEventListener("click", async ()=>{
  await signOut(auth);
  mostrarLogin();
});

// OBSERVAR AUTH STATE
onAuthStateChanged(auth, (user)=>{
  if(user){
    loginDiv.style.display="none";
    cadastroDiv.style.display="none";
    painelDiv.style.display="flex";

    // ADM
    if(user.email==="gbx100k@gmail.com"){
      contadorGlobal.style.display="block";
      const ref = doc(db, "historico", "global");
      onSnapshot(ref,(docSnap)=>{
        if(docSnap.exists()){
          contadorGlobal.innerText = `Global: ${docSnap.data().green} Green | ${docSnap.data().red} Red`;
        }
      });
    }else{
      contadorGlobal.style.display="none";
    }
  } else {
    painelDiv.style.display="none";
    mostrarLogin();
  }
});