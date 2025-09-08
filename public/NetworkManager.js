;
import GameScene from './GameScene.js';
export default class NetworkManager {
  constructor(scene) {
    this.scene = scene;
  }

  //proceeds powerup spawn (received from server)
    spawnPowerup(data) {
        
        const { x, y, type } = data;

        // Mapowanie typów powerupów na animacje
        const animationKeys = {
            0: 'speed-animation',
            1: 'mikstura-animation',
            2: 'szczupas-animation'
        };

        // Mapowanie typów na pierwszy frame (do wyświetlenia przed animacją)
        const firstFrameKeys = {
            0: 'speed1',
            1: 'mikstura1',
            2: 'szczups1'
        };

        const animationKey = animationKeys[type];
        const firstFrameKey = firstFrameKeys[type];

        if (!animationKey || !firstFrameKey) {
            console.error("Nieznany typ powerupa:", type);
            return;
        }

        // Stwórz sprite z pierwszą klatką
        const powerup = scene.physics.add.sprite(x * this.scene.GRID_SIZE + 32, y * 64 + 32, firstFrameKey);
        powerup.setData("x", x);
        powerup.setData("y", y);
        powerup.setData("type", type);
        scene.powerups.add(powerup);

        // Odtwórz animację
        powerup.play(animationKey);

        //zebranie powerupa
        this.scene.physics.add.overlap(scene.player, powerup, (player, powerup) => {
            this.scene.socket.emit('pickedPowerup', { id: scene.playerId, x: powerup.getData('x'), y: powerup.getData('y'), type: powerup.getData('type') });
            // powerup.destroy(); // usuń powerupa z mapy
        });
    }

    //destroys powerup (data from server)
    destroyPowerup(data) {
        const { x, y } = data;
        const powerup = this.scene.powerups.getChildren().find(p => p.getData('x') === x && p.getData('y') === y);
        if (powerup) {
            // Zatrzymaj animację przed usunięciem
            powerup.stop();
            powerup.destroy();
        }
    }


    //proceeds update from the server.
    updatePlayers(players) {



        Object.values(players).forEach(ply => {

            const playerContainer = this.scene.playerGroup.getChildren().find(x => x.name == ply.id);

            if (playerContainer && (ply.x != null) && (ply.y != null)) {

                playerContainer.hp_bar.setText(ply.health + "HP");

                const direction = ply.currentDirection || "right"; // domyślnie w prawo
                if (direction === "left") {
                    playerContainer.spriteBody.play('left', true);
                } else if (direction === "right") {
                    playerContainer.spriteBody.play('right', true);
                }

                //jesli to jest nasz gracz
                if (ply.id == this.scene.playerId) {

                    // Domyślna prędkość
                    // this.speed = 300;
                    if (ply.powerups[0]) {
                        this.scene.speed = 300; // Powerup SPEED
                    }
                    else if(ply.powerups[1]){
                        console.log("SPOWOLNIENIE");
                        this.scene.speed = 100; //powerup slow
                    }
                    else {
                        this.scene.speed = 150; // Brak powerupu SPEED
                    }

                    
                    if (ply.health <= 0) {
                        this.scene.isDead = true; // Ustaw flagę że gracz umarł
                        this.scene.showDeathOverlay();
                     
                        playerContainer.setVisible(false);
                        playerContainer.setActive(false); // usuń gracza z gry
                        // Możesz też dodać tutaj jakieś powiadomienie o przegranej lub przycisk restartu


                    }
                }
                else {

                    playerContainer.setPosition(ply.x, ply.y);
                    if (ply.health <= 0) {
                      
                        playerContainer.setVisible(false); 
                        playerContainer.setActive(false); 
                        
                    }
                }

             

            }


        });
    }


    //Is called when player changes position.
    sendUpdate(direction) {
        this.scene.socket.emit('moved', { id: this.playerId, x: this.player.x, y: this.player.y, direction: direction })
    }

    //Is called when new bomb has been placed somewhere on the map.
    newBomb(bomb) {
        const bombSprite = this.scene.physics.add.sprite(bomb.x + 32, bomb.y + 32, "bomba1");
        this.scene.bombGroup.add(bombSprite);

        bombSprite.play('bomba-animation');

        setTimeout(() => {
            bombSprite.stop();
            bombSprite.destroy();
        }, bomb.timeout);
    }

    //Is called when we want to plant
    plantBomb() {
        this.scene.socket.emit('plantBomb', { id: this.playerId, x: this.player.x, y: this.player.y });
    }

}