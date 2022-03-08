/* eslint-disable no-unused-vars */

//dichiarazione di variabili che potranno essere usate in qualsiasi funzione
//infatti in js se si dichiarano delle variabili con var viene modificato lo scoping 
//quindi la variabile sarà modificabile in qualsiasi punto del file
//con let invece viene settato lo scoping locale quindi non si può modificare la funzione fuori dalle funzioni in cui è stata dichiarata
var el_array = new Array();
var el_counter = 0;
var counter_div = document.getElementById("counter");

async function init(socket) {
	let txt;

	//do while finchè non viene inserito un username corretto (in questo caso lo username non deve essere ne vuoto ne spazi vuoti)
	do {
		txt = prompt("Inserisci il tuo username");
	}	
	while (txt == "" || txt == null);

	//gestione bug di socket.io, se viene effettuato tante volte il refresh ogni tanto il l'id del socket non viene salvaro
	//se dovesse succedere questo l'id viene modificato in unavailable cosi da farlo capire al server
	if (!socket.id) socket.id = "unavailable";

	//funziona che tramite l'host di cloudflare prende i dati della connessione quindi ip location user agent versione ecc
	let ip_info = await getIP();

	await socket.emit("ip_info_to_server", {
		ip_info: {
			ip: ip_info.ip,
			location: ip_info.loc,
			userAgent: ip_info.uag,
			version: ip_info.http
		},
		socket_id: socket.id,
		username: [txt],
	});

	//creazione base nel file index dei posti file json
	initialfetchSeat(socket, txt);

	let element;

	//selezione dell'elemento con id username cosi da poter essere modificato quando verrà inserito il nick e inizializzazione var newNickname
	let tagWelcome = document.getElementById("username"), newNickname;
	//selezione dell'id sub-menu dove saranno messi tutti i bottoni quindi acquista/clear e change nickname
	let subMenu = document.getElementsByClassName("sub-menu")[0];
	let logout_element;

	//il socket si mette in ascolto per eventuali eventi dal server
	socket.on("functionForClient", (arg) => {

		switch(arg.req) {
		case "updatedSeatfromServer":
			//in caso di updatedSeatfromServer si fa la funzione normalFetchSeat che controlla tutti i posti a sedere e modificare il src in base agli elementi trovati
			normalFetchSeat(txt);
			break;
		case "init_btn":
			//in caso di init_btn ossia di inizializzazione dei bottoni si controlla prima di tutto se l'arg passato è admin

			logout_element = document.createElement("button");
			logout_element.id = "logout_btn";
			//testo dentro il bottone
			logout_element.innerHTML = "Logout";
			logout_element.onclick = () => {
				alert("Logout avvenuto");
				window.location.reload();
			};

			subMenu.append(logout_element);

			//se è admin = true allora significa che l'accesso è stato effetuato dall'admin altrimenti da un semplice user
			if(arg.admin) {

				//testo di tagwelcome predefinito è ADMIN (sull 'html uscirebbe Benvenuto ADMIN (con admin in rosso))
				tagWelcome.innerHTML = "ADMIN";

				//creazione del bottone clear_element ossia quello che permette di ripristinare a disponibili i sedili che clicca
				let clear_element = document.createElement("button");
				//all'inizio il bottone viene settato come disabled quindi non cliccabile finche non viene selezionato almeno un elemento
				clear_element.disabled = true;
				clear_element.id = "clear_btn";

				//testo dentro il bottone
				clear_element.innerHTML = "Clear seat";

				//la funzione onclick permette di avviare una funzione quando viene cliccato un elemento / bottone
				//in questo caso quando viene cliccato il bottone si controllano tutti gli input di el_array (quindi quello che contiene tutti gli elementi cliccati)
				//e per ogni input cliccato si fa la change value cosi da poter modificarne il valore
				clear_element.onclick = () => {
					el_array.forEach(input => {
						changeValue(input, socket, txt);
					});
				};
				//append del bottone clear_element all'elemento sub-menu
				subMenu.append(clear_element);
			} else {
				//in caso di user normale il testo mostrerà il nickname dell'utente (-> Benvenuto pincopallino)
				tagWelcome.innerHTML = txt.toLowerCase();

				//simile ad admin vengono creati i vari bottoni quindi change nickname e acquista seat
				let nick_element = document.createElement("button");
				nick_element.innerHTML = "Change Nickname";
		
				//quando viene cliccato il bottone change nickname
				//viene chiesto il nuovo nickname e si manda al server la richiesta di changeNickname
				//con parametri il vecchio username (che verrà controllato) e quello nuovo che sostituirà
				nick_element.onclick = () => {
					newNickname = prompt("Scegli il tuo nuovo nickname");
					socket.emit("functionForServer", {
						req: "changeNickname",
						oldName: txt,
						newName: newNickname
					});
					//refresh forzato della pagina per poter permettere le modifiche senza errori
					window.location.reload();
				};
		
				let reserve_element = document.createElement("button");
				//anche per acquista il bottone all'inizio è disattivato finche non vieen cliccato almeno un elemento
				reserve_element.disabled = true;
				reserve_element.id = "reserve_btn";
		
				reserve_element.innerHTML = "Acquista";
		
				//funzione identica a quella di clear seat poiche il funzionamento è lo stesso e il controllo verrà effetuato dentro la funzione
				reserve_element.onclick = () => {
					el_array.forEach(input => {
						changeValue(input, socket, txt);
					});
				};
		
				//append dei due elementi al sub-menu
				subMenu.append(nick_element, reserve_element);
			}
			break;
		}
	});

	//add event listener è un metodo che permette tramite degli eventi (in questo caso quello del click dell'utente) di fare determinate azioni
	document.addEventListener("click", (event) => {

		//in questo caso noi vogliamo che ad ogni click del sedile il colore di esso cambi + aumenti il contatore dei posti selezionati

		//dato che l'event  listener tiene conto di tutti i click bisogna prima di tutto escludere i click degli elementi che non iniziano per n
		//con questo controllo verranno presi di considerazione solamente i seat (perche iniziano tutti con n)
		if(!event.target.id.startsWith("n")) return;
		
		//serie di regex per controllare i nomi dei file
		//regex molto semplici che controllano solamente se è presente quella determinata condizione (quindi nome del file)
		//uso del regex poiche la path generale cambia in base al dispositivo su cui si fanno i click
		//infatti da local l'indirizzo sarà localhost:3000 .... mentre da un altro pc sarà diverso
		//con il regex viene quindi preso in considerazione solamente il nome del file
		const regex_selected = (/(static\/img\/cinema_seat_selected.svg)/g);
		const regex_oos = (/(static\/img\/cinema_seat_oos.svg)/g);
		const regex_selectedByMe = (/(static\/img\/cinema_seat_takedByMe.svg)/g);

		//se lo username è admin:admin si va ad agir
		if(txt == "admin:admin") {

			//se il contatore dei sedili selezionati è >= 0 allora si mette che il bottone clear_btn è visibile e cliccabile
			if(el_counter >= 0) document.getElementById("clear_btn").disabled = false;

			//si ottiene il selettore dell'elemento che è stato cliccato
			//infatti l'eventlistener si tiene in memoria l'evento che lo ha azionato e da li si possono ottenere tutte le informazioni dell'elemento cliccato
			//in questo caso si va a selezionare l'elemento tramite il target.id (quindi l'id dell'elemento cliccato)
			let element = document.getElementById(event.target.id);

			//se il test del regex_oos è true (quindi il posto è effettivamente stato preso da altre persone viene aumentato il contatore dei posti selezionati)
			//e viene aggiunto al el_array l'intero elemento cliccato (oltre a questo viene anche modificata localmente l'immagine con quella del selected che ci 
			//fa capire che abbiamo selezionato quell'elemento)
			if(regex_oos.test(element.src) == true ){
				element.src = "./static/img/cinema_seat_selected.svg";
				el_array.push(element);
				el_counter++;
			} else if(regex_selected.test(element.src) == true) {
				//controllo per verificare se clicchiamo un posto che già abbiamo cliccato prima (in poche parole qua si controlla se è stata fatta una deselezione)
				//se l'elemento è stato deselezionato ovviamente viene ripristinata l'immagine a quello di oos e vengono eliminati dall'array e dal contatore l'elemento
				element.src = "./static/img/cinema_seat_oos.svg";
				el_array.pop(element);
				el_counter--;
			}
			
			//il testo del div counter_div sarà il numero corrente di sedili selezionati
			counter_div.innerHTML = el_counter;

		} else {
		
			
			if(el_counter >= 0 || txt == "admin:admin") document.getElementById("reserve_btn").disabled = false;
		
			//si ottiene il selettore dell'elemento che è stato cliccato
			//infatti l'eventlistener si tiene in memoria l'evento che lo ha azionato e da li si possono ottenere tutte le informazioni dell'elemento cliccato
			//in questo caso si va a selezionare l'elemento tramite il target.id (quindi l'id dell'elemento cliccato)
			element = document.getElementById(event.target.id);
		
			//se il posto è già stato selezionato da noi si va a fare come per admin quindi diminuzione del contatore e metodo pop dell'array el_array
			//la funzione pop permette di eliminare da un array l'ultimo elemento che è stato inserito
			if(regex_selected.test(element.src) == true) {
				element.src = "./static/img/cinema_seat_available.svg";
				el_array.pop(element);
				el_counter--;
			} else if(regex_oos.test(element.src) == true || regex_selectedByMe.test(element.src) == true) {
				//in caso di posto non disponibile o di già prenotato da me non verrò contato il click e verrà mostrato a schermo la scritto che è giù stato prenotato/acquistato
				return alert("Non puoi, già prenotato/acquistato");
			} else {
				//stesso funzionamento di prima se viene cliccato un posto libero viene selezionato da noi e i dati dell'elemento vengono aggunti all'array + aumento counter
				element.src = "./static/img/cinema_seat_selected.svg";
				el_array.push(element);
				el_counter++;
			}
			
			//il testo del div counter_div sarà il numero corrente di sedili selezionati
			counter_div.innerHTML = el_counter;
		}
	});
}

