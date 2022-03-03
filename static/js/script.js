/* eslint-disable no-unused-vars */
async function init(socket) {
	let txt;
	do {
		txt = prompt("Inserisci il tuo username");
	}	
	while (txt == "" || txt == null);

	if (!socket.id) socket.id = "unavailable";

	await socket.emit("ip", {
		ip: await getIP(),
		id: socket.id,
		username: txt,
	});

	//creazione base dei posti dal file json
	initialfetchSeat(socket, txt);

	let element;

	socket.on("functionFromClient", (arg) => {

		switch(arg.req) {
		case "updatedSeatfromServer":
			//se viene premuto bottone clear row
			if(arg.clear) {
				alert("Cleared a row");
			}
			normalFetchSeat(txt);
			break;
		/*
		case "admin":
			console.log("Benvenuto ADMIN");

			element = document.createElement("button");
			element.innerHTML = "Clear Row";
			element.onclick = () => { clearRow(socket);	};

			document.getElementsByClassName("sub-menu")[0].append(element);
			break;
		
		case "clear":
			alert("Seleziona una fila da pulire -> premere ctrl + click");
			document.addEventListener("click", function clearTarget(event) {
				if (event.ctrlKey == true) {

					let row = window.event.target.id.replace("n", "").split("-")[0];

					socket.emit("functionForServer", { req: "clearRow", NumRow: row });
					//clearFromClient(window.event.target, socket);
					document.removeEventListener("click", clearTarget);
				} else {
					alert("Tasto ctrl non premuto");
					return document.removeEventListener("click", clearTarget);
				}
			});
			break;
		*/
		}
	});
}

async function initialfetchSeat(socket, nickname) {

	let posti_matrice = (await (await fetch("./static/data/data.json")).json()).posti;

	let div = document.getElementById("seats");

	posti_matrice.map(async(row, i) => {

		console.log(`Fila num ${i} -> ${row}`);

		let element_div = document.createElement("div");
		element_div.id = `row ${i}`;
		element_div.classList.add("seat-row");

		div.appendChild(element_div);

		row.map(async(seat, count) => {

			let path = "./static/img/cinema_seat_oos.svg";

			if (seat.statusSeat == 0) {
				path = "./static/img/cinema_seat_available.svg";
			} else if (seat.statusSeat == 1) {
				if (seat.ownedBy == nickname) {
					path = "./static/img/cinema_seat_takedByMe.svg";
				} else {
					path = "./static/img/cinema_seat_oos.svg";
				}
			}

			let element = document.createElement("input");
			element.classList.add("seat");
			element.type = "image";
			element.src = path;
			element.id = `n${i}-${count}`;
			element.onclick = () => {
				changeValue(window.event, socket, nickname);
			};
			element_div.appendChild(element);
		});
	});


	let tagWelcome = document.getElementById("username"), newNickname;
    
	if (nickname == "admin:admin") {
		tagWelcome.innerHTML = "ADMIN";
	} else {
		tagWelcome.innerHTML = nickname.toLowerCase();

		let element = document.createElement("button");
		element.innerHTML = "Change Nickname";

		element.onclick = () => {
			newNickname = prompt("Scegli il tuo nuovo nickname");
			socket.emit("functionForServer", {
				req: "changeNickname",
				oldName: nickname,
				newName: newNickname
			});
		};

		document.getElementsByClassName("sub-menu")[0].append(element);
	}
}

async function normalFetchSeat(nickname) {

	let posti_matrice = (await (await fetch("./static/data/data.json")).json()).posti;

	let div = document.getElementById("seats");

	posti_matrice.map(async(row, i) => {
		row.map((seat, count) => {

			let id = `#n${i}-${count}`;

			let element = div.querySelector(id);
			let path = "img/cinema_seat_oos.svg";

			if (seat.statusSeat == 0) {
				path = "./static/img/cinema_seat_available.svg";
			} else if (seat.statusSeat == 1) {

				if (seat.ownedBy == nickname) {
					path = "./static/img/cinema_seat_takedByMe.svg";
				} else {
					path = "./static/img/cinema_seat_oos.svg";
				}
			}
			//editing all the seat based on the new json created
			element.src = path;
		});
	});
}

async function changeValue(element, socket, username) {

	if (element.ctrlKey == true) return;
	//if (element.target.src == "http://localhost:3000/static/img/cinema_seat_oos.svg" || element.target.src == "http://10.130.0.116:3000/static/img/cinema_seat_oos.svg") return alert("Non puoi");

	let index = element.target.id.replace("n", "").split("-");

	console.log(element.target.id);
	//get json file 
	let posti_matrice = (await (await fetch("static/data/data.json")).json()).posti;

	//get the numer (oos or available) with index number
	let num = posti_matrice[index[0]][index[1]];

	num.ownedBy = username;

	//passing to the server with "UpdatedSeat" the index of the changed seat with the current status -> 0 --> available -> 1 --> oos
	socket.emit("functionForServer", { req: "updatedSeat", indexes: index, status: num });
}

async function getIP() {
	// eslint-disable-next-line no-undef
	let data = await $.get("https://www.cloudflare.com/cdn-cgi/trace");
	data = data.trim().split("\n").reduce(function(obj, pair) {
		pair = pair.split("=");
		return obj[pair[0]] = pair[1], obj;
	}, {});
	return data.ip;
}

/*
async function clearRow(socket) {
	//alert("Seleziona una fila da pulire -> premere ctrl + click");
	document.addEventListener("click", function clearTarget(event) {
		if (event.ctrlKey == true) {

			let row = window.event.target.id.replace("n", "").split("-")[0];

			socket.emit("functionForServer", { req: "clearRow", NumRow: row });
			//clearFromClient(window.event.target, socket);
			document.removeEventListener("click", clearTarget);
		} else {
			alert("Tasto ctrl non premuto");
			return document.removeEventListener("click", clearTarget);
		}
	});
}
*/