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


//quando un client effettua una connessione
io.on("connection", async(socket) => {

	let data = JSON.parse(fs.readFileSync("./static/data/data.json"));

	//read user log file to see if socket ip already exist = already visited the site
	let user_data = JSON.parse(fs.readFileSync("./static/data/user_log.json", "utf-8"));

	socket.on("ip", (arg) => {
	
		if (!JSON.stringify(user_data).includes(arg.ip)) {
			//if a new user sava all the data (ip and socket id) in the json
			console.log("new user connected -> ");

			console.log(arg);
			user_data.push(arg);
			fs.writeFileSync("./static/data/user_log.json", JSON.stringify(user_data, null, 4));
		} else {
			//if the ip already entered the site one time, modify only the socket id
			console.log("existing user connected -> ");

			//finding the exact slot inside the json (retrieving json)
			let t = user_data.find(element => element.ip == arg.ip);
			t.id = arg.id;
			//re-writing the file with the edited user_data
			fs.writeFileSync("./static/data/user_log.json", JSON.stringify(user_data, null, 4));
		}
		console.log(arg);

		if (arg.username == "admin:admin") {
			socket.emit("functionFromClient", {
				req: "admin",
				admin: true,
			});
		}
	});

	socket.on("functionForServer", (arg) => {

		let index, seat;

		switch (arg.req) {
		case "updatedSeat":

			index = arg.id.substring(1,4).split("-");
            
			console.log(`detected click on seat, fila n.${parseInt(index[0]) +1}, posto n.${parseInt(index[1]) + 1}`);

			//prende il posto esatto della matrice del sedile cliccato tramite gli args passati (in questo caso array di indici della matrice) e conversione del nmumero del sedile con XOR -> ^=1 (cosi non ci sono controlli ulteriori ma in automatico viene switchato)
			seat = data.posti[index[0]][index[1]];
			seat.statusSeat ^= 1, seat.ownedBy = arg.status.ownedBy;
			
			fs.writeFileSync("./static/data/data.json", JSON.stringify(data, null));
			io.emit("functionFromClient", { req: "updatedSeatfromServer" });
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
                    io.emit("functionFromClient", { req: "updatedSeatfromServer" });
                    break;
                case "clearRow":

                    data.posti[arg.NumRow] = ["0", "0", "0", "0", "0", "0", "0", "0"];

                    fs.writeFileSync("./static/data/data.json", JSON.stringify(data, null));
                    io.emit("functionFromClient", { req: "updatedSeatfromServer", clear: true });
                    break;
                */
		}
	});
});

server.listen(3000, () => {
	console.log("http://localhost:3000/");
});