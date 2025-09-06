import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const DETONATION_TIME = 2.5 * 1000;
const STANDARD_RANGE = 3;
const BUFFED_RANGE = 4;
const HP_MAX = 3;
// TODO: map name powninno byc ustawiane przez graczy, na razei jest hardcoded
let mapName = "";
const sockets = {};

//Tu info o pozycji, o hp, o powerupach.
const players = {};

//tworzenie mapy
const map = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ bomb: null, powerup: false, wall: false }))
);

for (let i = 0; i < 10; i++) {
    map[i][0].wall = true;
    map[i][9].wall = true;
    map[0][i].wall = true;
    map[9][i].wall = true;
}
// console.log("Map:", map);

function snapToGrid(value, gridSize) {
    return Math.floor(value / gridSize) * gridSize;
}

function toMapIndex(value,gridSize){
    return value / gridSize;
}

io.on("connection", (socket) => {

    let playerId = null;

    // TODO: czemu wszystko jest w jednym onie?
    socket.on("registerPlayer", (data) => {

        // playerId = Object.keys(sockets).length + 1;
        playerId = uuidv4();

        sockets[socket.id] = {
            nick: data.nick,
            id: playerId
        };

        players[playerId] = {
            nick: data.nick,
            id: playerId,
            spawn: "",
            health: HP_MAX,
            x: null,
            y: null,
            powerups: [false, false, false] // przykładowe powerupy
        };

        console.log("User connected:", socket.id);
        console.log("Current sockets:", sockets);

        //gdy jest 4 graczy
        if (Object.keys(sockets).length === 2) {
            mapName = "beach";

            //tmp assign some start positions.
            let i = 1;
            for (const key of Object.keys(players)) {
                players[key].spawn = 'spawn' + i;
                i++;
            }

            io.emit("startGame", sockets, players, mapName); // wyślij sygnał do wszystkich, że gra się zaczyna
        }
    });

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

    //TODO: dokonczyc obsluge powerupow
    //obsługa zebrania powerupa
    socket.on('pickedPowerup', (data) => {
        //server wie jaki gracz ma powerup
        const { id, x, y, type } = data;
        console.log(id, x, y, type);
        map[x][y].powerup = false;

        players[id].powerups[type] = true; // przyznaj powerup graczowi
        console.log(players[id]);
        io.emit('update', players); // wyślij zaktualizowaną listę graczy do wszystkich klientów

        io.emit('destroyPowerup', { x, y });

        setTimeout(() => {
            players[id].powerups[type] = false;
            console.log("Graczowi konczy sie powerup", players[id]);
            io.emit('update', players); // wyślij zaktualizowaną listę graczy do wszystkich klientów
        }, 10000); // powerup trwa 10 sekund
        
    });


    socket.on('moved', (data) => {

        players[data.id].x = data.x
        players[data.id].y = data.y


        io.emit('update', players)
    })



    //TODO: naprawic usuwanie graczy i zmienic zeby po uuid bylo (maybe sesja pozniej), do tego sensownie playerid trzymac i uzywac
    socket.on("disconnect", () => {
        delete sockets[socket.id];
        delete players[playerId];

        console.log("User disconnected:", socket.id);
        console.log("Current sockets:", sockets);
    });





     
    socket.on("plantBomb", (ply)=>{

        //START HELPES:

        const checkIfPlayerHit= (bomb,x,y)=>{
            Object.values(players).forEach(p => {
                const playerGridX = toMapIndex(snapToGrid(p.x, 64),64);
                const playerGridY = toMapIndex(snapToGrid(p.y, 64),64);

                //No damage from your own bomb?
                if (playerGridX == x && playerGridY == y) {
                    
                    //TODO: probably wanna have some animation for damage
                    p.health--;
                    io.emit('update', players);
                    console.log(p.health, p.nick);
                }

            });
        }

        const detonateBomb = (gridX, gridY, bomb) => {

            const mapWidth = 10;
            const mapHeight = 10;

            let x_offset = 0;
            let y_offset = 0;

            //order of checking: bomb range, world borders, wall

            //going left:
            while (Math.abs(x_offset) <= bomb.range &&
                gridX + x_offset >= 0 &&
                !map[gridX + x_offset][gridY + y_offset].wall) {

                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                x_offset--;
            }


            //going right:
            x_offset = 0;
            while (x_offset <= bomb.range &&
                gridX + x_offset < mapWidth &&
                !map[gridX + x_offset][gridY + y_offset].wall) {
                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                x_offset++;
            }

            //going upwards:
            x_offset = 0;
            while (y_offset <= bomb.range &&
                gridY + y_offset < mapHeight &&
                !map[gridX + x_offset][gridY + y_offset].wall) {

                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                y_offset++;
            }

            y_offset = 0;

            //going downwards:
            x_offset = 0;
            while (Math.abs(y_offset) <= bomb.range &&
                gridY + y_offset >= 0 &&
                !map[gridX + x_offset][gridY + y_offset].wall) {

                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                y_offset--;
            }

            map[gridX][gridY] = null;
        };

        const isOnCooldown = () => {

            return false;
        }
        const getRangeFor = (ply) => {
            return STANDARD_RANGE;
        }


        //END HELPERS


        const bombX = snapToGrid(ply.x, 64);
        const bombY = snapToGrid(ply.y, 64);

        const gridX = Math.floor(bombX / 64);
        const gridY = Math.floor(bombY / 64);

        if(!isOnCooldown(ply) 
            && map[gridX][gridY].bomb == null){

            const bomb =  {range: getRangeFor(ply), id:ply.id, timeout: DETONATION_TIME, x: bombX, y:bombY};
            map[gridX][gridY].bomb = bomb;

            setTimeout(()=>{
                detonateBomb(gridX,gridY, bomb);
            }, DETONATION_TIME);

            io.emit("newBomb", bomb);
        }
    })
});



server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});