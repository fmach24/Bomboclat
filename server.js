import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let mapName = "";
const sockets = {};

//Tu info o pozycji, o hp, o powerupach.
const players = {};

//tworzenie mapy
const map = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ bomb: false, powerup: false, wall: false }))
);

for (let i = 0; i < 10; i++) {
    map[i][0].wall = true;
    map[i][9].wall = true;
    map[0][i].wall = true;
    map[9][i].wall = true;
}
// console.log("Map:", map);

io.on("connection", (socket) => {
    socket.on("registerPlayer", (data) => {

        // playerId = Object.keys(sockets).length + 1;
        const playerId = uuidv4();

        sockets[socket.id] = {
            nick: data.nick,
            id: playerId
        };

        players[playerId] = {
            nick: data.nick,
            x: null,
            y:null
        };

        console.log("User connected:", socket.id);
        console.log("Current sockets:", sockets);

        //gdy jest 4 graczy
        if (Object.keys(sockets).length === 2) {
            mapName = "beach";
            io.emit("startGame", sockets, players, mapName); // wyślij sygnał do wszystkich, że gra się zaczyna
        }

        //obsluga powerupow
        setInterval(() => {
            // Wybierz losowe współrzędne
            const x = Math.floor(Math.random() * Object.keys(map).length);
            const y = Math.floor(Math.random() * Object.keys(map).length);

            const type = Math.floor(Math.random() * 3);

            if (!map[x][y].wall && !map[x][y].bomb && !map[x][y].powerup) {
                map[x][y].powerup = true;
                io.emit('spawnPowerup', { x, y, type: type });
            }
            else {
                console.log("zajete miejsce");
            }
        
            console.log("POWERUP:", x, y);
            console.log("TYPE:", type);
        }, 10000); // co 0.2 sekund

        //TODO: nie usuwa powerupa z tablicy mapy, jakies zjebane typy chyba
        //obsługa zebrania powerupa
        socket.on('pickedPowerup', (data) => {
            //server wie jaki gracz ma powerup
            const { playerId, x, y, type } = data;
            console.log(`Player ${playerId} picked up powerup at (${x}, ${y}) of type ${type}`);
            // map[x][y].powerup = false;
            io.emit('destroyPowerup', { x, y });
        });


        socket.on('moved', (data)=>{
            players[playerId].x = data.x
            players[playerId].y = data.y

            
            io.emit('update', players)
        })
    });


//TODO: naprawic usuwanie graczy i zmienic zeby po uuid bylo (maybe sesja pozniej)
    socket.on("disconnect", () => {
        delete sockets[socket.id];
        delete players[sockets[socket.id]?.id];

        console.log("User disconnected:", socket.id);
        console.log("Current sockets:", sockets);
    });

    //obsluga gry
});


server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});