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
		username: [txt],
	});

	//creazione base dei posti dal file json
	initialfetchSeat(socket, txt);

	let element;

	let tagWelcome = document.getElementById("username"), newNickname;
	let subMenu = document.getElementsByClassName("sub-menu")[0];

	socket.on("functionForClient", (arg) => {

		switch(arg.req) {
		case "updatedSeatfromServer":
			console.log("ciao");
			normalFetchSeat(txt);
			break;
		case "init_btn":
			if(arg.admin) {
				tagWelcome.innerHTML = "ADMIN";

		
				let clear_element = document.createElement("button");
				clear_element.disabled = true;
				clear_element.id = "clear_btn";

				clear_element.innerHTML = "Clear seat";

				clear_element.onclick = () => {
					el_array.forEach(input => {
						changeValue(input, socket, txt);
					});
				};
				subMenu.append(clear_element);
			} else {
				tagWelcome.innerHTML = txt.toLowerCase();

				let nick_element = document.createElement("button");
				nick_element.innerHTML = "Change Nickname";
		
				nick_element.onclick = () => {
					newNickname = prompt("Scegli il tuo nuovo nickname");
					socket.emit("functionForServer", {
						req: "changeNickname",
						oldName: txt,
						newName: newNickname
					});
				};
		
				let reserve_element = document.createElement("button");
				reserve_element.disabled = true;
				reserve_element.id = "reserve_btn";
		
				reserve_element.innerHTML = "Acquista";
		
				reserve_element.onclick = () => {
					el_array.forEach(input => {
						changeValue(input, socket, txt);
					});
				};
		
				subMenu.append(nick_element, reserve_element);
			}
			break;
		}
	});

	document.addEventListener("click", (event) => {

		if(!event.target.id.startsWith("n")) return;
		
		const regex_selected = (/(static\/img\/cinema_seat_selected.svg)/g);
		const regex_oos = (/(static\/img\/cinema_seat_oos.svg)/g);
		const regex_selectedByMe = (/(static\/img\/cinema_seat_takedByMe.svg)/g);

		if(txt == "admin:admin") {

			if(el_counter >= 0) document.getElementById("clear_btn").disabled = false;

			let element = document.getElementById(event.target.id);

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
}

async function initialfetchSeat(socket, nickname) {

	let posti_matrice = (await (await fetch("./static/data/data.json")).json()).posti;

	let div = document.getElementById("seats");

	posti_matrice.map(async(row, i) => {

		let element_div = document.createElement("div");
		element_div.id = `row ${i}`;
		element_div.classList.add("seat-row");

		div.appendChild(element_div);

		row.map(async(seat, count) => {

			let path = "";

			if (seat.statusSeat == 0) {
				path = "./static/img/cinema_seat_available.svg";
			} else if (seat.statusSeat == 1) {

				seat.ownedBy == nickname ? path = "./static/img/cinema_seat_takedByMe.svg" : path = "./static/img/cinema_seat_oos.svg"; 

			}
			
			let element = document.createElement("input");

			element.classList.add("seat");
			element.type = "image";
			element.src = path;
			element.id = `n${i}-${count}`;

			element_div.appendChild(element);
		});
	});
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