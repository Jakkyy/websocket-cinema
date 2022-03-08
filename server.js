//dichiarazione librerie usate
const express = require("express");  //server 
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");	//file stream lib
const moment = require("moment");	//date formatter

//caricamento /static folder per express
app.use("/static", express.static("./static"));

//caricamento della pagina iniziale quando una persona apre la pagina web
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

//lettura del file json data.json (dove sono presenti tutti i dati dei posti del cinema) 
//questa variabile verrà usata ogni volta che si vuole modificare/leggere i dati di un sedile
let data = JSON.parse(fs.readFileSync(__dirname + "/static/data/data.json"));

//controllo iniziale non appena si avvia il server, ossia controllo di integrità 
//per verificare che se non esiste nessun proprietario del posto (quindi lo spazio ownedBy è vuoto) 
//in automatico lo status diventa 0 e viene ripristinata elem.timeStamp
data.posti.forEach(arr => arr.forEach(elem => {
	//TODO -> verificare per ogni campo se viene rilevato un qualche errore
	if(elem.ownedBy == "" && elem.statusSeat != 0 && elem.timeStamp != "") {
		elem.statusSeat = 0;
		elem.timeStamp = "";
		//sovrascrittura del file ogni qualvolta si trova l'errore
		fs.writeFileSync(__dirname + "/static/data/data.json", JSON.stringify(data, null, "\t"));
	}
}));

