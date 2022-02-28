const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs');

//load static folder for static element
app.use("/static", express.static("./static"));

//index
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


//quando un client effettua una connessione
io.on("connection", async(socket) => {
    socket.on("ip", (arg) => {

        //read user log file to see if socket ip already exist = already visited the site
        data = JSON.parse(fs.readFileSync("./static/data/user_log.json", "utf-8"));

        if (!JSON.stringify(data).includes(arg.ip)) {
            //if a new user sava all the data (ip and socket id) in the json
            console.log("new user connected -> ")


            console.log(arg)
            data.push(arg)
            fs.writeFileSync("./static/data/user_log.json", JSON.stringify(data, null, 4))
        } else {
            //if the ip already entered the site one time, modify only the socket id
            console.log("existing user connected -> ");

            //finding the exact slot inside the json (retrieving json)
            t = data.find(element => element.ip == arg.ip);
            t.id = arg.id;
            //re-writing the file with the edited data
            fs.writeFileSync("./static/data/user_log.json", JSON.stringify(data, null, 4))
        }
        console.log(arg);

        if (arg.username == "admin:admin") {
            socket.emit("admin", {
                admin: true,
            })
        }
    });

    socket.on("updatedSeat", (arg) => {

        console.log(arg)
        console.log(`detected click on seat, fila n.${parseInt(arg.indexes[0]) +1}, posto n.${parseInt(arg.indexes[1]) + 1}`);

        data = JSON.parse(fs.readFileSync("./static/data/data2.json"));


        //prende il posto esatto della matrice del sedile cliccato tramite gli args passati (in questo caso array di indici della matrice) e conversione del nmumero del sedile con XOR -> ^=1 (cosi non ci sono controlli ulteriori ma in automatico viene switchato)
        data.posti[arg.indexes[0]][arg.indexes[1]].statusSeat = (arg.status.statusSeat ^= 1).toString();
        data.posti[arg.indexes[0]][arg.indexes[1]].ownedBy = arg.status.ownedBy
            //da sistemare, mettere posot normale
        fs.writeFileSync("./static/data/data2.json", JSON.stringify(data, null))
        io.emit("updatedSeatfromServer", "ciao")
    })

    socket.on("clearRow", (arg) => {
        data = JSON.parse(fs.readFileSync("./static/data/data2.json"));

        arr = ["0", "0", "0", "0", "0", "0", "0", "0"];


        data.posti[arg.NumRow] = arr;


        fs.writeFileSync("./static/data/data2.json", JSON.stringify(data, null))
        io.emit("updatedSeatfromServer", "clearedFromAdmin")
    })


    socket.on("functionFromAdmin", (arg) => {

        switch (arg.req) {
            case "clear":
                console.log("richiesto clear from socket");

                socket.emit("functionFromAdmin", "clear");
                socket.on("functionFromAdmin", (arg) => {

                })
        }
    })
})

server.listen(3000, () => {
    console.log('http://localhost:3000/');
});