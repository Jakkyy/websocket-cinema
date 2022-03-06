/* eslint-disable no-unused-vars */
var el_array = new Array();
var el_counter = 0;
var counter_div = document.getElementById("counter");

async function init(socket) {
	let txt;
	do {
		txt = prompt("Inserisci il tuo username");
	}	
	while (txt == "" || txt == null);

	if (!socket.id) socket.id = "unavailable";

	let ip_info = await getIP();

	await socket.emit("ip_info_to_server", {
		ip_info: {
			ip: ip_info.ip,
			location: ip_info.loc,
			userAgent: ip_info.uag,
			version: ip_info.http
		},
		socket_id: socket.id,
		username: txt,
	});

	//creazione base dei posti dal file json
	initialfetchSeat(socket, txt);

	let element;

	document.addEventListener("click", (event) => {

		if(!event.target.id.startsWith("n")) return;
		
		const regex_selected = (/(static\/img\/cinema_seat_selected.svg)/g);
		const regex_oos = (/(static\/img\/cinema_seat_oos.svg)/g);
		const regex_selectedByMe = (/(static\/img\/cinema_seat_takedByMe.svg)/g);

		if(txt == "admin:admin") {

			if(el_counter >= 0) document.getElementById("clear_btn").disabled = false;

			element = document.getElementById(event.target.id);

			if(regex_oos.test(element.src) == true ){
				element.src = "./static/img/cinema_seat_selected.svg";
				el_array.push(element);
				el_counter++;
			} else if(regex_selected.test(element.src) == true) {
				element.src = "./static/img/cinema_seat_oos.svg";
				el_array.pop(element);
				el_counter--;
			}
			
			counter_div.innerHTML = el_counter;

		} else {
		
			
			if(el_counter >= 0 || txt == "admin:admin") document.getElementById("reserve_btn").disabled = false;
		
			element = document.getElementById(event.target.id);
		
			if(regex_selected.test(element.src) == true) {
				element.src = "./static/img/cinema_seat_available.svg";
				el_array.pop(element);
				el_counter--;
			} else if(regex_oos.test(element.src) == true || regex_selectedByMe.test(element.src) == true) {
				return alert("Non puoi, già prenotato/acquistato");
			} else {
				element.src = "./static/img/cinema_seat_selected.svg";
				el_array.push(element);
				el_counter++;
			}
		
			
			counter_div.innerHTML = el_counter;
		}
	});

	

	socket.on("functionForClient", (arg) => {

		switch(arg.req) {
		case "updatedSeatfromServer":
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
				console.log(seat.ownedBy);
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
			/*
			element.onclick = () => {
				console.log(regex_oos.test(element.src));
				console.log(element.src);
				if (nickname != "admin:admin" && regex_oos.test(element.src) == true) 
			};
			*/
			element_div.appendChild(element);
		});
	});


	let tagWelcome = document.getElementById("username"), newNickname;
    
	if (nickname == "admin:admin") {
		tagWelcome.innerHTML = "ADMIN";

		
		let clear_element = document.createElement("button");
		clear_element.disabled = true;
		clear_element.id = "clear_btn";

		clear_element.innerHTML = "Clear seat";

		clear_element.onclick = () => {
			el_array.forEach(input => {
				changeValue(input, socket, nickname);
			});
		};

		document.getElementsByClassName("sub-menu")[0].append(clear_element);

	} else {
		tagWelcome.innerHTML = nickname.toLowerCase();

		let nick_element = document.createElement("button");
		nick_element.innerHTML = "Change Nickname";

		nick_element.onclick = () => {
			newNickname = prompt("Scegli il tuo nuovo nickname");
			socket.emit("functionForServer", {
				req: "changeNickname",
				oldName: nickname,
				newName: newNickname
			});
		};

		console.log(el_array);

		let reserve_element = document.createElement("button");
		reserve_element.disabled = true;
		reserve_element.id = "reserve_btn";

		reserve_element.innerHTML = "Acquista";

		reserve_element.onclick = () => {
			el_array.forEach(input => {
				changeValue(input, socket, nickname);
			});
		};

		document.getElementsByClassName("sub-menu")[0].append(nick_element, reserve_element);
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

	el_array = [];
	counter_div.innerHTML = 0;
	let index = element.id.replace("n", "").split("-");


	//get json file 
	
	let posti_matrice = (await (await fetch("static/data/data.json")).json()).posti;

	//get the numer (oos or available) with index number
	let num = posti_matrice[index[0]][index[1]];

	
	if(username == "admin:admin") {
		num.ownedBy = "", num.statusSeat = 0;
	} else {
		num.ownedBy = username;
	}
	
	//passing to the server with "UpdatedSeat" the index of the changed seat with the current status -> 0 --> available -> 1 --> oos
	socket.emit("functionForServer", { req: "updatedSeat", id: element.id, status: num });
	
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