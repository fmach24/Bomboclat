export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");

    }

    preload() {
        //mapy
        this.load.tilemapTiledJSON("beachMap", "assets/beachMap.tmj");
        this.load.image("beachTiles", "assets/beachTiles.png");

        this.load.tilemapTiledJSON("forestMap", "assets/forestMap.tmj");
        this.load.image("forestTiles", "assets/forestTiles.png");

        // sprite gracza
        this.load.spritesheet("player", "assets/player.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        // sprite powerup0
        this.load.spritesheet("powerup0", "assets/1x1.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        // sprite powerup1
        this.load.spritesheet("powerup1", "assets/1x1.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        // sprite powerup2
        this.load.spritesheet("powerup2", "assets/1x1.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        //breakables
        this.load.spritesheet("breakable1x1", "assets/breakable1x1.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet("breakable2x1", "assets/breakable2x1.png", {
            frameWidth: 128,
            frameHeight: 64
        });
        // sprite bomby
        this.load.spritesheet("bomb", "assets/tmp_bomb.png", {
            frameWidth: 64,
            frameHeight: 64
        });
    }


    //start scene -> create
    create(data) {

        // alert(data.players);
        this.mapName = data.mapName;
        this.players = data.players;
        this.playerId = data.playerId;
        this.socket = data.socket;
        this.speed = 300;
        this.map = null;

        console.log("Players in GameScene:", this.players);
        console.log("My player ID:", this.playerId);
        console.log("My socket:", this.socket);
        console.log("Loading map:", this.mapName);

        this.buildMap(data);

        //game network event handlers:

        this.socket.on('spawnPowerup', (data) => { this.spawnPowerup(data); });

        this.socket.on('destroyPowerup', (data) => { this.destroyPowerup(data); });

        this.socket.on('update', (data) => { this.updatePlayers(data); });

        this.socket.on('newBomb', (data) => { this.newBomb(data); });
    }



    buildMap() {
        // this.load.tilemapTiledJSON("map", "assets/" + mapName + "Map.tmj");
        // this.load.image("tilesKey", "assets/" + mapName + "Tiles.png");
        // Tworzymy mapę
        const map = this.make.tilemap({ key: this.mapName + "Map" });
        const tileset = map.addTilesetImage("tiles", this.mapName + "Tiles");

        // 2 warstwy kafelkowe
        const groundLayer = map.createLayer("groundLayer", tileset, 0, 0);
        const wallsLayer = map.createLayer("wallsLayer", tileset, 0, 0);

        // Kolizje dla ścian
        // wallsLayer.setCollisionByProperty({ collides: true });

        wallsLayer.setCollisionByExclusion([-1]);



        // Warstwa obiektów: Spawns
        const spawnLayer = map.getObjectLayer("spawnPoints");

        //Osobno nasz lokalny gracz a osobno reszta otrzyjmuje polozenie.
        let spawntag = this.players[this.playerId].spawn;
        let spawnPoint = spawnLayer.objects.find(obj => obj.name === spawntag);

        this.playerGroup = this.physics.add.group()

        if (spawnPoint) {
            // utwórz sprite gracza w pozycji spawn1
            this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "player");
            this.player.setCollideWorldBounds(true);
            this.playerGroup.add(this.player)
            this.player.name = this.playerId; // assign proper id so we can later on find exact sprite:
        }
        this.physics.add.collider(this.player, wallsLayer);


        Object.values(this.players).forEach(ply => {
            if (ply.id !== this.playerId) {
                const spawnPoint = spawnLayer.objects.find(obj => obj.name === ply.spawn);

                // Create main sprite
                const sprite = this.add.sprite(0, 0, 'player');

                // Create nickname text
                const nickname = this.add.text(0, -56, ply.nick || "NICK", {
                    fontSize: "16px",
                    color: "#fff",
                    stroke: "#000",
                    strokeThickness: 3
                }).setOrigin(0.5);

                const hp_bar = this.add.text(0, -40, "100%", {
                    fontSize: "16px",
                    color: "#47c070ff",
                    stroke: "#000",
                    strokeThickness: 4
                }).setOrigin(0.5);

                hp_bar.name = "hp_bar";

                // Put sprite + text into a container
                const player = this.add.container(spawnPoint.x, spawnPoint.y, [sprite, nickname, hp_bar]);

                // Enable physics on the container
                this.physics.world.enable(player);

                // Adjust body size to match sprite
                player.body.setSize(sprite.width, sprite.height);
                player.body.setOffset(-sprite.width / 2, -sprite.height / 2);

                // Add collisions
                this.physics.add.collider(player, wallsLayer);

                // Add to player group
                this.playerGroup.add(player);

                // Assign ID for later lookup
                player.name = ply.id;
            }
        });


        // //spawning breakable walls
        // const breakableLayer = map.getObjectLayer("breakableSpawns");
        // const breakable1x1 = breakableLayer.objects.filter(obj => obj.type === "breakable1x1");
        // const breakable2x1 = breakableLayer.objects.filter(obj => obj.type === "breakable2x1");

        // this.breakablesGroup = this.physics.add.staticGroup();

        // for (let obj of breakable1x1) {
        //     const wall = this.breakablesGroup.create(obj.x, obj.y, "breakable1x1");
        //     wall.setData("hp", null); // przykładowe HP
        //     wall.setData("x", obj.x);
        //     wall.setData("y", obj.y);
        //     this.breakablesGroup.add(wall);
        // }

        // for (let obj of breakable2x1) {
        //     const wall = this.breakablesGroup.create(obj.x, obj.y, "breakable2x1");
        //     wall.setData("hp", null); // przykładowe HP
        //     wall.setData("x", obj.x);
        //     wall.setData("y", obj.y);
        //     this.breakablesGroup.add(wall);
        // }

        // this.physics.add.collider(this.player, this.breakablesGroup);

        // Kamera podąża za graczem
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // 📌 Warstwa obiektów: Powerups
        this.powerups = this.physics.add.group();
        // const powerupSpawns = map.getObjectLayer("powerupSpawns");

        this.bombGroup = this.physics.add.group();

    }

    //NETWORK:

    //proceeds powerup spawn (received from server)
    spawnPowerup(data) {
        console.log("Received spawnPowerup event:", data);
        const { x, y, type } = data;
        const powerupKey = 'powerup' + type; // Zakładamy, że masz różne klucze dla różnych typów powerupów            
        const powerup = this.physics.add.sprite(x * 64 + 32, y * 64 + 32, powerupKey);
        powerup.setData("x", x);
        powerup.setData("y", y);
        powerup.setData("type", type);
        this.powerups.add(powerup);

        //zebranie powerupa
        this.physics.add.overlap(this.player, powerup, (player, powerup) => {
            this.socket.emit('pickedPowerup', { id: this.playerId, x: powerup.getData('x'), y: powerup.getData('y'), type: powerup.getData('type') });
            // powerup.destroy(); // usuń powerupa z mapy
        });
    }

    //destroys powerup (data from server)
    destroyPowerup(data) {
        const { x, y } = data;
        const powerup = this.powerups.getChildren().find(p => p.getData('x') === x && p.getData('y') === y);
        if (powerup) {
            powerup.destroy();
        }
    }


    //proceeds update from the server.
    updatePlayers(players) {

        Object.values(players).forEach(ply => {

            const sprite = this.playerGroup.getChildren().find(x => x.name == ply.id);
            if (sprite && (ply.x != null) && (ply.y != null)) {
                // console.log(players)

                // console.log(ply, players);

                if (ply.id == this.playerId) {
                    // Domyślna prędkość
                    // this.speed = 300;
                    if (ply.powerups[0]) {
                        this.speed = 600; // Powerup SPEED
                    }
                    else {
                        this.speed = 300; // Brak powerupu SPEED
                    }
                }
                else {
                    sprite.setPosition(ply.x, ply.y);
                }
            }
        });
    }


    sendUpdate() {
        this.socket.emit('moved', { id: this.playerId, x: this.player.x, y: this.player.y })
    }

    newBomb(bomb) {

        const bombSprite = this.physics.add.sprite(bomb.x + 32, bomb.y + 32, "bomb");
        this.bombGroup.add(bombSprite);
        setTimeout(() => { bombSprite.destroy(); }, bomb.timeout);
    }



    plantBomb() {
        this.socket.emit('plantBomb', { id: this.playerId, x: this.player.x, y: this.player.y });
    }

    update() {
        // Sterowanie z historią wciśniętych klawiszy
        const cursors = this.input.keyboard.createCursorKeys();

        // Inicjalizuj stos klawiszy jeśli nie istnieje
        if (!this.keyStack) {
            this.keyStack = [];
        }

        // Dodaj nowo wciśnięte klawisze na górę stosu
        if (Phaser.Input.Keyboard.JustDown(cursors.left) && !this.keyStack.includes('left')) {
            this.keyStack.push('left');
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.right) && !this.keyStack.includes('right')) {
            this.keyStack.push('right');
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.up) && !this.keyStack.includes('up')) {
            this.keyStack.push('up');
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.down) && !this.keyStack.includes('down')) {
            this.keyStack.push('down');
        }

        // Usuń puszczone klawisze ze stosu
        if (!cursors.left.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'left');
        }
        if (!cursors.right.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'right');
        }
        if (!cursors.up.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'up');
        }
        if (!cursors.down.isDown) {
            this.keyStack = this.keyStack.filter(key => key !== 'down');
        }

        this.player.setVelocity(0);

        // Użyj ostatniego klawisza ze stosu (najnowszy wciśnięty)
        const currentKey = this.keyStack[this.keyStack.length - 1];
        
        if (currentKey === 'left') {
            this.player.setVelocityX(-this.speed);
        } else if (currentKey === 'right') {
            this.player.setVelocityX(this.speed);
        } else if (currentKey === 'up') {
            this.player.setVelocityY(-this.speed);
        } else if (currentKey === 'down') {
            this.player.setVelocityY(this.speed);
        }

        if (this.player.body.velocity.length() > 0) {
            this.sendUpdate()
        }

        if (cursors.space.isDown) {
            this.plantBomb();
        }
    }


}

