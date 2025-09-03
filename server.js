import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let playerId = 0;
const sockets = {};
const players = {};

io.on("connection", (socket) => {
    socket.on("registerPlayer", (data) => {

        playerId = Object.keys(sockets).length + 1;

        sockets[socket.id] = {
            nick: data.nick,
            id: playerId
        };

        players[playerId] = {
            nick: data.nick
        };

        console.log("User connected:", socket.id);
        console.log("Current sockets:", sockets);
        
        //gdy jest 4 graczy
        if (Object.keys(sockets).length === 2) {
            io.emit("startGame", sockets, players); // wyślij sygnał do wszystkich, że gra się zaczyna
        }
    });

    socket.on("disconnect", () => {
        delete sockets[socket.id];
        delete players[playerId];

        console.log("User disconnected:", socket.id);
        console.log("Current sockets:", sockets);
    });

    //obsluga gry
});


server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});