import LobbyScene from "./LobbyScene.js";
import GameScene from "./GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: [LobbyScene, GameScene]
};

new Phaser.Game(config);