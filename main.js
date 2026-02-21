let bloqueado=false;
let tempoRestante=0;
let intervalo;
let animacaoMulti;
let avaliacaoFeita=false;

// Entrar
function entrar(){
  if(document.getElementById("senha").value==="ANA/GB/2026"){
    document.getElementById("login").style.display="none";
    document.getElementById("painel").style.display="block";

    // Avaliação já visível
    document.getElementById("avaliacao").style.display="flex";
    document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
    document.getElementById("tipoEnviado").innerText="Enviada como GREEN";
  }else{
    alert("Senha incorreta");
  }
}

// Timer
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
      document.getElementById("btnGreen").disabled=false;
      document.getElementById("btnRed").disabled=false;
      document.getElementById("timer").innerText="";
    }
  },1000);
}

// Gerar
function gerar(jogo){

  if(bloqueado){
    alert("Aguarde o tempo acabar.");
    return;
  }

  let minutos=Math.floor(Math.random()*2)+1;

  if(jogo==="Aviator"){
    document.getElementById("aviatorVisual").style.display="block";
    let multi=1.00;
    let limite=(Math.random()*5.45 + 1).toFixed(2);
    clearInterval(animacaoMulti);
    animacaoMulti=setInterval(()=>{
      multi+=0.05;
      document.getElementById("multiplicador").innerText=multi.toFixed(2)+"X";
      if(multi>=limite){
        clearInterval(animacaoMulti);
      }
    },100);
    iniciarTimer(minutos);
  }

  if((jogo==="Tigre" || jogo==="Touro")){
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

// Marcar
function marcar(tipo){
  if(avaliacaoFeita) return;

  avaliacaoFeita=true;

  document.getElementById("resultadoAvaliacao").innerText="✅ Avaliação enviada!";
  document.getElementById("tipoEnviado").innerText="Enviada como "+tipo;

  document.getElementById("btnGreen").disabled=true;
  document.getElementById("btnRed").disabled=true;
}