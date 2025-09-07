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
const STANDARD_RANGE = 3;
const BUFFED_RANGE = 4;
const HP_MAX = 3;
// TODO: map name powninno byc ustawiane przez graczy, na razei jest hardcoded
let MAP_NAME = "";
const sockets = {};
const mapPreferences = {}; // Preferencje map od graczy

//Tu info o pozycji, o hp, o powerupach.
const players = {};



const mapHeight = 10;
const mapWidth = 10;




//tworzenie mapy
const map = Array.from({ length: mapHeight }, () =>
    Array.from({ length: mapWidth }, () => ({ bomb: null, powerup: false, wall: false }))
);

for (let i = 0; i < mapHeight; i++) {
    map[i][0].wall = true;
    map[i][mapWidth - 1].wall = true;
}
for (let i = 0; i < mapWidth; i++) {
    map[0][i].wall = true;
    map[mapHeight - 1][i].wall = true;
}
// console.log("Map:", map);

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
            powerups: [false, false, false] // przykładowe powerupy
        };

        // Zapisz preferencję mapy
        if (data.preferredMap) {
            mapPreferences[playerId] = data.preferredMap;
        }

        console.log("User connected:", socket.id);
        console.log("Current sockets:", sockets);
        console.log("Map preferences:", mapPreferences);

        //gdy jest 4 graczy
        if (Object.keys(sockets).length === REQUIRED_PLAYERS) {
            // Losuj mapę z preferencji graczy
            const availableMaps = Object.values(mapPreferences);
            if (availableMaps.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableMaps.length);
                MAP_NAME = availableMaps[randomIndex];
            } else {
                MAP_NAME = "beach"; // Fallback jeśli brak preferencji
            }

            console.log("Selected map:", MAP_NAME);

            //tmp assign some start positions.
            let i = 1;
            for (const key of Object.keys(players)) {
                players[key].spawn = 'spawn' + i;
                i++;
            }

            io.emit("startGame", sockets, players, MAP_NAME); // wyślij sygnał do wszystkich, że gra się zaczyna
        }
    });

    //TODO: zaczyna leciec timer od razu po wlaczeniu serwera chyba
    //obsluga powerupow
    setInterval(() => {
        // Sprawdź czy gra jest aktywna (są gracze)
        if (Object.keys(players).length < REQUIRED_PLAYERS) return;

        // Wybierz losowe współrzędne na podstawie rzeczywistych wymiarów
        const x = Math.floor(Math.random() * mapWidth);
        const y = Math.floor(Math.random() * mapHeight);

        const type = Math.floor(Math.random() * 3);

        if (!map[x][y].wall && !map[x][y].bomb && !map[x][y].powerup) {
            map[x][y].powerup = true;
            io.emit('spawnPowerup', { x, y, type: type });
        } else {
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


        io.emit('update', players)
    })



    //TODO: naprawic usuwanie graczy i zmienic zeby po uuid bylo (maybe sesja pozniej), do tego sensownie playerid trzymac i uzywac
    socket.on("disconnect", () => {
        delete sockets[socket.id];
        delete players[playerId];
        if (playerId) {
            delete mapPreferences[playerId];
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
                    io.emit('update', players);

                }

            });
        }

        const detonateBomb = (gridX, gridY, bomb) => {
            // TODO: TUTAJ jest hardcoded xy mapy, teraz jest zdefiniowane wyzej przy tworzeniu mapy, ale nie zmieniam tu bo nw czy sie nie rozjebie cos
            const mapWidth = 10;
            const mapHeight = 10;

            let x_offset, y_offset;

            // order of checking: bomb range, world borders, wall

            // going left:
            x_offset = -1;
            y_offset = 0;
            while (Math.abs(x_offset) <= bomb.range &&
                gridX + x_offset >= 0 &&
                !map[gridX + x_offset][gridY + y_offset].wall) {

                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                x_offset--;
            }

            // going right:
            x_offset = 1;
            y_offset = 0;
            while (x_offset <= bomb.range &&
                gridX + x_offset < mapWidth &&
                !map[gridX + x_offset][gridY + y_offset].wall) {

                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                x_offset++;
            }

            // going upwards:
            x_offset = 0;
            y_offset = 1;
            while (y_offset <= bomb.range &&
                gridY + y_offset < mapHeight &&
                !map[gridX + x_offset][gridY + y_offset].wall) {

                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                y_offset++;
            }

            // going downwards:
            x_offset = 0;
            y_offset = -1;
            while (Math.abs(y_offset) <= bomb.range &&
                gridY + y_offset >= 0 &&
                !map[gridX + x_offset][gridY + y_offset].wall) {

                checkIfPlayerHit(bomb, gridX + x_offset, gridY + y_offset);
                y_offset--;
            }

            // usuń bombę ze środka
            map[gridX][gridY].bomb = null;

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

        if (!isOnCooldown(ply)
            && map[gridX][gridY].bomb == null) {

            const bomb = { range: getRangeFor(ply), id: ply.id, timeout: DETONATION_TIME, x: bombX, y: bombY };
            map[gridX][gridY].bomb = bomb;

            setTimeout(() => {
                detonateBomb(gridX, gridY, bomb);
            }, DETONATION_TIME);

            io.emit("newBomb", bomb);
        }
    })
});



server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
});