//quando un client effettua la connessione alla pagina
io.on("connection", async(socket) => {

	//lettura del file user_data contenente tutti i dati delle varie persone che entrano
	let user_data = JSON.parse(fs.readFileSync(__dirname + "/static/data/user_log.json", "utf-8"));

	//il socket si mette in ascolto dell'evento "ip_info_to_server" ossia aspetta che il server gli mandi la richiesta dell'evento e in caso prende gli arg che il server gli ha passato
	socket.on("ip_info_to_server", (arg) => {
	
		//creazione array con tutti gli ip degli utenti che accedono al sito
		let ip_array = user_data.map(data => {return data.ip_info.ip;});
		
		//controllo per verificare se la persona che entra è mai entrata nella pagina o meno
		//se l'array di ip (ip_array) non include l'ip passato negli argument allora si tratta di un nuovo utente connesso altrimenti no
		if (!ip_array.includes(arg.ip_info.ip)) {
			console.log("new user connected -> ");

			//user_data (il file contenente tutti i dati salvati degli utenti) è un array quindi si possono applicare
			//tutte le funzioni base di JS (in questo caso viene usato il metodo push che aggiunge alla fine dell'array gli args che sono stati passati)
			//gli args passati sono l'ip + informazioni base sulla connessione, socket id e nickname
			user_data.push(arg);

			fs.writeFileSync(__dirname + "/static/data/user_log.json", JSON.stringify(user_data, null, "\t"));
		} else {
			
			//essendo che lo user esiste già si usa la funzione find per trovare lo slot esatto dell'array
			//in questo caso si effettua la ricerca con gli ip quindi si controlla se l'ip dell'elemento che sta scorrendo è uguale a quello passato negli args
			//il tutto viene salvato nella variabile "user" che ci servirà ogni qualvolta vogliamo modificare qualcosa nei dati sadella connessione trovato
			let user = user_data.find(element => element.ip_info.ip == arg.ip_info.ip);

			console.log("existing user connected ->", {ip: arg.ip_info.ip, socket_id: arg.socket_id, username: arg.username});

			//controllo per vedere se la connessione (quindi ip) ha usato un nuovo nickname rispetto a quello salvato in precedenza (in questo modo si ha una visione completa dei nickname degli utenti etc)
			//se l'array di username della variabile user non include lo username passato allora tramite il metodo push si aggiunge all'array degli username di user
			if(!user.username.includes(arg.username[0])) user.username.push(arg.username[0]);
			//se il socket id passato è != a unavailable allora viene sovrascritto il campo socket_id dello user
			if(arg.socket_id != "unavailable") user.socket_id = arg.socket_id;
			
			//sovrascrittura file
			fs.writeFileSync(__dirname + "/static/data/user_log.json", JSON.stringify(user_data, null, "\t"));
		}

		let isAdmin;

		//controllo sullo username, se è admin:admin (quindi l'admin della pagina | diverse funzionalità rispetto allo user normale)
		//allora mette il boolean isAdmin a true altrimenti a false
		arg.username == "admin:admin" ? isAdmin = true : isAdmin = false; 

		//invio al socket l'evento functionForClient con request di init_btn ossia il caricamento dei bottoni 
		//(change nickname acquista per user) e (clear set per admin)
		socket.emit("functionForClient", {
			req: "init_btn",
			//la variabile isAdmin decreterà se è necessario caricare i bottoni per lo user normale o per l'admin a seconda se true o false
			admin: isAdmin,
		});
	});

	//il socket si mette in ascolto dell'evento "functionForServer" quindi aspetta una qualsiasi chiamata da parte del cliente per modificare dei posti nella matrice o per il cambio di nickname dell'utente (in questo caso)
	socket.on("functionForServer", (arg) => {

		//sovrascrittura della variabile data per ottenere i valori esatti al momento della chiamata;
		data = JSON.parse(fs.readFileSync(__dirname + "/static/data/data.json"));
		let index, seat;

		//switch con parametro arg.req (arg.req contiene in pooche parole l'azione che deve essere eseguita dal client)
		switch (arg.req) {
		case "updatedSeat":

			//in caso di posto modificato si ottiene l'index del sedile cliccato effetuando una substring 
			//dato che l'id che gli verrà passato è tipo n0-1 bisogna eliminare la n (appunto con la substring dove si prendono solo 0-1 e infine splittare la stringa con divisore "-")
			//con la funzione split viene creato un array degli elementi separati dal divisore "-" quindi per richiamare l'elemento dobbiamo specificare anche l'indice 
			//in questo caso la variabile index sarà cosi -> ["0", "1"]
			index = arg.id.substring(1,4).split("-");
            
			console.log(`clicked seat, row n.${parseInt(index[0]) +1}, place n.${parseInt(index[1]) + 1}`);

			//prende le coordinate esatte esatte della matrice del sedile cliccato tramite gli args passati (in questo caso array di indici della matrice)
			seat = data.posti[index[0]][index[1]];
			//conversione del nmumero del sedile con XOR -> ^=1 (cosi non ci sono controlli ulteriori ma in automatico viene switchato da 0 a 1 e viceversa)
			seat.statusSeat ^= 1, seat.ownedBy = arg.status.ownedBy;
			//controllo sul timestamp passato, se esiste il timestamp viene convertito in formato "01/01/1970 - 00:00:00" altrimenti vuoto
			seat.timeStamp = arg.status.timeStamp ? moment.unix(arg.status.timeStamp).format("DD/MM/YYYY - HH:mm:ss") : "";
			
			//sovrascrizione del file con i dati modificati (quindi numero dello stato del sedile e timestamp)
			fs.writeFileSync(__dirname + "/static/data/data.json", JSON.stringify(data, null, "\t"));
			//send a tutti i client l'evento "updatedSeatfromServer"
			io.emit("functionForClient", { req: "updatedSeatfromServer" });
			break;
		case "changeNickname":

			//scorro l'intera matrice dei posti e controllo se il posto.ownedBy (il nickname della persona che ha prenotato il posto) 
			//è uguale a quello passato in arg (in questo caso arg.oldName perche bisogna cercare i nick vecchio) e in caso sostituirlo con arg.newName
			//ossia il nuovo nickname scelto dall'utente
			data.posti.forEach(row => row.forEach(seat => {
				if(seat.ownedBy == arg.oldName) seat.ownedBy = arg.newName;
			}));
		
			//sovrascrittura file
			fs.writeFileSync("./static/data/data.json", JSON.stringify(data, null, "\t"));
			io.emit("functionForClient", { req: "updatedSeatfromServer" });
			break;
		}
	});
});

//il server si mette in ascolto sulla porta 3000, *http://localhost:3000/*
server.listen(3000, () => {
	console.log("http://localhost:3000/");
});