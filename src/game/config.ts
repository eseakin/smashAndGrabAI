import type { Types } from "phaser";
import { MainScene } from "./MainScene";
import { TypingScene } from "./TypingScene";

export const GAME_CONFIG: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  scene: [MainScene, TypingScene],
};

// Game constants
export const GAME_CONSTANTS = {
  PLAYER: {
    SPEED: 200,
    BOOST_MULTIPLIER: 1.5,
    BOOST_DURATION: 1500, // ms
    LIVES_PER_ROUND: 3,
  },
  DROPPER: {
    MIN_SPEED: 100,
    MAX_SPEED: 300,
    DROP_INTERVAL: {
      MIN: 1000,
      MAX: 3000,
    },
  },
  ITEMS: {
    DROP_SPEED: {
      MIN: 200,
      MAX: 400,
    },
    MAX_HARMFUL_PER_ROUND: 5,
    MAX_DROP_SPEED: 400,
  },
  ROUND: {
    BASE_ITEMS: 5,
    ITEMS_PER_CORRECT_SENTENCE: 2,
  },
};
