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

data.posti.forEach(arr => arr.forEach(elem => {
	if(elem.ownedBy == "") elem.statusSeat = 0;
	fs.writeFileSync(__dirname + "/static/data/data.json", JSON.stringify(data, null, "\t"));
}));

//quando un client effettua una connessione
io.on("connection", async(socket) => {

	//read user log file to see if socket ip already exist = already visited the site
	let user_data = JSON.parse(fs.readFileSync(__dirname + "/static/data/user_log.json", "utf-8"));

	socket.on("ip_info_to_server", (arg) => {
	
		let user = user_data.find(element => element.ip_info.ip == arg.ip_info.ip);

		if (!user.ip_info.ip.includes(arg.ip_info.ip)) {
			//if a new user sava all the data (ip and socket id) in the json
			console.log("new user connected -> ");

			user_data.push(arg);
			fs.writeFileSync(__dirname + "/static/data/user_log.json", JSON.stringify(user_data, null, "\t"));
		} else {
			//if the ip already entered the site one time, modify only the socket id
			console.log("existing user connected ->", {ip: arg.ip_info.ip, socket_id: arg.socket_id, username: arg.username});

			//finding the exact slot inside the json (retrieving json)
			
			if(!user.username.includes(arg.username[0])) user.username.push(arg.username[0]);
			if(arg.socket_id != "unavailable") user.socket_id = arg.socket_id;
			
			//re-writing the file with the edited user_data
			fs.writeFileSync(__dirname + "/static/data/user_log.json", JSON.stringify(user_data, null, "\t"));
		}

		let isAdmin;
		arg.username == "admin:admin" ? isAdmin = true : isAdmin = false; 

		socket.emit("functionForClient", {
			req: "init_btn",
			admin: isAdmin,
		});
	});

	socket.on("functionForServer", (arg) => {

		data = JSON.parse(fs.readFileSync(__dirname + "/static/data/data.json"));
		let index, seat;

		switch (arg.req) {
		case "updatedSeat":

			index = arg.id.substring(1,4).split("-");
            
			console.log(`clicked seat, row n.${parseInt(index[0]) +1}, place n.${parseInt(index[1]) + 1}`);

			//prende il posto esatto della matrice del sedile cliccato tramite gli args passati (in questo caso array di indici della matrice) e conversione del nmumero del sedile con XOR -> ^=1 (cosi non ci sono controlli ulteriori ma in automatico viene switchato)
			seat = data.posti[index[0]][index[1]];
			seat.statusSeat ^= 1, seat.ownedBy = arg.status.ownedBy;
			
			fs.writeFileSync(__dirname + "/static/data/data.json", JSON.stringify(data, null, "\t"));
			io.emit("functionForClient", { req: "updatedSeatfromServer" });
			break;
		case "changeNickname":

			data.posti.forEach(row => row.forEach(seat => {
				if(seat.ownedBy == arg.oldName) seat.ownedBy = arg.newName;
			}));
		
			fs.writeFileSync("./static/data/data.json", JSON.stringify(data, null, "\t"));
			io.emit("functionForClient", { req: "updatedSeatfromServer" });
	
			break;
		}
	});
});

server.listen(3000, () => {
	console.log("http://localhost:3000/");
});