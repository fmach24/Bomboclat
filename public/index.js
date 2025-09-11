import LobbyScene from "./LobbyScene.js";
import GameScene from "./GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 832,
  height: 600,
  backgroundColor: '#0b0b0b',
  // color: '#0b0b0b', 
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