async function initialfetchSeat(socket, nickname) {

	//funzione che parte non appena viene controllato il nickname e quando si apre la pagina quindi caricamento iniziale di tutto


	//lettura file data.json per mostrare tutti i posti che ci sono nella matrice dei posti
	let posti_matrice = (await (await fetch("./static/data/data.json")).json()).posti;

	//selettore tramite id "seats" dell'elemento creato nell'html cosi ogni sub-elemento che viene aggiunto verrà messo in append sempre nel div "seats"
	let div = document.getElementById("seats");

	//scorro tutte le row della matrice (file dei posti)
	//usata la funzione map poiche permette direttamente di dichiarare un contatore (in questo caso i)
	//rispetto al forEach che non permette ciò 
	posti_matrice.map(async(row, i) => {

		//per ogni row trovata creo un nuovo div con id identificativo e aggiungo alla lista delle classi del div la classe "seat-row" (aggiunge del semplice padding per ogni fila)
		let element_div = document.createElement("div");
		element_div.id = `row ${i}`;
		element_div.classList.add("seat-row");

		//appen del div della row nel div dei seats
		div.appendChild(element_div);

		//scorro tutti i posti della fila (row) usata sempre funziona map per permettere di avere il contatore incluso
		row.map(async(seat, count) => {

			let path = "";

			//controllo dello status del sedile per decidere quale file caricare nella path dell'elemento
			//se 0 significa che il posto è disponibile per essere prenotato
			//se è 1 allora è occupato/riservato da me
			if (seat.statusSeat == 0) {
				path = "./static/img/cinema_seat_available.svg";
			} else if (seat.statusSeat == 1) {

				//controllo del nickname che ha prenotato il posto, se è uguale al nickname inserito precedentemente nel prompt (riga 16) allora verrà caricato il file takedByMe (quindi verrà visto verde poiche prenotato da noi)
				//altrimenti viene caricato il file seat_oos poiche già stato prenotato ma non da noi
				seat.ownedBy == nickname ? path = "./static/img/cinema_seat_takedByMe.svg" : path = "./static/img/cinema_seat_oos.svg"; 

			}
			
			//creazione di un elemento input (sedile)
			let element = document.createElement("input");

			//aggiunta della classe seat che contiene le grandezze per ogni sedile e il padding di distanziamento per ogni sedile
			element.classList.add("seat");
			element.type = "image";
			//src sarebbe il percorso per trovare l'immagine da far vedere
			element.src = path;
			//assegnazione id specifico per ogni posto a sedere tenendo conto anche della row (tramite la variabile i) in questo modo per ogni posto abbiamo un id specifico
			//aggiunta la n all'inizio poiche non sono accettati id che iniziano per numero
			element.id = `n${i}-${count}`;

			//appen l'elemento appena creato (input) alla row specifica (variabile element_div)
			element_div.appendChild(element);
		});
	});
}

