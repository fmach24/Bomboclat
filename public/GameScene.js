export default class GameScene extends Phaser.Scene {

    HP_BAR_TAG = "hp_bar";
    mapHeight = 0;
    mapWidth = 0;
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

        // Animacje powerupów - ładowanie klatek
        // Speed powerup (powerup0) - 12 klatek
        for (let i = 1; i <= 12; i++) {
            this.load.image(`speed${i}`, `assets/animations/speed${i}.png`);
        }

        // Mikstura powerup (powerup1) - 15 klatek
        for (let i = 1; i <= 15; i++) {
            this.load.image(`mikstura${i}`, `assets/animations/mikstura${i}.png`);
        }

        // Szczupas powerup (powerup2) - 15 klatek
        for (let i = 1; i <= 15; i++) {
            this.load.image(`szczups${i}`, `assets/animations/szczups${i}.png`);
        }

        // Bomba animacja - 12 klatek  
        for (let i = 1; i <= 12; i++) {
            this.load.image(`bomba${i}`, `assets/animations/bomba${i}.png`);
        }

        // Animacje gracza - lewo/prawo
        this.load.image('standing1l', 'assets/animations/standing1l.png');
        this.load.image('standing2l', 'assets/animations/standing2l.png');
        this.load.image('standing1r', 'assets/animations/standing1r.png');
        this.load.image('standing2r', 'assets/animations/standing2r.png');
        this.load.spritesheet('bomb-explosion','assets/animations/bomb-explosion.png', {frameWidth:16, frameHeight:16});

        

        this.load.image('slow-indic', 'assets/slow_indic.png');
        this.load.image('speed-indic', 'assets/speed_indic.png');
        this.load.spritesheet('heart-idle', 'assets/animations/heart-spritesheet.png', {frameWidth:32,frameHeight:32});
        this.load.image('heart1', 'assets/animations/heart1.png');
        //breakables
        // this.load.spritesheet("breakable1x1", "assets/breakable1x1.png", {
        //     frameWidth: 64,
        //     frameHeight: 64
        // });
        // this.load.spritesheet("breakable2x1", "assets/breakable2x1.png", {
        //     frameWidth: 128,
        //     frameHeight: 64
        // });
        // sprite bomby - usunięte, używamy animacji
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
        this.isDead = false; // Flaga czy gracz już umarł

        // Tworzenie animacji powerupów i gracza
        this.createAnimations();

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

        this.socket.on('explosionDetails', (data)=>{this.animateExplosion(data);})

    }

    createAnimations() {
        // Animacja speed (powerup0) - 12 klatek
        const speedFrames = [];
        for (let i = 1; i <= 12; i++) {
            speedFrames.push({ key: `speed${i}` });
        }
        this.anims.create({
            key: 'speed-animation',
            frames: speedFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        // Animacja mikstura (powerup1) - 15 klatek
        const miksturaFrames = [];
        for (let i = 1; i <= 15; i++) {
            miksturaFrames.push({ key: `mikstura${i}` });
        }
        this.anims.create({
            key: 'mikstura-animation',
            frames: miksturaFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        // Animacja szczupas (powerup2) - 15 klatek
        const szczupsFrames = [];
        for (let i = 1; i <= 15; i++) {
            szczupsFrames.push({ key: `szczups${i}` });
        }
        this.anims.create({
            key: 'szczupas-animation',
            frames: szczupsFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        // Animacja bomby - 12 klatek
        const bombaFrames = [];
        for (let i = 1; i <= 12; i++) {
            bombaFrames.push({ key: `bomba${i}` });
        }
        this.anims.create({
            key: 'bomba-animation',
            frames: bombaFrames,
            frameRate: 20,
            repeat: -1 // zapętlenie w nieskończoność
        });

        // Animacje gracza - idąc w lewo
        this.anims.create({
            key: 'left',
            frames: [
                { key: 'standing1l' },
                { key: 'standing2l' }
            ],
            frameRate: 4,
            repeat: -1
        });

        // Animacje gracza - idąc w prawo
        this.anims.create({
            key: 'right',
            frames: [
                { key: 'standing1r' },
                { key: 'standing2r' }
            ],
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key:   'bomb-explode',
            frames: this.anims.generateFrameNumbers('bomb-explosion', {start:0, end:2}),
            frameRate:10,
            repeat:0
        });

        this.anims.create({
            key:'heart-idle', 
            frames:this.anims.generateFrameNames('heart-idle', {start:0, end:4}),
            frameRate:10,
            repeat:-1
        });
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

        //tworzenie mapArray ktory zostanie wyslany do servera
        this.mapHeight = map.height;
        console.log("Map height in tiles:", this.mapHeight);
        this.mapWidth = map.width;
        //tworzenie mapy
        const mapArray = Array.from({ length: this.mapHeight }, () =>
            Array.from({ length: this.mapWidth }, () => ({ bomb: null, powerup: false, wall: false }))
        );

        // Sprawdź każdy kafelek w wallsLayer i ustaw wall = true jeśli kafelek istnieje
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = wallsLayer.getTileAt(x, y);
                if (tile !== null) {
                    mapArray[y][x].wall = true;
                }
            }
        }
        console.log("Map:", mapArray);

        // Kolizje dla ścian
        // wallsLayer.setCollisionByProperty({ collides: true });




        //kolizje scian
        wallsLayer.setCollisionByExclusion([-1]);

        // Warstwa obiektów: Spawns
        const spawnLayer = map.getObjectLayer("spawnPoints");

        //Osobno nasz lokalny gracz a osobno reszta otrzyjmuje polozenie.
        let spawntag = this.players[this.playerId].spawn;
        //TODO: czy to jest uzywane???
        let spawnPoint = spawnLayer.objects.find(obj => obj.name === spawntag);

        this.playerGroup = this.physics.add.group()


        Object.values(this.players).forEach(ply => {

            const spawnPoint = spawnLayer.objects.find(obj => obj.name === ply.spawn);

            // Create main sprite
            const sprite = this.add.sprite(0, 0, 'standing1r');
            
            const speedIndicatorSprite = this.add.sprite(0,20, 'speed-indic');
            const slowIndicatorSprite = this.add.sprite(0,20, 'slow-indic');
            
            speedIndicatorSprite.setVisible(false);
            slowIndicatorSprite.setVisible(false);
            // Create nickname text
            const nickname = this.add.text(0, -56, ply.nick || "NICK", {
                fontSize: "16px",
                color: "#fff",
                stroke: "#000",
                strokeThickness: 3
            }).setOrigin(0.5);

            const hp_bar = this.add.text(0, -40, ply.health + " HP", {
                fontSize: "16px",
                color: "#47c070ff",
                stroke: "#000",
                strokeThickness: 4
            }).setOrigin(0.5);

            hp_bar.name = this.HP_BAR_TAG;

            // Put sprite + text into a container
            const player = this.add.container(spawnPoint.x, spawnPoint.y, [speedIndicatorSprite, slowIndicatorSprite,sprite, nickname, hp_bar ]);
            
            // Enable physics on the container
            this.physics.world.enable(player);

            // Ustaw konkretny rozmiar hitboxa gracza
            player.body.setSize(16, 16); // Hitbox 16x16 pikseli
            player.body.setOffset(-8, 10); // Wyśrodkuj hitbox

            // Add collisions
            this.physics.add.collider(player, wallsLayer);

            // Add to player group
            this.playerGroup.add(player);

            // Assign ID for later lookup
            player.name = ply.id;
            player.hp_bar = hp_bar;
            player.spriteBody = sprite;
            player.speedIndicator = speedIndicatorSprite;
            player.slowIndicator = slowIndicatorSprite;
            if (ply.id == this.playerId) {
                this.player = player;
            }

            player.spriteBody.play(ply.currentDirection, true);
        });

        // aktualnie nieużywane
        // spawning breakable walls
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

        this.socket.emit('mapCreated', { mapArray: mapArray });
    }

    //NETWORK:

    //proceeds powerup spawn (received from server)
    spawnPowerup(data) {
        console.log("Received spawnPowerup event:", data);
        const { x, y, type } = data;

        // Mapowanie typów powerupów na animacje
        const animationKeys = {
            0: 'speed-animation',
            1: 'mikstura-animation',
            2: 'szczupas-animation',
            3: 'heart-idle'
        };

        // Mapowanie typów na pierwszy frame (do wyświetlenia przed animacją)
        const firstFrameKeys = {
            0: 'speed1',
            1: 'mikstura1',
            2: 'szczups1',
            3: 'heart1'
        };

        const animationKey = animationKeys[type];
        const firstFrameKey = firstFrameKeys[type];

        if (!animationKey || !firstFrameKey) {
            console.error("Nieznany typ powerupa:", type);
            return;
        }

        // Stwórz sprite z pierwszą klatką
        const powerup = this.physics.add.sprite(x * 64 + 32, y * 64 + 32, firstFrameKey);
        powerup.setData("x", x);
        powerup.setData("y", y);
        powerup.setData("type", type);
        this.powerups.add(powerup);

        // Odtwórz animację
        powerup.play(animationKey);

        //zebranie powerupa
        this.physics.add.overlap(this.player, powerup, (player, powerup) => {
            this.socket.emit('pickedPowerup', { id: this.playerId, x: powerup.getData('x'), y: powerup.getData('y'), type: powerup.getData('type') });
            // powerup.destroy(); // usuń powerupa z mapy
            const offsetX = Phaser.Math.Between(-20, 20);

            switch(type){
                case 0:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "Speed Effect", "#fbf236");
                    break;
                case 1:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "Slow Effect", "#639bff");
                    break;
                case 2:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "+3 Bombs", "#d77bba");
                    break;
                case 3:
                    this.showFloatingText(this.player.x + offsetX, this.player.y - 20, "+1 Health", "#6abe30");
                    break;
            }
            
        });
    }

    //destroys powerup (data from server)
    destroyPowerup(data) {
        const { x, y } = data;
        const powerup = this.powerups.getChildren().find(p => p.getData('x') === x && p.getData('y') === y);
        if (powerup) {
            // Zatrzymaj animację przed usunięciem
            powerup.stop();
            powerup.destroy();
        }
    }


    //proceeds update from the server.
    updatePlayers(players) {



        Object.values(players).forEach(ply => {

            const playerContainer = this.playerGroup.getChildren().find(x => x.name == ply.id);

            if (playerContainer && (ply.x != null) && (ply.y != null)) {
                // console.log(players)

                const direction = ply.currentDirection || "right"; // domyślnie w prawo
                if (direction === "left") {
                    playerContainer.spriteBody.play('left', true);
                } else if (direction === "right") {
                    playerContainer.spriteBody.play('right', true);
                }
                //  else if (direction === "up") {
                //     playerContainer.spriteBody.setFlipX(false);
                // } else if (direction === "down") {
                //     playerContainer.spriteBody.setFlipX(false);
                // }
                const hasSpeedEffect = ply.speedEffectStamp >= Date.now();
                const hasSlowEffect = ply.slowEffectStamp >= Date.now();
                //jesli to jest nasz gracz
                if (ply.id == this.playerId) {

                    // Domyślna prędkość
                    // this.speed = 300;
                    if (hasSpeedEffect) {
                        this.speed = 200; // Powerup SPEED
                    }
                    else if(hasSlowEffect){
                        this.speed = 75; //powerup slow
                    }
                    else {
                        this.speed = 150; // Brak powerupu SPEED
                    }

                    //gracz ma 0hp
                    if (ply.health <= 0) {
                        this.isDead = true; // Ustaw flagę że gracz umarł
                        this.showDeathOverlay();
                        // this.player.setTint(0xff0000); // na czerwono
                        playerContainer.setVisible(false);
                        playerContainer.setActive(false); // usuń gracza z gry
                        // Możesz też dodać tutaj jakieś powiadomienie o przegranej lub przycisk restartu
                    }
                }
                else {

                    playerContainer.setPosition(ply.x, ply.y);
               

                    //gracz ma 0hp
                    if (ply.health <= 0) {
                        // this.player.setTint(0xff0000); // na czerwono
                        playerContainer.setVisible(false); // ukryj gracza
                        playerContainer.setActive(false); // wyłącz gracza
                        // Możesz też dodać tutaj jakieś powiadomienie o przegranej lub przycisk restartu
                    }
                }

                playerContainer.hp_bar.setText(ply.health + " HP");
                playerContainer.slowIndicator.setVisible(hasSlowEffect);
                playerContainer.speedIndicator.setVisible(hasSpeedEffect);
            }


        });
    }



    sendUpdate(direction) {
        this.socket.emit('moved', { id: this.playerId, x: this.player.x, y: this.player.y, direction: direction })
    }

    newBomb(bomb) {
        // Stwórz sprite bomby z pierwszą klatką animacji
        const bombSprite = this.physics.add.sprite(bomb.x + 32, bomb.y + 32, "bomba1");
        this.bombGroup.add(bombSprite);

        // Odtwórz animację bomby
        bombSprite.play('bomba-animation');

        setTimeout(() => {
            // Zatrzymaj animację przed usunięciem
            bombSprite.stop();
            bombSprite.destroy();
        }, bomb.timeout);
    }



    plantBomb() {
        this.socket.emit('plantBomb', { id: this.playerId, x: this.player.x, y: this.player.y });
    }

    update() {
        let direction = null;
        // Jeśli gracz nie żyje, nie pozwól mu się ruszać
        if (this.isDead) return;

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


        this.player.body.setVelocity(0, 0);

        // Użyj ostatniego klawisza ze stosu (najnowszy wciśnięty)
        const currentKey = this.keyStack[this.keyStack.length - 1];

        if (currentKey === 'left') {
            this.player.body.setVelocityX(-this.speed);
            direction = 'left';
        } else if (currentKey === 'right') {
            this.player.body.setVelocityX(this.speed);
            direction = 'right';
        } else if (currentKey === 'up') {
            this.player.body.setVelocityY(-this.speed);
            direction = 'up';
        } else if (currentKey === 'down') {
            this.player.body.setVelocityY(this.speed);
            direction = 'down';
        }

        if (this.player.body.velocity.length() > 0) {
            this.sendUpdate(direction);
        }

        if (cursors.space.isDown) {
            this.plantBomb();
        }
    }

    animateExplosion(area){
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if(area[y][x]){
                    const effect= this.add.sprite(y * 64 +32, x*64 + 32, 'bomb-explosion');
                    
                    effect.play('bomb-explode');
                    effect.on('animationcomplete', () => {
                        effect.destroy();
                    });

                }      
            }
            
        }
    }

    showDeathOverlay() {
        // Sprawdź czy overlay już istnieje
        if (this.deathOverlay) return;

        // Szary filtr na całym ekranie
        this.deathOverlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.6
        );
        this.deathOverlay.setScrollFactor(0); // Nie podąża za kamerą
        this.deathOverlay.setDepth(1000); // Na wierzchu

        // Panel z informacjami
        const panelWidth = 400;
        const panelHeight = 300;
        const panel = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            panelWidth,
            panelHeight,
            0x222222,
            0.9
        );
        panel.setScrollFactor(0);
        panel.setDepth(1001);
        panel.setStrokeStyle(4, 0xff0000);

        // Tytuł
        const title = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            "PRZEGRAŁEŚ!",
            {
                fontSize: "32px",
                color: "#ff0000",
                fontStyle: "bold",
                stroke: "#000",
                strokeThickness: 3
            }
        );
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(1002);

        // Informacje o grze
        const gameInfo = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 40,
            "Możesz dalej obserwować rozgrywkę\n\nStatystyki:\n• Zgony: 1\n• Czas gry: " + Math.floor(this.time.now / 1000) + "s",
            {
                fontSize: "16px",
                color: "#ffffff",
                align: "center",
                stroke: "#000",
                strokeThickness: 2
            }
        );
        gameInfo.setOrigin(0.5);
        gameInfo.setScrollFactor(0);
        gameInfo.setDepth(1002);

        // Instrukcja
        const instruction = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 80,
            "Obserwuj pozostałych graczy\naby zobaczyć kto wygra!",
            {
                fontSize: "14px",
                color: "#cccccc",
                align: "center",
                fontStyle: "italic"
            }
        );
        instruction.setOrigin(0.5);
        instruction.setScrollFactor(0);
        instruction.setDepth(1002);

        // Przechowaj referencje do elementów overlay
        this.deathOverlayElements = [this.deathOverlay, panel, title, gameInfo, instruction];
    }
    

    // Funkcja pomocnicza do efektu "floating text"
 showFloatingText(x, y, text, color = "#fff") {
    const floatingText = this.add.text(x, y, text, {
        fontSize: "16px",
        color: color,
        stroke: "#000",
        strokeThickness: 3
    }).setOrigin(0.5);

    // Animacja: przesunięcie w górę + fade out
    this.tweens.add({
        targets: floatingText,
        y: y - 40,        // przesuń w górę
        alpha: 0,         // znikanie
        duration: 1500,   // czas w ms
        ease: "Cubic.easeOut",
        onComplete: () => {
            floatingText.destroy(); // usuń po animacji
        }
    });
}



}

