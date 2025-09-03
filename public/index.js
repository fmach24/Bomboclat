import LobbyScene from "./LobbyScene.js";
import GameScene from "./GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 500,
  height: 500,
  parent: "game-container", // <-- to jest kluczowe!
  dom: { createContainer: true }, // <-- DODAJ TO!
  physics: {
    default: "arcade",
    arcade: { debug: true }
  },
  // scene: {
  //   preload,
  //   create,
  //   update
  // }
  scene: [LobbyScene, GameScene]
};

new Phaser.Game(config);