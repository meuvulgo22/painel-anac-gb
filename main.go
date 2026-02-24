package main

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

type Signal struct {
	Jogo          string  `json:"jogo"`
	Multiplicador float64 `json:"multiplicador"`
	Minutos       int     `json:"minutos"`
	Bet           float64 `json:"bet"`
	Normal        int     `json:"normal"`
	Turbo         int     `json:"turbo"`
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func gerarSinal(w http.ResponseWriter, r *http.Request) {

	enableCors(&w)
	rand.Seed(time.Now().UnixNano())

	jogo := r.URL.Query().Get("jogo")

	minutos := rand.Intn(2) + 1

	sinal := Signal{
		Jogo:    jogo,
		Minutos: minutos,
	}

	if jogo == "Aviator" {
		sinal.Multiplicador = 1 + rand.Float64()*5.45
	}

	if jogo == "Tigre" {
		if rand.Float64() < 0.5 {
			sinal.Bet = 0.40
		} else {
			sinal.Bet = 0.80
		}
		sinal.Normal = rand.Intn(10) + 1
		sinal.Turbo = rand.Intn(10) + 1
	}

	if jogo == "Touro" {
		if rand.Float64() < 0.5 {
			sinal.Bet = 0.50
		} else {
			sinal.Bet = 1.00
		}
		sinal.Normal = rand.Intn(10) + 1
		sinal.Turbo = rand.Intn(10) + 1
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sinal)
}

func main() {
	http.HandleFunc("/signal", gerarSinal)
	println("Servidor rodando em http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}