import Phaser from "phaser";

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;
const GROUND_HEIGHT = 20;
const TOP_PLATFORM_HEIGHT = 20;
const PLATFORM_WIDTH = 800;
const PLAYER_COLOR = 0x1976d2;
const PLAYER_SPEED = 200;
const PLAYER_BOOST_MULTIPLIER = 1.5;
const PLAYER_BOOST_DURATION = 1500; // ms
const DROPPER_WIDTH = 40;
const DROPPER_HEIGHT = 40;
const DROPPER_MIN_SPEED = 100;
const DROPPER_MAX_SPEED = 300;
const ITEM_WIDTH = 20;
const ITEM_HEIGHT = 20;
const BASE_DROP_INTERVAL = 2000; // ms
const LIVES_PER_ROUND = 3;
const ROUND_DURATION = 60000; // 60 seconds per round
const PLAYER_HITBOX_HEIGHT = 80;
const PLAYER_HITBOX_OFFSET_X = -10;
const PLAYER_JUMP_HITBOX_HEIGHT = 130; // 80 + 50

// Item types
const ITEM_TYPES = {
  REQUIRED: { color: 0x00ff00, points: 10 },
  BONUS: { color: 0xff00ff, points: 20 },
  HARMFUL: { color: 0x000000, points: -5 },
};

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private dropper!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private boostKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private isBoosting = false;
  private boostTimer = 0;
  private dropperSpeed = 0;
  private dropTimer = 0;
  private ground!: Phaser.GameObjects.Rectangle;
  private topPlatform!: Phaser.GameObjects.Rectangle;
  private leftWall!: Phaser.GameObjects.Rectangle;
  private rightWall!: Phaser.GameObjects.Rectangle;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private lives = LIVES_PER_ROUND;
  private livesTexts: Phaser.GameObjects.Text[] = [];
  private round = 1;
  private roundText!: Phaser.GameObjects.Text;
  private roundTimer = 0;
  private roundTimerText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private gameOverText!: Phaser.GameObjects.Text;
  private earnedItems: Phaser.Physics.Arcade.Sprite[] = [];
  private itemsLeftText!: Phaser.GameObjects.Text;
  private maxRounds = 2;
  private countdown = 0;
  private countdownText!: Phaser.GameObjects.Text;
  private countdownActive = false;
  private itemsToDrop: number = 0;
  private itemsDropped: number = 0;
  private itemsCaughtOrMissed: number = 0;
  private trailTimer = 0;
  private bg3!: Phaser.GameObjects.TileSprite;
  private bg2!: Phaser.GameObjects.TileSprite;
  private bg1!: Phaser.GameObjects.TileSprite;
  private isThrowing = false;
  private dropperPrevVelocityX = 0;
  private isStunned = false;
  private stunTimer = 0;
  private readonly STUN_DURATION = 1000; // 1 second stun

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // Background layers
    this.load.image("bg-layer1", "images/bg/MathWizBG/Layer1.png");
    this.load.image("bg-layer2", "images/bg/MathWizBG/Layer2.png");
    this.load.image("bg-layer3", "images/bg/MathWizBG/Layer3.png");

    // Explosion frames
    for (let i = 1; i <= 7; i++) {
      this.load.image(
        `explosion-${i}`,
        `images/Effects/Explosions/EXPLOSIONS${i}.png`
      );
    }

    // Coin frames
    this.load.image("coin-0", "images/Effects/Coin/Coin_0000000.png");
    this.load.image("coin-1", "images/Effects/Coin/Coin_0000001.png");
    this.load.image("coin-2", "images/Effects/Coin/Coin_0000002.png");
    this.load.image("coin-3", "images/Effects/Coin/Coin_0000003.png");

    // Gem sprites
    this.load.image("gem-1", "images/Effects/BulletsEtc/Gem-1.png");
    this.load.image("gem-2", "images/Effects/BulletsEtc/Gem-2.png");
    this.load.image("gem-3", "images/Effects/BulletsEtc/Gem-3.png");

    // Bullet sprite for harmful items
    this.load.image("bullet-1", "images/Effects/BulletsEtc/Bullet-1.png");
    this.load.image("bullet-2", "images/Effects/BulletsEtc/Bullet-2.png");
    this.load.image("bullet-3", "images/Effects/BulletsEtc/Bullet-3.png");

    // Spell effect sprite sheet
    this.load.spritesheet("spell-hit", "images/Effects/Spells/3.png", {
      frameWidth: 256,
      frameHeight: 256,
    });

    // Wizard sprites
    // Idle animation
    for (let i = 1; i <= 8; i++) {
      this.load.image(
        `wizard-rest-${i - 1}`,
        `images/Wizard/Wizard character sprites/RESIZE/Idle (${i}).png`
      );
    }
    // Hurt animation
    this.load.image(
      "wizard-hurt-0",
      "images/Wizard/Wizard character sprites/RESIZE/Hurt.png"
    );
    // Run animation
    for (let i = 1; i <= 6; i++) {
      this.load.image(
        `wizard-walk-${i - 1}`,
        `images/Wizard/Wizard character sprites/RESIZE/Run (${i}).png`
      );
    }
    // Jump animation
    this.load.image(
      "wizard-jump-0",
      "images/Wizard/Wizard character sprites/RESIZE/Jump.png"
    );
    // Die animation
    for (let i = 1; i <= 7; i++) {
      this.load.image(
        `wizard-die-${i - 1}`,
        `images/Wizard/Wizard character sprites/RESIZE/Die (${i}).png`
      );
    }
    // Dizzy animation
    for (let i = 1; i <= 3; i++) {
      this.load.image(
        `wizard-dizzy-${i - 1}`,
        `images/Wizard/Wizard character sprites/RESIZE/Dizzy (${i}).png`
      );
    }

    // Golem sprite sheets
    this.load.spritesheet(
      "golem-walk",
      "images/Golem/brown-golem-walk-sm.png",
      {
        frameWidth: 375,
        frameHeight: 375,
      }
    );
    this.load.spritesheet(
      "golem-rest",
      "images/Golem/brown-golem-rest-sm.png",
      {
        frameWidth: 375,
        frameHeight: 375,
      }
    );
    this.load.spritesheet(
      "golem-attack",
      "images/Golem/brown-golem-attack-sm.png",
      {
        frameWidth: 375,
        frameHeight: 375,
      }
    );
    // Add more golem animations as needed

    // Create a blank texture for our sprites
    this.textures.generate("blank", {
      data: ["1"],
      pixelWidth: 1,
      pixelHeight: 1,
    });
  }

  create() {
    // Explosion animation
    this.anims.create({
      key: "explosion",
      frames: Array.from({ length: 7 }, (_, i) => ({
        key: `explosion-${i + 1}`,
      })),
      frameRate: 7.5, // Halved from 15
      repeat: 0,
    });

    // Coin animation
    this.anims.create({
      key: "coin-spin",
      frames: [
        { key: "coin-0" },
        { key: "coin-1" },
        { key: "coin-2" },
        { key: "coin-3" },
      ],
      frameRate: 8,
      repeat: -1,
    });

    // Gem animation with smooth transitions
    this.anims.create({
      key: "gem-sparkle",
      frames: [
        { key: "gem-1" },
        { key: "gem-2" },
        { key: "gem-3" },
        { key: "gem-2" },
        { key: "gem-1" },
      ],
      frameRate: 12,
      repeat: -1,
    });

    // Spell hit animation
    this.anims.create({
      key: "spell-hit",
      frames: this.anims.generateFrameNumbers("spell-hit", {
        start: 0,
        end: 39, // 8x5 = 40 frames
      }),
      frameRate: 60, // Doubled from 30
      repeat: 0,
    });

    // Bullet animation
    this.anims.create({
      key: "bullet-spin",
      frames: [
        { key: "bullet-1" },
        { key: "bullet-2" },
        { key: "bullet-3" },
        { key: "bullet-2" },
        { key: "bullet-1" },
      ],
      frameRate: 12,
      repeat: -1,
    });

    // Parallax backgrounds
    const fgImage = this.textures.get("bg-layer1").getSourceImage();
    const fgHeight = fgImage.height;
    this.bg3 = this.add
      .tileSprite(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        "bg-layer3"
      )
      .setOrigin(0.5)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScale(1.05);
    this.bg2 = this.add
      .tileSprite(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        "bg-layer2"
      )
      .setOrigin(0.5)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScale(1.05);
    // Foreground only at the bottom
    this.bg1 = this.add
      .tileSprite(
        GAME_WIDTH / 2,
        GAME_HEIGHT,
        GAME_WIDTH,
        fgHeight,
        "bg-layer1"
      )
      .setOrigin(0.5, 1)
      .setDisplaySize(GAME_WIDTH, fgHeight)
      .setScale(1.05);

    // Background color
    this.cameras.main.setBackgroundColor(0xa0d8ef);

    // Ground platform (player area)
    this.ground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - GROUND_HEIGHT / 2 + 20,
      GAME_WIDTH + 40,
      GROUND_HEIGHT + 40,
      0x4e342e
    );
    this.physics.add.existing(this.ground, true);

    // Add detailed decorative elements to ground
    // Moss (downward triangles)
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = GAME_HEIGHT - GROUND_HEIGHT + 5;
      const size = Phaser.Math.Between(3, 6);
      const moss = this.add
        .triangle(x, y, 0, 0, size, 0, size / 2, size, 0x2d572c)
        .setDepth(1);
      moss.setAlpha(Phaser.Math.FloatBetween(0.4, 0.8));
    }

    // Small stones (circles)
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = GAME_HEIGHT - GROUND_HEIGHT + 5;
      const size = Phaser.Math.Between(2, 4);
      const stone = this.add.circle(x, y, size, 0x3e2723).setDepth(1);
      stone.setAlpha(Phaser.Math.FloatBetween(0.6, 1));
    }

    // Grass tufts (upward triangles)
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = GAME_HEIGHT - GROUND_HEIGHT + 8;
      const size = Phaser.Math.Between(3, 5);
      const grass = this.add
        .triangle(x, y, 0, size, size, size, size / 2, 0, 0x2d572c)
        .setDepth(1);
      grass.setAlpha(Phaser.Math.FloatBetween(0.7, 1));
    }

    // Cracks (thin lines)
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = GAME_HEIGHT - GROUND_HEIGHT + 5;
      const length = Phaser.Math.Between(4, 8);
      const angle = Phaser.Math.Between(0, 180);
      const crack = this.add.line(x, y, 0, 0, length, 0, 0x2c1810).setDepth(1);
      crack.setRotation(Phaser.Math.DegToRad(angle));
      crack.setLineWidth(1);
    }

    // Top platform (dropper area)
    this.topPlatform = this.add.rectangle(
      GAME_WIDTH / 2,
      TOP_PLATFORM_HEIGHT / 2 + 150,
      PLATFORM_WIDTH,
      TOP_PLATFORM_HEIGHT,
      0x6d4c41
    );
    this.physics.add.existing(this.topPlatform, true);

    // Add detailed decorative elements to top platform
    // Moss (downward triangles)
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(
        (GAME_WIDTH - PLATFORM_WIDTH) / 2 + 20,
        (GAME_WIDTH + PLATFORM_WIDTH) / 2 - 20
      );
      const y = TOP_PLATFORM_HEIGHT / 2 + 150 + TOP_PLATFORM_HEIGHT / 2 + 5;
      const size = Phaser.Math.Between(3, 6);
      const moss = this.add
        .triangle(x, y, 0, 0, size, 0, size / 2, size, 0x2d572c)
        .setDepth(1);
      moss.setAlpha(Phaser.Math.FloatBetween(0.4, 0.8));
    }

    // Small stones (circles)
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(
        (GAME_WIDTH - PLATFORM_WIDTH) / 2 + 20,
        (GAME_WIDTH + PLATFORM_WIDTH) / 2 - 20
      );
      const y = TOP_PLATFORM_HEIGHT / 2 + 150 + TOP_PLATFORM_HEIGHT / 2 + 5;
      const size = Phaser.Math.Between(2, 4);
      const stone = this.add.circle(x, y, size, 0x3e2723).setDepth(1);
      stone.setAlpha(Phaser.Math.FloatBetween(0.6, 1));
    }

    // Grass tufts (upward triangles)
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(
        (GAME_WIDTH - PLATFORM_WIDTH) / 2 + 20,
        (GAME_WIDTH + PLATFORM_WIDTH) / 2 - 20
      );
      const y = TOP_PLATFORM_HEIGHT / 2 + 150 + TOP_PLATFORM_HEIGHT / 2 + 8;
      const size = Phaser.Math.Between(3, 5);
      const grass = this.add
        .triangle(x, y, 0, size, size, size, size / 2, 0, 0x2d572c)
        .setDepth(1);
      grass.setAlpha(Phaser.Math.FloatBetween(0.7, 1));
    }

    // Cracks (thin lines)
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(
        (GAME_WIDTH - PLATFORM_WIDTH) / 2 + 20,
        (GAME_WIDTH + PLATFORM_WIDTH) / 2 - 20
      );
      const y = TOP_PLATFORM_HEIGHT / 2 + 150 + TOP_PLATFORM_HEIGHT / 2 + 5;
      const length = Phaser.Math.Between(4, 8);
      const angle = Phaser.Math.Between(0, 180);
      const crack = this.add.line(x, y, 0, 0, length, 0, 0x2c1810).setDepth(1);
      crack.setRotation(Phaser.Math.DegToRad(angle));
      crack.setLineWidth(1);
    }

    // Left boundary
    this.leftWall = this.add.rectangle(
      0,
      GAME_HEIGHT / 2,
      10,
      GAME_HEIGHT,
      0x333333
    );
    this.physics.add.existing(this.leftWall, true);

    // Right boundary
    this.rightWall = this.add.rectangle(
      GAME_WIDTH,
      GAME_HEIGHT / 2,
      10,
      GAME_HEIGHT,
      0x333333
    );
    this.physics.add.existing(this.rightWall, true);

    // Player (wizard)
    this.anims.create({
      key: "wizard-rest",
      frames: Array.from({ length: 8 }, (_, i) => ({
        key: `wizard-rest-${i}`,
      })),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "wizard-hurt",
      frames: [{ key: "wizard-hurt-0" }],
      frameRate: 12,
      repeat: 0,
    });
    this.anims.create({
      key: "wizard-walk",
      frames: Array.from({ length: 6 }, (_, i) => ({
        key: `wizard-walk-${i}`,
      })),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "wizard-jump",
      frames: [{ key: "wizard-jump-0" }],
      frameRate: 12,
      repeat: 0,
    });
    this.anims.create({
      key: "wizard-die",
      frames: Array.from({ length: 7 }, (_, i) => ({ key: `wizard-die-${i}` })),
      frameRate: 12,
      repeat: 0,
      hideOnComplete: false, // Keep the last frame visible
    });
    this.anims.create({
      key: "wizard-dizzy",
      frames: Array.from({ length: 3 }, (_, i) => ({
        key: `wizard-dizzy-${i}`,
      })),
      frameRate: 8,
      repeat: -1,
    });
    // Calculate y so bottom of hitbox is at ground, then raise by 15px
    const playerDisplayHeight = 120; // Match the new sprite height
    const playerDisplayWidth = 150; // Match the new sprite width
    const playerHitboxHeight = 100; // Slightly smaller than display height
    const playerY = GAME_HEIGHT - GROUND_HEIGHT - playerHitboxHeight / 2 - 20; // Add 20px offset to raise the player
    this.player = this.physics.add.sprite(
      GAME_WIDTH / 2,
      playerY,
      "wizard-rest-0" // Use the first frame of the idle animation
    );
    this.player.displayWidth = playerDisplayWidth;
    this.player.displayHeight = playerDisplayHeight;
    this.player.setOrigin(0.5, 0.5); // Reset to default center origin
    this.player.setCollideWorldBounds(true);
    this.player.play("wizard-rest");

    if (this.player.body) {
      const offsetX = this.player.flipX
        ? -PLAYER_HITBOX_OFFSET_X
        : PLAYER_HITBOX_OFFSET_X;
      this.player.body.setSize(100, 100); // Slightly smaller than display size for better feel
      this.player.body.setOffset(25, 20); // Center the hitbox in the sprite
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.setGravityY(500);
      playerBody.setBounce(0.2);
      playerBody.setCollideWorldBounds(true);
    }

    // Dropper (golem)
    this.anims.create({
      key: "golem-rest",
      frames: this.anims.generateFrameNumbers("golem-rest", {
        start: 0,
        end: 11,
      }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: "golem-walk",
      frames: this.anims.generateFrameNumbers("golem-walk", {
        start: 0,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "golem-throw",
      frames: this.anims.generateFrameNumbers("golem-attack", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: 0,
    });
    // Place golem on top platform, shrink to fit
    const platformTopY = this.topPlatform.y - this.topPlatform.height / 2;
    this.dropper = this.physics.add.sprite(
      GAME_WIDTH / 2,
      platformTopY - 100,
      "golem-rest"
    );
    this.dropper.setOrigin(0.5, 0.5); // bottom center
    this.dropper.displayWidth = 150;
    this.dropper.displayHeight = 150;
    this.dropper.setCollideWorldBounds(true);
    this.dropper.play("golem-rest");
    // Set golem body size to match display size and align with origin
    if (this.dropper.body) {
      const dropperBody = this.dropper.body as Phaser.Physics.Arcade.Body;
      dropperBody.setSize(150, 150); // Match display size
      dropperBody.setOffset(0, -25); // No offset needed with bottom center origin
      dropperBody.setGravityY(0); // Ensure no gravity
      dropperBody.setImmovable(true); // Make it immovable
      dropperBody.setBounce(0); // Prevent bouncing
      dropperBody.setCollideWorldBounds(true); // Ensure world bounds collision
      dropperBody.setAllowGravity(false); // Explicitly disable gravity
      dropperBody.setVelocityY(0); // Ensure no vertical velocity
    }

    // Collisions
    this.physics.add.collider(this.player, this.ground, () => {
      // Optional: Add any ground collision effects here
    });
    this.physics.add.collider(this.player, this.leftWall);
    this.physics.add.collider(this.player, this.rightWall);
    this.physics.add.collider(this.dropper, this.topPlatform);
    this.physics.add.collider(this.dropper, this.leftWall);
    this.physics.add.collider(this.dropper, this.rightWall);

    // Input
    this.cursors = this.input!.keyboard!.createCursorKeys();
    this.boostKey = this.input!.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.jumpKey = this.input!.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.W
    );

    // Initialize dropper speed
    this.dropperSpeed = Phaser.Math.Between(
      DROPPER_MIN_SPEED,
      DROPPER_MAX_SPEED
    );

    // UI Elements
    const scoreboardY = 16;
    const spacing = 140;
    this.scoreText = this.add
      .text(
        32, // Left side
        GAME_HEIGHT - 32, // Bottom
        "Score: 0",
        {
          fontSize: "30px",
          color: "#fff",
          fontFamily: "monospace",
        }
      )
      .setOrigin(0, 1) // Set origin to bottom left
      .setDepth(0); // UI at bottom layer

    // Create hearts with 5px spacing
    const heartSize = 30;
    const heartSpacing = 5;
    const startX = GAME_WIDTH - 32; // Back to right side
    const startY = GAME_HEIGHT - 32;

    for (let i = 0; i < this.lives; i++) {
      const heart = this.add
        .text(
          startX - i * (heartSize + heartSpacing), // Move left for each heart
          startY,
          "❤️",
          {
            fontSize: "30px",
            fontFamily: "monospace",
          }
        )
        .setOrigin(1, 1) // Set origin to bottom right
        .setDepth(0); // UI at bottom layer
      this.livesTexts.push(heart);
    }

    // Set player depth
    this.player.setDepth(100);

    // Set dropper depth
    this.dropper.setDepth(100);

    this.gameOverText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        fontSize: "64px",
        color: "#ffd700", // Gold color
        fontFamily: "Georgia, serif",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 8,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000",
          blur: 5,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(300); // Above everything

    // Add a fantasy panel behind the text
    const gameOverPanel = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        600,
        200,
        0x4a2f1b // Dark brown
      )
      .setStrokeStyle(4, 0xffd700) // Gold border
      .setDepth(299) // Just below the text
      .setVisible(false)
      .setName("gameOverPanel");

    this.countdownText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        fontSize: "96px",
        color: "#fff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.startCountdown();
  }

  private startCountdown() {
    this.countdown = 3;
    this.countdownActive = true;
    if (this.countdownText) {
      this.countdownText.setText(this.countdown.toString());
      this.countdownText.setVisible(true);
    }
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdown--;
        if (this.countdownText) {
          if (this.countdown > 0) {
            this.countdownText.setText(this.countdown.toString());
          } else {
            this.countdownText.setText("GO!");
            this.time.delayedCall(700, () => {
              if (this.countdownText) {
                this.countdownText.setVisible(false);
              }
              this.countdownActive = false;
            });
          }
        }
      },
    });
  }

  private startNewRound() {
    this.round++;
    if (
      this.round > this.maxRounds ||
      this.itemsCaughtOrMissed >= this.itemsToDrop
    ) {
      this.gameOver = true;
      this.gameOverText.setText("Victory!\nFinal Score: " + this.score);
      this.gameOverText.setVisible(true);
      // Show the panel
      const panel = this.children.getByName(
        "gameOverPanel"
      ) as Phaser.GameObjects.Rectangle;
      if (panel) {
        panel.setVisible(true);
      }
      // Start continuous throwing for victory
      if (this.dropper.body) {
        this.dropper.setVelocityX(0);
        this.continuousThrow();
      }
      return;
    }
    this.lives = LIVES_PER_ROUND;
    this.roundTimer = 0;
    this.updateLivesText();
    this.gameOver = false;
    this.gameOverText.setVisible(false);
  }

  private gameOverHandler() {
    this.gameOver = true;
    // Play dizzy animation and keep it playing
    this.player.anims.play("wizard-dizzy", true);
    this.gameOverText.setText("Game Over!\nFinal Score: " + this.score);
    this.gameOverText.setVisible(true);
    // Show the panel
    const panel = this.children.getByName(
      "gameOverPanel"
    ) as Phaser.GameObjects.Rectangle;
    if (panel) {
      panel.setVisible(true);
    }

    // Stop golem movement and make it stay in place
    if (this.dropper.body) {
      this.dropper.setVelocityX(0);
      // Start continuous throwing animation
      this.continuousThrow();
    }
  }

  private continuousThrow() {
    if (!this.gameOver) return;

    // Play throw animation at 3x speed
    this.dropper.anims.play("golem-throw", true);
    this.dropper.anims.timeScale = 3; // 3x faster animation

    this.dropper.once("animationcomplete-golem-throw", () => {
      if (!this.gameOverText.text.includes("Victory")) {
        // Only spawn bullets during game over
        for (let i = 0; i < 3; i++) {
          // Create 3 items per throw
          const randomX = Phaser.Math.Between(50, GAME_WIDTH - 50);
          const spawnY = this.topPlatform.y + 50; // Spawn below the platform
          const item = this.physics.add.sprite(randomX, spawnY, "bullet-1");

          // Bullet settings
          item.displayWidth = 40 * (538 / 244);
          item.displayHeight = 40;
          item.setAngle(90);
          item.play("bullet-spin");

          const itemBody = item.body as Phaser.Physics.Arcade.Body;
          if (itemBody) {
            itemBody.setGravityY(300);
            itemBody.setAllowGravity(true);
            itemBody.setSize(40 * (538 / 244), 40);
            itemBody.setOffset(0.5, 0);
          }

          // Destroy item when it hits ground and create explosion
          this.physics.add.collider(item, this.ground, () => {
            this.createExplosionEffect(item.x, item.y);
            item.destroy();
          });
        }
      }

      // Schedule next throw at 3x speed (333ms instead of 1000ms)
      this.time.delayedCall(333, () => {
        this.continuousThrow();
      });
    });

    // Add extra item spawns between smashes
    if (!this.gameOverText.text.includes("Victory")) {
      // Only spawn bullets between smashes during game over
      this.time.delayedCall(166, () => {
        // Halfway between smashes
        const randomX = Phaser.Math.Between(50, GAME_WIDTH - 50);
        const spawnY = this.topPlatform.y + 50;
        const item = this.physics.add.sprite(randomX, spawnY, "bullet-1");

        // Bullet settings
        item.displayWidth = 40 * (538 / 244);
        item.displayHeight = 40;
        item.setAngle(90);
        item.play("bullet-spin");

        const itemBody = item.body as Phaser.Physics.Arcade.Body;
        if (itemBody) {
          itemBody.setGravityY(300);
          itemBody.setAllowGravity(true);
          itemBody.setSize(40 * (538 / 244), 40);
          itemBody.setOffset(0.5, 0);
        }

        // Destroy item when it hits ground and create explosion
        this.physics.add.collider(item, this.ground, () => {
          this.createExplosionEffect(item.x, item.y);
          item.destroy();
        });
      });
    } else {
      // During victory, spawn gems randomly
      this.time.delayedCall(1, () => {
        // Changed from 100 to 33 (3x more frequent)
        // Spawn a single gem
        const randomX = Phaser.Math.Between(50, GAME_WIDTH - 50);
        const spawnY = this.topPlatform.y + 50;
        const gem = this.physics.add.sprite(randomX, spawnY, "gem-1");

        // Gem settings
        gem.displayWidth = 50;
        gem.displayHeight = 50;
        gem.play("gem-sparkle");

        const gemBody = gem.body as Phaser.Physics.Arcade.Body;
        if (gemBody) {
          gemBody.setGravityY(300);
          gemBody.setAllowGravity(true);
          gemBody.setSize(50, 50);
          gemBody.setOffset(0.5, 0);
        }

        this.physics.add.collider(gem, this.ground, () => {
          gem.destroy();
        });
      });
    }
  }

  init(data: { itemsEarned?: number }) {
    if (data.itemsEarned) {
      this.itemsToDrop = data.itemsEarned * 2; // Double the items for longer rounds
    } else {
      this.itemsToDrop = 5; // Changed from 20 to 5 for testing
    }
    this.itemsDropped = 0;
    this.itemsCaughtOrMissed = 0;
  }

  private addEarnedItems(count: number) {
    for (let i = 0; i < count; i++) {
      const item = this.physics.add.sprite(
        this.dropper.x,
        this.dropper.y + DROPPER_HEIGHT / 2 + ITEM_HEIGHT / 2,
        "coin-0"
      );
      item.displayWidth = ITEM_WIDTH;
      item.displayHeight = ITEM_HEIGHT;
      item.play("coin-spin");
      const itemBody = item.body as Phaser.Physics.Arcade.Body;
      if (itemBody) {
        itemBody.setGravityY(300 * (1 + (this.round - 1) * 0.1));
        itemBody.setAllowGravity(true);
        // Set physics body size to match display size
        itemBody.setSize(ITEM_WIDTH, ITEM_HEIGHT);
        // Make item's collision point higher
        itemBody.setOffset(0.5, 0);
      }
      this.earnedItems.push(item);
      this.physics.add.collider(item, this.dropper);
      this.physics.add.collider(item, this.earnedItems);
    }
  }

  private createCatchEffect(x: number, y: number, points: number) {
    // Only show score popup for positive points
    if (points > 0) {
      // Create a particle burst
      const particles = this.add
        .particles(x, y, "blank", {
          speed: { min: 50, max: 100 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          lifespan: 500,
          quantity: 10,
          tint: 0xffffff,
        })
        .setDepth(200); // Above everything
      // Create score popup with offset based on player direction
      const offsetX = this.player.flipX ? -20 : 20;
      const scorePopup = this.add
        .text(x + offsetX, y, "+" + points, {
          fontSize: "36px", // Increased from 24px (50% larger)
          color: "#fff",
        })
        .setOrigin(0.5)
        .setDepth(200); // Above everything
      // Animate score popup
      this.tweens.add({
        targets: scorePopup,
        y: y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          scorePopup.destroy();
          particles.destroy();
        },
      });
      // Screen shake
      this.cameras.main.shake(100, 0.005);
    }
  }

  private createMissEffect(x: number, y: number) {
    // Create a particle burst
    const particles = this.add
      .particles(x, y, "blank", {
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 500,
        quantity: 10,
        tint: 0xff0000,
      })
      .setDepth(200); // Above everything

    // Create miss text with offset based on player direction
    const offsetX = this.player.flipX ? -20 : 20;
    const missText = this.add
      .text(x + offsetX, y, "💔", {
        fontSize: "36px", // Increased from 24px (50% larger)
        color: "#ff0000",
      })
      .setOrigin(0.5)
      .setDepth(200); // Above everything

    // Animate miss text
    this.tweens.add({
      targets: missText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        missText.destroy();
        particles.destroy();
      },
    });

    // Screen shake
    this.cameras.main.shake(200, 0.01);
  }

  private handleJump() {
    if (this.player.body && this.player.body.touching.down) {
      this.player.setVelocityY(-400); // Reduced from -500
      this.player.anims.play("wizard-jump", true);
    }
  }

  private stunPlayer() {
    this.isStunned = true;
    this.stunTimer = this.STUN_DURATION;
    this.player.anims.play("wizard-dizzy", true);
    // Add a timer to stop the animation when stun ends
    this.time.delayedCall(this.STUN_DURATION, () => {
      this.player.anims.play("wizard-rest", true);
    });
  }

  private createHitEffect(x: number, y: number) {
    console.log("Creating hit effect at", x, y); // Debug log
    this.createExplosionEffect(x, y);
  }

  private updateLivesText() {
    // If we're losing a life, animate the last heart
    if (this.livesTexts.length > this.lives) {
      const lastHeart = this.livesTexts[this.livesTexts.length - 1];
      lastHeart.setText("💔");

      // Animate the broken heart
      this.tweens.add({
        targets: lastHeart,
        y: lastHeart.y - 50, // Move up
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          lastHeart.destroy();
        },
      });
    }

    // Remove all existing hearts except the one being animated
    this.livesTexts.forEach((heart, index) => {
      if (index < this.lives) {
        heart.destroy();
      }
    });
    this.livesTexts = this.livesTexts.filter((_, index) => index >= this.lives);

    // Create new hearts
    const heartSize = 30;
    const heartSpacing = 5;
    const startX = GAME_WIDTH - 32; // Back to right side
    const startY = GAME_HEIGHT - 32;

    for (let i = 0; i < this.lives; i++) {
      const heart = this.add
        .text(startX - i * (heartSize + heartSpacing), startY, "❤️", {
          fontSize: "30px",
          fontFamily: "monospace",
        })
        .setOrigin(1, 1); // Set origin to bottom right
      this.livesTexts.push(heart);
    }
  }

  private createExplosionEffect(x: number, y: number) {
    const explosion = this.add.sprite(x, y, "explosion-1");
    explosion.setScale(0.075); // Increased from 0.05 (50% larger)
    explosion.setDepth(200); // Ensure it appears above everything
    explosion.setOrigin(0.5); // Center the explosion
    explosion.play("explosion", true); // Force restart the animation
    explosion.once("animationcomplete", () => {
      explosion.destroy();
    });
  }

  update(time: number, delta: number) {
    // Subtle parallax backgrounds based on player x
    if (this.player && this.player.body) {
      this.bg1.tilePositionX = this.player.x * 0.2;
      this.bg2.tilePositionX = this.player.x * 0.1;
      this.bg3.tilePositionX = this.player.x * 0.05;
    }

    if (this.gameOver) {
      // Only stop player movement
      if (this.player.body) {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
      }
      if (Phaser.Input.Keyboard.JustDown(this.boostKey)) {
        this.scene.restart();
      }
      return;
    }

    // Pause all gameplay during countdown
    if (this.countdownActive) {
      return;
    }

    // Trail effect: always show when moving, more pronounced when sprinting
    let trailInterval = this.isBoosting ? 20 : 60;
    let trailAlpha = this.isBoosting ? 0.3 : 0.12;
    if (this.player.body && this.player.body.velocity.x !== 0) {
      this.trailTimer += delta;
      if (this.trailTimer > trailInterval) {
        this.trailTimer = 0;
        const trail = this.add.rectangle(
          this.player.x,
          this.player.y,
          this.player.displayWidth,
          this.player.displayHeight,
          PLAYER_COLOR,
          trailAlpha
        );
        trail.setDepth(-1);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 250,
          onComplete: () => trail.destroy(),
        });
      }
    } else {
      this.trailTimer = trailInterval; // so it spawns immediately on next move
    }

    // Round timer
    this.roundTimer += delta;
    const timeLeft = Math.max(
      0,
      Math.ceil((ROUND_DURATION - this.roundTimer) / 1000)
    );

    if (this.roundTimer >= ROUND_DURATION) {
      this.startNewRound();
    }

    let speed = PLAYER_SPEED;
    if (this.isBoosting) {
      speed *= PLAYER_BOOST_MULTIPLIER;
      this.boostTimer -= delta;
      if (this.boostTimer <= 0) {
        this.isBoosting = false;
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.boostKey)) {
      this.isBoosting = true;
      this.boostTimer = PLAYER_BOOST_DURATION;
    }

    // Update stun timer
    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
    }

    // Movement with animation (only if not stunned)
    if (!this.isStunned) {
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
        this.player.setFlipX(false);
      } else {
        this.player.setVelocityX(0);
      }

      // Jump (up arrow or W)
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      if (playerBody) {
        const isOnGround = playerBody.blocked.down;
        if (
          (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.jumpKey)) &&
          isOnGround
        ) {
          this.player.setVelocityY(-300);
          this.player.play("wizard-jump", true);
        }
        // Return to idle when landing
        if (
          isOnGround &&
          this.player.anims.currentAnim?.key === "wizard-jump"
        ) {
          this.player.play("wizard-rest", true);
        }
      }
    }

    // Dropper movement with increasing speed
    const dropperBody = this.dropper.body as Phaser.Physics.Arcade.Body;
    if (dropperBody && !this.isThrowing) {
      const platformLeft =
        (GAME_WIDTH - PLATFORM_WIDTH) / 2 + DROPPER_WIDTH / 2 + 20; // Added 20px
      const platformRight =
        (GAME_WIDTH + PLATFORM_WIDTH) / 2 - DROPPER_WIDTH / 2 - 20; // Subtracted 20px
      if (this.dropper.x <= platformLeft) {
        this.dropper.x = platformLeft;
        this.dropperSpeed = Phaser.Math.Between(
          DROPPER_MIN_SPEED * (1 + (this.round - 1) * 0.2),
          DROPPER_MAX_SPEED * (1 + (this.round - 1) * 0.2)
        );
      } else if (this.dropper.x >= platformRight) {
        this.dropper.x = platformRight;
        this.dropperSpeed = -Phaser.Math.Between(
          DROPPER_MIN_SPEED * (1 + (this.round - 1) * 0.2),
          DROPPER_MAX_SPEED * (1 + (this.round - 1) * 0.2)
        );
      }
      this.dropper.setVelocityX(this.dropperSpeed);
    }

    // Player animation
    if (!this.isStunned) {
      if (this.player.body && !this.player.body.blocked.down) {
        // Keep jump animation playing while in air
        if (this.player.anims.currentAnim?.key !== "wizard-jump") {
          this.player.play("wizard-jump", true);
        }
      } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
        this.player.anims.play("wizard-walk", true);
      } else {
        this.player.anims.play("wizard-rest", true);
      }
    }

    // Dropper animation
    if (!this.isThrowing) {
      if (this.dropper.body && Math.abs(this.dropper.body.velocity.x) > 10) {
        this.dropper.anims.play("golem-walk", true);
        this.dropper.setFlipX(this.dropper.body.velocity.x > 0);

        // Dynamically adjust walk animation speed based on velocity
        const minSpeed = DROPPER_MIN_SPEED;
        const maxSpeed = DROPPER_MAX_SPEED;
        const minFrameRate = 4; // slowest walk
        const maxFrameRate = 16; // fastest walk
        const speed = Math.abs(this.dropper.body.velocity.x);
        // Linear interpolation between min and max frame rate
        const frameRate =
          minFrameRate +
          ((speed - minSpeed) / (maxSpeed - minSpeed)) *
            (maxFrameRate - minFrameRate);
        // Clamp frameRate
        const clampedFrameRate = Math.max(
          minFrameRate,
          Math.min(maxFrameRate, frameRate)
        );
        this.dropper.anims.msPerFrame = 1000 / clampedFrameRate;
      } else {
        this.dropper.anims.play("golem-rest", true);
      }
    }

    // Only drop items if we haven't dropped all for this round
    if (this.itemsDropped < this.itemsToDrop && !this.isThrowing) {
      this.dropTimer += delta;
      const currentDropInterval =
        BASE_DROP_INTERVAL * Math.max(0.5, 1 - (this.round - 1) * 0.1);
      if (this.dropTimer >= currentDropInterval) {
        this.dropTimer = 0;
        this.isThrowing = true;

        // Force stop the golem completely
        if (this.dropper.body) {
          this.dropperPrevVelocityX = this.dropper.body.velocity.x;
          this.dropper.setVelocityX(0);
          this.dropper.anims.stop();
          this.dropper.anims.play("golem-rest", true);
        }

        // Wait 0.01s before playing throw animation
        this.time.delayedCall(10, () => {
          this.dropper.anims.play("golem-throw", true);
          this.dropper.once("animationcomplete-golem-throw", () => {
            const itemType = Phaser.Math.RND.pick(
              Object.keys(ITEM_TYPES)
            ) as keyof typeof ITEM_TYPES;
            const item = this.physics.add.sprite(
              this.dropper.x + (this.dropper.flipX ? 50 : -50),
              this.dropper.y + (itemType === "HARMFUL" ? 125 : 115), // Lowered all by 10px
              itemType === "REQUIRED"
                ? "coin-0"
                : itemType === "BONUS"
                ? "gem-1"
                : "bullet-1"
            );
            if (itemType === "REQUIRED") {
              item.displayWidth = 40;
              item.displayHeight = 40;
              item.play("coin-spin");
            } else if (itemType === "BONUS") {
              item.displayWidth = 50; // Increased to 50
              item.displayHeight = 50; // Increased to 50
              item.play("gem-sparkle");
            } else {
              // Bullet animation
              item.displayWidth = 40 * (538 / 244);
              item.displayHeight = 40;
              item.setAngle(90);
              item.play("bullet-spin");
            }
            const itemBody = item.body as Phaser.Physics.Arcade.Body;
            if (itemBody) {
              itemBody.setGravityY(300 * (1 + (this.round - 1) * 0.1));
              itemBody.setAllowGravity(true);
              // Set physics body size to match display size
              if (itemType === "REQUIRED") {
                itemBody.setSize(40, 40);
              } else if (itemType === "BONUS") {
                itemBody.setSize(50, 50); // Increased to 50
              } else {
                // For bullets, swap dimensions since we rotate 90 degrees
                itemBody.setSize(40 * (538 / 244), 40);
              }
              // Make item's collision point higher
              itemBody.setOffset(0.5, 0);
            }
            this.itemsDropped++;
            this.physics.add.collider(item, this.ground, () => {
              if (itemType === "REQUIRED") {
                this.lives--;
                this.updateLivesText();
                this.createMissEffect(item.x, item.y);
                if (this.lives <= 0) {
                  this.gameOverHandler();
                }
              } else if (itemType === "HARMFUL") {
                this.createExplosionEffect(item.x, item.y);
              }
              this.itemsCaughtOrMissed++;
              if (this.itemsCaughtOrMissed >= this.itemsToDrop) {
                this.startNewRound();
              }
              item.destroy();
            });
            this.physics.add.overlap(item, this.player, () => {
              if (itemType === "HARMFUL") {
                this.lives--;
                this.updateLivesText();
                this.createMissEffect(item.x, item.y);
                this.createHitEffect(item.x, item.y);
                this.stunPlayer();
                if (this.lives <= 0) {
                  this.gameOverHandler();
                }
              } else {
                this.score += ITEM_TYPES[itemType].points;
                this.scoreText.setText("Score: " + this.score);
                this.createCatchEffect(
                  item.x,
                  item.y,
                  ITEM_TYPES[itemType].points
                );
              }
              this.itemsCaughtOrMissed++;
              if (this.itemsCaughtOrMissed >= this.itemsToDrop) {
                this.startNewRound();
              }
              item.destroy();
            });
            // Wait 0.25s after throw before resuming movement
            this.time.delayedCall(250, () => {
              if (this.dropper.body) {
                this.dropper.setVelocityX(this.dropperPrevVelocityX);
              }
              this.isThrowing = false;
            });
          });
        });
      }
    }
  }
}
