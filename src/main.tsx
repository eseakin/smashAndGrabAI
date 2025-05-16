import { GAME_CONFIG } from "./game/config";

// Mount Phaser game
import("phaser").then(({ default: Phaser }) => {
  new Phaser.Game(GAME_CONFIG);
});
