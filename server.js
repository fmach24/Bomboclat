import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";


const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

//na razie const ilosc rgaczy do odpalenia gry
const REQUIRED_PLAYERS = 2;
const DETONATION_TIME = 2.5 * 1000;
const STANDARD_RANGE = 2;
const BUFFED_RANGE = 4;
const HP_MAX = 3;

let mapName = "";
let mapHeight = 0;
let mapWidth = 0;
let map = null;
let mapCreatedCount = 0; // Licznik graczy którzy wysłali mapCreated
let powerupTimer = null; // Referencja do timera powerupów

//to nie jest na razie uzyteczne ale jakbysmy chcieli zablokowac pojawianie sie powerupoow to zostawiam
// let powerupTimerStarted = false; // Flaga czy timer powerupów już został uruchomiony

//Tu info o pozycji, o hp, o powerupach.
const sockets = {};
const mapPreferences = {}; // Preferencje map od graczy
const players = {};




//!!!!!!!!!!! TODO: nie przydziela na podczatku graczowi xy, wiec bomba nie wybucha na nim, dopiero gdy sie ruszy


// //tworzenie mapy (przenienione do GameScene.js)
// const map = Array.from({ length: mapHeight }, () =>
//     Array.from({ length: mapWidth }, () => ({ bomb: null, powerup: false, wall: false }))
// );

// for (let i = 0; i < mapHeight; i++) {
//     map[i][0].wall = true;
//     map[i][mapWidth - 1].wall = true;
// }
// for (let i = 0; i < mapWidth; i++) {
//     map[0][i].wall = true;
//     map[mapHeight - 1][i].wall = true;
// }
// // console.log("Map:", map);





function snapToGrid(value, gridSize) {
    return Math.floor(value / gridSize) * gridSize;
}

function toMapIndex(value, gridSize) {
    return value / gridSize;
}

