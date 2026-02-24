export default function handler(req, res) {

const { jogo } = req.query;

const minutos = Math.floor(Math.random() * 2) + 1;

let resposta = {
jogo,
minutos
};

if (jogo === "Aviator") {
resposta.multiplicador = (1 + Math.random() * 5.45).toFixed(2);
}

if (jogo === "Tigre") {
resposta.bet = Math.random() < 0.5 ? 0.40 : 0.80;
resposta.normal = Math.floor(Math.random() * 10) + 1;
resposta.turbo = Math.floor(Math.random() * 10) + 1;
}

if (jogo === "Touro") {
resposta.bet = Math.random() < 0.5 ? 0.50 : 1.00;
resposta.normal = Math.floor(Math.random() * 10) + 1;
resposta.turbo = Math.floor(Math.random() * 10) + 1;
}

res.status(200).json(resposta);
  }
