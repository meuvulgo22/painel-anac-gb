import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// MOSTRAR/OCULTAR LOGIN/CADASTRO
window.mostrarCadastro = () => {
  document.getElementById("login").style.display = "none";
  document.getElementById("cadastro").style.display = "flex";
};
window.mostrarLogin = () => {
  document.getElementById("cadastro").style.display = "none";
  document.getElementById("login").style.display = "flex";
};

// CADASTRO
window.cadastrar = async () => {
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    // Criar doc do usuário
    await setDoc(doc(db, "usuarios", userCredential.user.uid), { email, isAdmin: false });
    alert("Cadastro realizado!");
    mostrarLogin();
  } catch(e){ alert(e.message); }
};

// LOGIN
window.login = async () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch(e){ alert(e.message); }
};

// AUTENTICAÇÃO
onAuthStateChanged(auth, async (user) => {
  if(user){
    document.getElementById("login").style.display = "none";
    document.getElementById("cadastro").style.display = "none";
    document.getElementById("painel").style.display = "block";

    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);
    const isAdmin = docSnap.exists() && docSnap.data().isAdmin;

    // Mostrar botão ADM
    if(isAdmin) document.getElementById("btnADM").style.display = "inline-block";
    else document.getElementById("btnADM").style.display = "none";

    // Contador global
    const refGlobal = doc(db, "historico", "global");
    onSnapshot(refGlobal, (docSnap)=>{
      if(docSnap.exists()){
        document.getElementById("contadorGlobal").innerText = "Global: "+docSnap.data().green+" Green | "+docSnap.data().red+" Red";
      }
    });
  } else {
    document.getElementById("login").style.display = "flex";
    document.getElementById("painel").style.display = "none";
  }
});

// BOTÃO ADM
window.irPainelADM = async () => {
  document.getElementById("painel").style.display = "none";
  document.getElementById("painelADM").style.display = "block";

  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML = "<h3>Carregando usuários...</h3>";

  const usuariosCol = collection(db, "usuarios");
  onSnapshot(usuariosCol, (snap)=>{
    lista.innerHTML = "<h2>Usuários:</h2>";
    snap.forEach(docu=>{
      const data = docu.data();
      lista.innerHTML += `<p>${data.email} - Admin: ${data.isAdmin}</p>`;
    });
  });
};

// VOLTAR DO ADM
window.voltarPainel = () => {
  document.getElementById("painelADM").style.display = "none";
  document.getElementById("painel").style.display = "block";
};

// ===== FUNÇÕES DE JOGO =====
// Aqui você pode adicionar o código do "Tigre", "Touro", "Aviator" que você já tinha