io.on("connection", (socket) => {

    let playerId = null;

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
            hasPlantedBomb: false,
            bonusCharges: 0,
            powerups: [false, false, false], // przykładowe powerupy
            currentDirection: "right" // nowa właściwość do przechowywania kierunku ruchu
        };


        // Zapisz preferencję mapy
        if (data.preferredMap) {
            mapPreferences[playerId] = data.preferredMap;
        }

        console.log("User connected:", socket.id);
        console.log("Current sockets:", sockets);
        console.log("Map preferences:", mapPreferences);
        //TODO: gdy gra sie zacznie i osobna wyjdzie z gry i dolaczy znowu, to zacznie nowa gre wtedy, moze zrobic tak, że sockets beda usuwane po rozpoczaciu gry?
        //gdy jest 4 graczy
        if (Object.keys(sockets).length === REQUIRED_PLAYERS) {
            // Losuj mapę z preferencji graczy
            const availableMaps = Object.values(mapPreferences);
            if (availableMaps.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableMaps.length);
                mapName = availableMaps[randomIndex];
            } else {
                mapName = "beach"; // Fallback jeśli brak preferencji
            }

            console.log("Selected map:", mapName);

            //tmp assign some start positions.
            let i = 1;
            for (const key of Object.keys(players)) {
                players[key].spawn = 'spawn' + i;
                i++;
            }

            io.emit("startGame", sockets, players, mapName); // wyślij sygnał do wszystkich, że gra się zaczyna
        }
    });

    //na razie to jest tak że od kazdego gracza server dostaje mapCrated
    socket.on('mapCreated', (data) => {
        mapCreatedCount++; // Zwiększ licznik
        console.log(`mapCreated otrzymane od gracza ${mapCreatedCount}/${REQUIRED_PLAYERS}`);
        // Uruchom timer powerupów dopiero gdy wszyscy gracze wyślą mapCreated
        if (mapCreatedCount === REQUIRED_PLAYERS) {// && !powerupTimerStarted) {
            // powerupTimerStarted = true;
            
            console.log("Wszyscy gracze wysłali mapCreated - uruchamiam timer powerupów");

            mapHeight = data.mapArray.length;
            mapWidth = data.mapArray[0].length;
            map = data.mapArray;

            //obsluga powerupow
            powerupTimer = setInterval(() => {

                // gdy nie ma graczy zatrzymaj timer
                if (Object.keys(players).length === 0) {
                    console.log("Brak graczy - zatrzymuję timer powerupów");
                    clearInterval(powerupTimer);
                    powerupTimer = null;
                    return;
                }

                // Wybierz losowe współrzędne na podstawie rzeczywistych wymiarów

                while (true) {
                    const x = Math.floor(Math.random() * mapWidth);
                    const y = Math.floor(Math.random() * mapHeight);
                    const type = Math.floor(Math.random() * 3);

                    if (!map[y][x].wall && !map[y][x].bomb && !map[y][x].powerup) {
                        map[y][x].powerup = true;
                        io.emit('spawnPowerup', { x, y, type: type });
                        console.log("POWERUP:", x, y);
                        console.log("TYPE:", type);
                        break;
                    } else {
                        console.log("zajete miejsce");
                    }

                    console.log("POWERUP:", x, y);
                    console.log("TYPE:", type);
                }
            }, 10000); // co 10 sekund
        }
    });

    //TODO: dokonczyc obsluge powerupow
    //obsługa zebrania powerupa
    socket.on('pickedPowerup', (data) => {
        //server wie jaki gracz ma powerup
        const { id, x, y, type } = data;
        console.log(id, x, y, type);
        map[y][x].powerup = false;

        players[id].powerups[type] = true; // przyznaj powerup graczowi
        console.log(players[id]);
        io.emit('update', players); // wyślij zaktualizowaną listę graczy do wszystkich klientów

        io.emit('destroyPowerup', { x, y });

        // TODO: w trakcie posiadania powerupa gdy zbierze sie kolejny tego samego typu to NIE przedluza sie czas działania, trzena zrobic time stampy
        setTimeout(() => {
            players[id].powerups[type] = false;
            console.log("Graczowi konczy sie powerup", players[id]);
            io.emit('update', players); // wyślij zaktualizowaną listę graczy do wszystkich klientów
        }, 10000); // powerup trwa 10 sekund

    });


    socket.on('moved', (data) => {

        //When game is inproperly started it crushes the server thats what the null check is for
        if (!players[data.id])
            return;
        players[data.id].x = data.x
        players[data.id].y = data.y
        players[data.id].currentDirection = data.direction; // aktualizuj kierunek ruchu


        io.emit('update', players)
    })



    //TODO: naprawic usuwanie graczy i zmienic zeby po uuid bylo (maybe sesja pozniej), do tego sensownie playerid trzymac i uzywac
    socket.on("disconnect", () => {
        delete sockets[socket.id];
        delete players[playerId];
        delete mapPreferences[playerId];
        mapCreatedCount = 0; // Zresetuj licznik

        // Jeśli nie ma już graczy, zatrzymaj timer powerupów
        if (Object.keys(players).length === 0 && powerupTimer) {
            console.log("Ostatni gracz się rozłączył - zatrzymuję timer powerupów");
            clearInterval(powerupTimer);
            powerupTimer = null;
        }

        console.log("User disconnected:", socket.id);
        console.log("Current sockets:", sockets);
    });






    socket.on("plantBomb", (ply) => {

        //START HELPES:

        const checkIfPlayerHit = (bomb, x, y) => {
            Object.values(players).forEach(p => {
                const playerGridX = toMapIndex(snapToGrid(p.x, 64), 64);
                const playerGridY = toMapIndex(snapToGrid(p.y, 64), 64);

                if (playerGridX == x && playerGridY == y) {

                    //TODO: probably wanna have some animation for damage
                    p.health--;
                    //TODO: mechanika co jesli gracz ma 0hp
                    io.emit('update', players);
                }

            });
        }

        const detonateBomb = (gridX, gridY, bomb) => {
            // TODO: TUTAJ jest hardcoded xy mapy, teraz jest zdefiniowane wyzej przy tworzeniu mapy, ale nie zmieniam tu bo nw czy sie nie rozjebie cos


            let x_offset, y_offset;
            const affectedArea = Array.from({ length: mapHeight }, () =>
                Array.from({ length: mapWidth }, () => ( false))
            );
            // order of checking: bomb range, world borders, wall
            


            // going left:
            x_offset = -1;
            y_offset = 0;
            while (Math.abs(x_offset) <= bomb.range &&
                gridX + x_offset >= 0 &&
                !map[gridY + y_offset][gridX + x_offset].wall) {

                checkIfPlayerHit(bomb, gridY + y_offset,gridX + x_offset);
                affectedArea[gridY + y_offset][gridX + x_offset] = true;
                x_offset--;
            }

            // going right:
            x_offset = 1;
            y_offset = 0;
            while (x_offset <= bomb.range &&
                gridX + x_offset < mapWidth &&
                !map[gridY + y_offset][gridX + x_offset].wall) {

                checkIfPlayerHit(bomb, gridY + y_offset,gridX + x_offset);
                affectedArea[gridY + y_offset][gridX + x_offset] = true;
                x_offset++;
            }

            // going upwards:
            x_offset = 0;
            y_offset = 1;
            while (y_offset <= bomb.range &&
                gridY + y_offset < mapHeight &&
                !map[gridY + y_offset][gridX + x_offset].wall) {

                checkIfPlayerHit(bomb, gridY + y_offset,gridX + x_offset);
                affectedArea[gridY + y_offset][gridX + x_offset] = true;
                y_offset++;
            }

            // going downwards:
            x_offset = 0;
            y_offset = -1;
            while (Math.abs(y_offset) <= bomb.range &&
                gridY + y_offset >= 0 &&
                !map[gridY + y_offset][gridX + x_offset].wall) {

                checkIfPlayerHit(bomb, gridY + y_offset,gridX + x_offset);
                affectedArea[gridY + y_offset][gridX + x_offset] = true;
                y_offset--;
            }

            
            map[gridY][gridX].bomb = null;
            players[bomb.id].hasPlantedBomb = false;

            affectedArea[gridY][gridX] = true;
            socket.emit("explosionDetails", affectedArea);
        };

        const isOnCooldown = (ply) => {

            if(players[ply.id].powerups[2]){
                return players[ply.id].bonusCharges > 0
            }
            else{
                return players[ply.id].hasPlantedBomb;
            }
        }
        const getRangeFor = (ply) => {
            return STANDARD_RANGE;
        }


        //END HELPERS


        const bombX = snapToGrid(ply.x, 64);
        const bombY = snapToGrid(ply.y, 64);

        const gridX = Math.floor(bombX / 64);
        const gridY = Math.floor(bombY / 64);

        if (!isOnCooldown(ply)
            && map[gridY][gridX].bomb == null) {

            const bomb = { range: getRangeFor(ply), id: ply.id, timeout: DETONATION_TIME, x: bombX, y: bombY };
            map[gridY][gridX].bomb = bomb;
            players[ply.id].hasPlantedBomb = true;

            if(players[ply.id].powerups[2]){
                players[ply.id].bonusCharges = Math.max(0, players[ply.id].bonusCharges-1);
            }

            setTimeout(() => {
                detonateBomb(gridY, gridX, bomb);
            }, DETONATION_TIME);

            io.emit("newBomb", bomb);
        }
    })
});



server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});