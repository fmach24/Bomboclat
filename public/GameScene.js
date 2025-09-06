export default class GameScene extends Phaser.Scene {

    static instance = null;
    constructor() {
        super("GameScene");
        GameScene.instance = this
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


    //start scene -> create
    create(data) {

        // alert(data.players);
        this.mapName = data.mapName;
        this.players = data.players;
        this.playerId = data.playerId;
        this.socket = data.socket;


        console.log("Players in GameScene:", this.players);
        console.log("My player ID:", this.playerId);
        console.log("My socket:", this.socket);
        
        this.buildMap(data);
        

        //game network event handlers:

        this.socket.on('spawnPowerup', (data)=> {this.spawnPowerup(data);});

        this.socket.on('destroyPowerup', (data)=> {this.destroyPowerup(data);});

        this.socket.on('update', (data)=>{ this.update(data); });

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
        }
        this.physics.add.collider(this.player, wallsLayer);


        Object.values(this.players).forEach(ply => {
            if (ply.id != this.playerId) {
                spawnPoint = spawnLayer.objects.find(obj => obj.name === ply.spawn);
                const current = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player');

                this.physics.add.collider(current, wallsLayer);

                this.playerGroup.add(current);
                //assign proper id so we can later on find exact sprite:
                current.name = ply.id;
            }

        });

        // if (powerupLayer) {
        //     powerupLayer.objects.forEach(obj => {
        //         if (obj.name.startsWith("powerup")) {
        //             const pu = this.physics.add.sprite(obj.x, obj.y, "powerup");
        //             pu.setData("kind", obj.type || "default");
        //         }
        //     });
        // }



        // Kamera podąża za graczem
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // 📌 Warstwa obiektów: Powerups
        this.powerups = this.physics.add.group();
        // const powerupSpawns = map.getObjectLayer("powerupSpawns");


    }

    //NETWORK:

    //proceeds powerup spawn (received from server)
    spawnPowerup(data) {
        console.log("Received spawnPowerup event:", data);
        const { x, y, type } = data;
        const powerupKey = 'powerup' + type; // Zakładamy, że masz różne klucze dla różnych typów powerupów            
        const powerup = this.physics.add.sprite(x * 64 + 32, y * 64 + 32, powerupKey);
        powerup.setData("x", x, "y", y, "type", type);
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
    updatePlayers(players){
        
        Object.values(players).forEach(ply => {

            const sprite = this.playerGroup.children.find(x=> x.name == ply.id);
            console.log(players)
            sprite.setPosition(ply.x, ply.y)
        });
    }

    
    sendUpdate(){
        this.socket.emit('moved', {id:this.playerId, x:this.player.x, y:this.player.y})
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
        if(this.player.body.velocity.length() > 0){
            this.sendUpdate()
        }
    }
}

