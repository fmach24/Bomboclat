export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        // mapa i tileset
        this.load.tilemapTiledJSON("beachMap", "assets/beachMap.tmj");
        this.load.image("beachTiles", "assets/beachTiles.png");
        // sprite gracza
        this.load.spritesheet("player", "assets/1x1.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        // sprite powerup0
        this.load.spritesheet("powerup0", "assets/1x1.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        // sprite powerup1
        this.load.spritesheet("powerup1", "assets/1x1.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        // sprite powerup2
        this.load.spritesheet("powerup2", "assets/1x1.png", {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create(data) {

        // alert(data.players);
        const mapName = data.mapName;
        const players = data.players;
        const playerId = data.playerId;
        const socket = data.socket;

        // this.load.tilemapTiledJSON("map", "assets/" + mapName + "Map.tmj");
        // this.load.image("tilesKey", "assets/" + mapName + "Tiles.png");

        console.log("Players in GameScene:", players);
        console.log("My player ID:", playerId);
        console.log("My socket:", socket);
        // Tworzymy mapę
        const map = this.make.tilemap({ key: mapName + "Map" });
        const tileset = map.addTilesetImage("tiles", mapName + "Tiles");

        // 2 warstwy kafelkowe
        const groundLayer = map.createLayer("groundLayer", tileset, 0, 0);
        const wallsLayer = map.createLayer("wallsLayer", tileset, 0, 0);

        // Kolizje dla ścian
        // wallsLayer.setCollisionByProperty({ collides: true });

        wallsLayer.setCollisionByExclusion([-1]);

        // Warstwa obiektów: Spawns
        const spawnLayer = map.getObjectLayer("spawnPoints");

        // znajdź obiekt o nazwie spawn1
        const spawnPoint = spawnLayer.objects.find(obj => obj.name === "spawn1");

        if (spawnPoint) {
            // utwórz sprite gracza w pozycji spawn1
            this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "player");
            this.player.setCollideWorldBounds(true);
        }

        // if (powerupLayer) {
        //     powerupLayer.objects.forEach(obj => {
        //         if (obj.name.startsWith("powerup")) {
        //             const pu = this.physics.add.sprite(obj.x, obj.y, "powerup");
        //             pu.setData("kind", obj.type || "default");
        //         }
        //     });
        // }

        // Kolizja gracza ze ścianami
        this.physics.add.collider(this.player, wallsLayer);

        // Kamera podąża za graczem
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // 📌 Warstwa obiektów: Powerups
        this.powerups = this.physics.add.group();
        // const powerupSpawns = map.getObjectLayer("powerupSpawns");

        // Obsługa zdarzenia pojawienia się powerupa
        socket.on('spawnPowerup', (data) => {
            console.log("Received spawnPowerup event:", data);
            const { x, y, type } = data;
            const powerupKey = 'powerup' + type; // Zakładamy, że masz różne klucze dla różnych typów powerupów
            const powerup = this.physics.add.sprite(x * 64 + 32, y * 64 + 32, powerupKey);
            powerup.setData("x", x, "y", y, "type", type);
            this.powerups.add(powerup);

            //zebranie powerupa
            this.physics.add.overlap(this.player, powerup, (player, powerup) => {
                socket.emit('pickedPowerup', { playerId, x: powerup.getData('x'), y: powerup.getData('y'), type: powerup.getData('type') });
                // powerup.destroy(); // usuń powerupa z mapy
            });
        });

        socket.on('destroyPowerup', (data) => {
            const { x, y } = data;
            const powerup = this.powerups.getChildren().find(p => p.getData('x') === x && p.getData('y') === y);
            if (powerup) {
                powerup.destroy();
            }
        });

    }

    update() {
        // proste sterowanie WSAD
        const cursors = this.input.keyboard.createCursorKeys();

        const speed = 300;
        this.player.setVelocity(0);

        if (cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            this.player.setVelocityX(speed);
        }

        if (cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            this.player.setVelocityY(speed);
        }
    }
}







// const socket = io();

// export default class GameScene extends Phaser.Scene {

//     constructor() {
//         super("GameScene");
//         // this.player = null;
//         // this.otherPlayers = {};
//     }

//     preload() {
//         this.load.tilemapTiledJSON("map", "assets/map.tmj");

//         // wczytujemy grafikę kafelków (musi się zgadzać nazwa z Tiled!)
//         this.load.image("tilesKey", "assets/tiles.png");
//     }

//     create(data) {
// //!!!!!s
//         const players = data.players;
//         console.log("Players in GameScene:", players);

//         const map = this.make.tilemap({ key: "map" });

//         // Pierwszy parametr = NAZWA TILESETU z Tiled (dokładnie), drugi = klucz obrazu z preload
//         const tileset = map.addTilesetImage("kafle", "tilesKey");

//         // "Warstwa1" zamień na faktyczną nazwę warstwy z Tiled
//         const layer1 = map.createLayer("layer1", tileset, 0, 0);
//         const layer2 = map.createLayer("layer2", tileset, 0, 0);

//         layer1.setVisible(true);

//         layer1.setDepth(1);
//         layer2.setDepth(0);

//         // (opcjonalnie) dopasuj rozmiar kamery do mapy:
//         this.cameras.main.setBounds(0, 0, layer2.width, layer2.height);
//     }

//     update() {
//         // Handle player movement and game logic here
//     }
// }