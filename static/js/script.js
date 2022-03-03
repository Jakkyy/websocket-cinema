/* eslint-disable no-unused-vars */
async function getIP() {
	// eslint-disable-next-line no-undef
	let data = await $.get("https://www.cloudflare.com/cdn-cgi/trace");
	data = data.trim().split("\n").reduce(function(obj, pair) {
		pair = pair.split("=");
		return obj[pair[0]] = pair[1], obj;
	}, {});
	return data.ip;
}

async function fetchSeat(socket, nickname) {

	let posti_matrice = (await (await fetch("./static/data/data2.json")).json()).posti;

	console.log(posti_matrice);

	let div = document.getElementById("seats");

	posti_matrice.map(async(row, i) => {

		console.log(`Fila num ${i} -> ${row}`);

		let element_div = document.createElement("div");
		element_div.style.padding = "50px";
		element_div.id = `row ${i}`;

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
			element.type = "image";
			element.src = path;
			element.id = `n${i}-${count}`;
			element.onclick = () => {
				changeValue(window.event, socket, nickname);
			};
			element.style = "height: 50px !important;width: 50px !important;padding: 10px !important;";
			element_div.appendChild(element);
		});
	});

	let tagWelcome = document.getElementById("username");
    
	if (nickname == "admin:admin") {
		tagWelcome.innerHTML = "ADMIN";
	} else {
		tagWelcome.innerHTML = nickname.toLowerCase();

		let element = document.createElement("button");
		element.innerHTML = "Change Nickname";

		element.onclick = () => {
			socket.emit("functionFromClient", {
				nickname: nickname,
				req: "changeNickname"
			});
		};

		document.getElementsByClassName("sub-menu")[0].append(element);
	}

}

async function admin(socket) {
	console.log("Benvenuto ADMIN");

	let element = document.createElement("button");
	element.innerHTML = "Clear Row";

	element.onclick = () => {
		socket.emit("functionFromClient", {
			req: "clear"
		});
	};

	document.getElementsByClassName("sub-menu")[0].append(element);
}


async function addRow(socket, args) {
	socket.emit("functionFromAdmin", { req: args });
}

async function x(socket, nickname) {

	let posti_matrice = (await (await fetch("./static/data/data2.json")).json()).posti;

	console.log(posti_matrice);
	let div = document.getElementById("seats");

	posti_matrice.map(async(row, i) => {
		//console.log(`Fila num ${i} -> ${row}`);

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

async function clearFromClient(element, socket) {
	let row = element.id.replace("n", "").split("-")[0];

	socket.emit("clearRow", { NumRow: row });
}


async function changeValue(element, socket, username) {

	if (element.ctrlKey == true) return;
	//if (element.target.src == "http://localhost:3000/static/img/cinema_seat_oos.svg" || element.target.src == "http://10.130.0.116:3000/static/img/cinema_seat_oos.svg") return alert("Non puoi");

	let index = element.target.id.replace("n", "").split("-");

	//get json file 
	let posti_matrice = (await (await fetch("static/data/data2.json")).json()).posti;

	//get the numer (oos or available) with index number
	let num = posti_matrice[index[0]][index[1]];

	num.ownedBy = username;
	//passing to the server with "UpdatedSeat" the index of the changed seat with the current status -> 0 --> available -> 1 --> oos
	socket.emit("updatedSeat", { indexes: index, status: num });
}