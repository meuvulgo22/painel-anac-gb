// Config Firebase
const firebaseConfig = {
  // COLE AQUI SEU FIREBASE CONFIG
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos
const loginScreen = document.getElementById("login-screen");
const mainScreen = document.getElementById("main-screen");
const adminScreen = document.getElementById("admin-screen");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminPanelBtn = document.getElementById("adminPanelBtn");
const backBtn = document.getElementById("backBtn");

const globalStats = document.getElementById("global-stats");
const resultDiv = document.getElementById("result");
const usersList = document.getElementById("users-list");

const tigreBtn = document.getElementById("tigreBtn");
const touroBtn = document.getElementById("touroBtn");
const aviatorBtn = document.getElementById("aviatorBtn");

let currentUser = null;

// Atualiza Global Stats
async function updateGlobal() {
  const snapshot = await db.collection("usuarios").get();
  let green = 0, red = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if(data.status === "green") green++;
    if(data.status === "red") red++;
  });
  globalStats.textContent = `Global: ${green} Green | ${red} Red`;
}

// Gerar ação
function gerar(tipo) {
  const x = Math.random() * 3;
  resultDiv.textContent = `${tipo} ${x.toFixed(2)}X`;
}

// Abrir painel ADM
async function openAdmin() {
  mainScreen.style.display = "none";
  adminScreen.style.display = "block";
  usersList.innerHTML = "";
  const snapshot = await db.collection("usuarios").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.textContent = `${data.email} - ADM: ${data.isAdmin ? "Sim" : "Não"} - Status: ${data.status || "Nenhum"}`;
    usersList.appendChild(div);
  });
}

// Login
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const userDoc = await db.collection("usuarios").doc(email).get();
  if(userDoc.exists) {
    currentUser = userDoc.data();
    loginScreen.style.display = "none";
    mainScreen.style.display = "block";
    if(currentUser.isAdmin) {
      adminPanelBtn.style.display = "inline-block";
    }
    updateGlobal();
  } else {
    alert("Usuário não encontrado!");
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  mainScreen.style.display = "none";
  loginScreen.style.display = "block";
  emailInput.value = "";
  passwordInput.value = "";
  currentUser = null;
});

// Botões
adminPanelBtn.addEventListener("click", openAdmin);
backBtn.addEventListener("click", () => {
  adminScreen.style.display = "none";
  mainScreen.style.display = "block";
});
tigreBtn.addEventListener("click", () => gerar("TIGRE"));
touroBtn.addEventListener("click", () => gerar("TOURO"));
aviatorBtn.addEventListener("click", () => gerar("AVIATOR"));

// Atualização em tempo real
db.collection("usuarios").onSnapshot(updateGlobal);