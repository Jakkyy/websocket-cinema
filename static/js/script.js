const { text } = require("body-parser");

async function getIP() {
    data = await $.get('https://www.cloudflare.com/cdn-cgi/trace')
    data = data.trim().split('\n').reduce(function(obj, pair) {
        pair = pair.split('=');
        return obj[pair[0]] = pair[1], obj;
    }, {});
    return data.ip;
}

async function fetchSeat(socket, nickname) {

    posti_matrice = (await (await fetch("./static/data/data2.json")).json()).posti;

    console.log(posti_matrice);

    div = document.getElementById("seats");

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

            element = document.createElement("input");
            element.type = "image";
            element.src = path;
            element.id = `n${i}-${count}`;
            element.onclick = () => {
                changeValue(window.event, socket, nickname);
            }
            element.style = "height: 50px !important;width: 50px !important;padding: 10px !important;"
            element_div.appendChild(element)
        })
    })

    tagWelcome = document.getElementById("username");

    if (txt == "admin:admin") {
        tagWelcome.innerHTML = "ADMIN"
    } else {
        tagWelcome.innerHTML = txt.toLowerCase();
    }

}

async function admin(socket) {
    console.log("Benvenuto ADMIN");

    element = document.createElement("button");
    element.innerHTML = "Clear Row";

    element.onclick = () => {
        socket.emit("functionFromAdmin", {
            req: "clear"
        });
    }

    tag = document.getElementsByClassName("sub-menu")[0].append(element);
}


async function addRow(socket, args) {
    socket.emit("functionFromAdmin", { req: args });
}

async function x(socket, nickname) {

    posti_matrice = (await (await fetch("./static/data/data2.json")).json()).posti;

    console.log(posti_matrice)
    div = document.getElementById("seats");

    posti_matrice.map(async(row, i) => {
        //console.log(`Fila num ${i} -> ${row}`);

        row.map((seat, count) => {

            id = `#n${i}-${count}`;

            element = div.querySelector(id)
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

        })
    })
}

async function clearFromClient(element, socket) {
    row = element.id.replace("n", "").split("-")[0];

    socket.emit("clearRow", { NumRow: row });
}


async function changeValue(element, socket, username) {

    if (element.ctrlKey == true) return;
    //if (element.target.src == "http://localhost:3000/static/img/cinema_seat_oos.svg" || element.target.src == "http://10.130.0.116:3000/static/img/cinema_seat_oos.svg") return alert("Non puoi");

    index = element.target.id.replace("n", "").split("-")

    //get json file 
    posti_matrice = (await (await fetch("static/data/data2.json")).json()).posti;

    //get the numer (oos or available) with index number
    num = posti_matrice[index[0]][index[1]];

    num.ownedBy = username;
    //passing to the server with "UpdatedSeat" the index of the changed seat with the current status -> 0 --> available -> 1 --> oos
    socket.emit("updatedSeat", { indexes: index, status: num });
}
