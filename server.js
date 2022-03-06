const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");
 
//load static folder for static element
app.use("/static", express.static("./static"));

//index
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

let data = JSON.parse(fs.readFileSync(__dirname + "/static/data/data.json"));

data.posti.forEach(arr => {
	arr.forEach(elem => {
		if(elem.ownedBy == "") elem.statusSeat = 0;
	});
	fs.writeFileSync(__dirname + "/static/data/data.json", JSON.stringify(data, null, "\t"));
});

//quando un client effettua una connessione
io.on("connection", async(socket) => {

	console.log(__dirname + "/static/");

	//read user log file to see if socket ip already exist = already visited the site
	let user_data = JSON.parse(fs.readFileSync(__dirname + "/static/data/user_log.json", "utf-8"));

	socket.on("ip_info_to_server", (arg) => {
	
		if (!JSON.stringify(user_data).includes(arg.ip_info.ip)) {
			//if a new user sava all the data (ip and socket id) in the json
			console.log("new user connected -> ");

			console.log(arg);
			user_data.push(arg);
			fs.writeFileSync(__dirname + "/static/data/user_log.json", JSON.stringify(user_data, null, "\t"));
		} else {
			//if the ip already entered the site one time, modify only the socket id
			console.log("existing user connected -> ");

			//finding the exact slot inside the json (retrieving json)
			let t = user_data.find(element => element.ip_info.ip == arg.ip_info.ip
			);

			if(arg.socket_id != "unavailable") t.socket_id = arg.socket_id;
			
			//re-writing the file with the edited user_data
			fs.writeFileSync(__dirname + "/static/data/user_log.json", JSON.stringify(user_data, null, "\t"));
		}
		console.log(arg);

		if (arg.username == "admin:admin") {
			socket.emit("functionForClient", {
				req: "admin",
				admin: true,
			});
		}
	});

	socket.on("functionForServer", (arg) => {

		data = JSON.parse(fs.readFileSync(__dirname + "/static/data/data.json"));
		let index, seat;

		switch (arg.req) {
		case "updatedSeat":

			index = arg.id.substring(1,4).split("-");
            
			console.log(`detected click on seat, fila n.${parseInt(index[0]) +1}, posto n.${parseInt(index[1]) + 1}`);

			//prende il posto esatto della matrice del sedile cliccato tramite gli args passati (in questo caso array di indici della matrice) e conversione del nmumero del sedile con XOR -> ^=1 (cosi non ci sono controlli ulteriori ma in automatico viene switchato)
			seat = data.posti[index[0]][index[1]];
			seat.statusSeat ^= 1, seat.ownedBy = arg.status.ownedBy;
			
			fs.writeFileSync(__dirname + "/static/data/data.json", JSON.stringify(data, null, "\t"));
			io.emit("functionForClient", { req: "updatedSeatfromServer" });
			break;
                /*
                case "clear":
                	console.log("richiesto clear from socket");

                	socket.emit("functionFromAdmin", "clear");
                	socket.on("functionFromAdmin", () => {

                	});
                	break;
                */
                /*
                case "changeNickname":
                    console.log("Nickname");

                    data.posti.map(row => {
                        row.map(seat => {
                            if (seat.ownedBy == arg.oldName) seat.ownedBy = arg.newName;
                        });
                    });

                    fs.writeFileSync("./static/data/data.json", JSON.stringify(data, null));
                    io.emit("functionForClient", { req: "updatedSeatfromServer" });
                    break;
                case "clearRow":

                    data.posti[arg.NumRow] = ["0", "0", "0", "0", "0", "0", "0", "0"];

                    fs.writeFileSync("./static/data/data.json", JSON.stringify(data, null));
                    io.emit("functionForClient", { req: "updatedSeatfromServer", clear: true });
                    break;
                */
		}
	});
});

server.listen(3000, () => {
	console.log("http://localhost:3000/");
});