async function normalFetchSeat(nickname) {

	//funzione chiamata ogni qualvolta c'è una modifica dei posti

	//procedimento simile a initialfetchSeat per quanto riguarda lettura del file data 
	let posti_matrice = (await (await fetch("./static/data/data.json")).json()).posti;

	let div = document.getElementById("seats");

	posti_matrice.map(async(row, i) => {
		row.map((seat, count) => {

			let id = `#n${i}-${count}`;

			let element = div.querySelector(id);
			let path = "img/cinema_seat_oos.svg";

			//controllo dello status del sedile
			if (seat.statusSeat == 0) {
				path = "./static/img/cinema_seat_available.svg";
			} else if (seat.statusSeat == 1) {
				//controllo identico all'initialfetchSeat per vedere se il nickname del sedile è uguale a quello dell'utente
				seat.ownedBy == nickname ? path = "./static/img/cinema_seat_takedByMe.svg" : path = "./static/img/cinema_seat_oos.svg"; 
			}
			//dato che i posti sono già stati caricati dalla funzione initialfetchSeat non c'è bisogno di creare nuovi elementi ma solo i modificare l'src dell'elemento
			element.src = path;
		});
	});
}

async function changeValue(element, socket, username) {

	//funzione ogni volta che si clicca il bottone acquista o clear row (admin only)

	//pulizia dell'array el_array (il quale contiene tutti gli elementi che vengono cliccati prima di premere il bottone acquista/clear)
	el_array = [];
	//azzeramento contatore presente nell'html degli elementi cliccati
	counter_div.innerHTML = 0;

	//ottenimento dell'array degli indici dell'elemento cliccato
	let index = element.id.substring(1,4).split("-");

	let posti_matrice = (await (await fetch("static/data/data.json")).json()).posti;

	//ottenimento dello slot della matrice dell'element cliccato tramite gli indici degli id 
	let num = posti_matrice[index[0]][index[1]];

	//si controlla se lo username che clicca il bottone è admin:admin (in quel caso significa che è stato fatto il clear seat quindi bisogna sovrascrivere i dati per renderlo disponibile a tutti)
	//c'è bisogno di pulire i dati all'interno di num (quindi ownedBy = "", status seat 0 che indica il posto libero ed eliminazione del timestamp)
	if(username == "admin:admin") {
		num.ownedBy = "", num.statusSeat = 0, num.timeStamp = null;
	} else {
		//se lo username non è admin:admin (quindi si parla di user normale)
		//si mette come ownedBy lo username è come timestamp si mette il valore unix della funzione date .now / 1000 (in questo modo dal server si può effetuare la conversione corretta della data)
		num.ownedBy = username;
		num.timeStamp = Math.floor(Date.now() / 1000);
	}
	
	//chiamata al server con functionForServer e con richiuesta di aggiornare i posti a sedere (come altri parametri vengono passati gli id dell'elemento cliccato e lo status quindi i valori modificati)
	await socket.emit("functionForServer", { req: "updatedSeat", id: element.id, status: num});
	
}

async function getIP() {
	// eslint-disable-next-line no-undef
	let data = await $.get("https://www.cloudflare.com/cdn-cgi/trace");
	data = data.trim().split("\n").reduce(function(obj, pair) {
		pair = pair.split("=");
		return obj[pair[0]] = pair[1], obj;
	}, {});
	return data;
}