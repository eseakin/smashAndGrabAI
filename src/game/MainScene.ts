import Phaser from "phaser";

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;
const GROUND_HEIGHT = 20;
const TOP_PLATFORM_HEIGHT = 20;
const PLATFORM_WIDTH = 800;
const PLAYER_COLOR = 0x1976d2;
const PLAYER_SPEED = 200;
const PLAYER_BOOST_MULTIPLIER = 2.0;
const PLAYER_BOOST_DURATION = 300; // ms
const DROPPER_WIDTH = 40;
const DROPPER_HEIGHT = 40;
const DROPPER_MIN_SPEED = 100;
const DROPPER_MAX_SPEED = 300;
const ITEM_WIDTH = 20;
const ITEM_HEIGHT = 20;
const BASE_DROP_INTERVAL = 2000; // ms
const MIN_DROP_INTERVAL = 1000; // ms
const MAX_DROP_INTERVAL = 3000; // ms
const LIVES = 3;
const DIFFICULTY_INCREASE_INTERVAL = 2000; // Increase difficulty every 2 seconds
const DIFFICULTY_SPEED_MULTIPLIER = 0.15; // 15% speed increase per level
const DIFFICULTY_GRAVITY_MULTIPLIER = 0.15; // 15% gravity increase per level
const DIFFICULTY_DROP_INTERVAL_MULTIPLIER = 0.1; // 10% faster drops per level
const DIFFICULTY_PLATFORM_RANGE_MULTIPLIER = 0.1; // 10% wider platform range per level
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
  private isBoosting = false;
  private boostTimer = 0;
  private dropperSpeed = 0;
  private dropTimer = 0;
  private ground!: Phaser.GameObjects.Rectangle;
  private topPlatform!: Phaser.GameObjects.Rectangle;
  private leftWall!: Phaser.GameObjects.Rectangle;
  private rightWall!: Phaser.GameObjects.Rectangle;
  private score = 0;
  private highScore = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private lives = LIVES;
  private livesTexts: Phaser.GameObjects.Text[] = [];
  private gameTime = 0;
  private gameTimeText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private gameOverText!: Phaser.GameObjects.Text;
  private gameOverScoreText!: Phaser.GameObjects.Text;
  private gameOverHighScoreText!: Phaser.GameObjects.Text;
  private earnedItems: Phaser.Physics.Arcade.Sprite[] = [];
  private difficultyLevel = 1;
  private difficultyTimer = 0;
  private countdown = 0;
  private countdownText!: Phaser.GameObjects.Text;
  private countdownActive = false;
  private trailTimer = 0;
  private dashTrailTimer = 0;
  private walkTrailTimer = 0;
  private bg3!: Phaser.GameObjects.TileSprite;
  private bg2!: Phaser.GameObjects.TileSprite;
  private bg1!: Phaser.GameObjects.Sprite;
  private isThrowing = false;
  private dropperPrevVelocityX = 0;
  private isStunned = false;
  private stunTimer = 0;
  private readonly STUN_DURATION = 1000; // 1 second stun
  private gameOverPanel!: Phaser.GameObjects.Rectangle;
  private gameOverBorder!: Phaser.GameObjects.Graphics;
  private groundPlatformImg!: Phaser.GameObjects.Image;
  private fgContainer!: Phaser.GameObjects.Container;
  private golemTrailTimer = 0;

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

    // In preload()
    this.load.image("platform-img", "images/bg/platform.png");
    this.load.image("bg-layer1-wide", "images/bg/MathWizBG/Layer1 wide.png");
    this.load.image("ground-img", "images/bg/ground.png");
    this.load.image("block-img", "images/bg/block.png");

    this.load.spritesheet("spell-hit2", "images/Effects/Spells/2.png", {
      frameWidth: 256,
      frameHeight: 256,
    });

    this.load.spritesheet("spell-hit9", "images/Effects/Spells/9.png", {
      frameWidth: 256,
      frameHeight: 256,
    });

    // Slide animation (single frame)
    this.load.image(
      "wizard-slide-0",
      "images/Wizard/Wizard character sprites/RESIZE/Slide.png"
    );

    this.load.image("golem-blast", "images/Effects/BulletsEtc/Blast small.png");
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

    // Spell hit2 animation
    this.anims.create({
      key: "spell-hit2",
      frames: this.anims.generateFrameNumbers("spell-hit2", {
        start: 0,
        end: 39,
      }),
      frameRate: 60,
      repeat: 0,
    });

    // Spell hit9 animation
    this.anims.create({
      key: "spell-hit9",
      frames: this.anims.generateFrameNumbers("spell-hit9", {
        start: 0,
        end: 39,
      }),
      frameRate: 60,
      repeat: 0,
    });

    // Background layers
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
      .setOrigin(0.5, 0.5)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScale(1)
      .setScrollFactor(0); // Prevent movement during screen shake
    this.bg2 = this.add
      .tileSprite(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        "bg-layer2"
      )
      .setOrigin(0.5, 0.5)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScale(1.5)
      .setScrollFactor(0); // Prevent movement during screen shake
    // Foreground only at the bottom (single wide image)
    this.bg1 = this.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT, "bg-layer1-wide")
      .setOrigin(0.5, 1)
      .setDisplaySize(1400, 330)
      .setScrollFactor(0);

    // Background color
    this.cameras.main.setBackgroundColor(0xa0d8ef);

    // Ground platform (player area)
    this.ground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - GROUND_HEIGHT / 2 + 20, // Move down by 20px (half of the extra height)
      GAME_WIDTH + 40, // Extend 20px on each side
      GROUND_HEIGHT + 40 // Extend 40px down
    );
    this.physics.add.existing(this.ground, true);

    // Foreground container for parallaxed elements
    this.fgContainer = this.add.container(0, 0);

    // Add platform image visually over the ground
    this.groundPlatformImg = this.add.image(
      GAME_WIDTH / 2,
      GAME_HEIGHT + 250, // Align bottom edge with ground
      "ground-img"
    );
    this.groundPlatformImg.setOrigin(0.5, 1);
    this.groundPlatformImg.displayWidth = 1889;
    this.groundPlatformImg.displayHeight = 334;
    this.groundPlatformImg.setDepth(0);
    this.groundPlatformImg.setScale(1.2, 1.2);
    this.fgContainer.add(this.groundPlatformImg);

    // Top platform (dropper area)
    this.topPlatform = this.add
      .rectangle(
        GAME_WIDTH / 2,
        TOP_PLATFORM_HEIGHT / 2 + 145,
        PLATFORM_WIDTH,
        TOP_PLATFORM_HEIGHT,
        0x6d4c41
      )
      .setAlpha(0);
    this.physics.add.existing(this.topPlatform, true);

    // Left boundary (for player)
    this.leftWall = this.add
      .rectangle(0, GAME_HEIGHT / 2, 10, GAME_HEIGHT, 0x333333)
      .setAlpha(0);
    this.physics.add.existing(this.leftWall, true);

    // Right boundary (for player)
    this.rightWall = this.add
      .rectangle(GAME_WIDTH, GAME_HEIGHT / 2, 10, GAME_HEIGHT, 0x333333)
      .setAlpha(0);
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
    // Slide animation (single frame)
    this.anims.create({
      key: "wizard-slide",
      frames: [{ key: "wizard-slide-0" }],
      frameRate: 1,
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

    // Set initial parallax positions based on player starting position
    this.bg1.x = GAME_WIDTH / 2 - this.player.x * 0.2;
    this.fgContainer.x = -this.player.x * 0.2;
    this.bg2.tilePositionX = this.player.x * 0.1;
    this.bg3.tilePositionX = this.player.x * 0.05;

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
      dropperBody.setMaxVelocity(300, 0); // Limit horizontal velocity
      dropperBody.setDrag(0); // No drag
      dropperBody.setFriction(0); // No friction
    }

    // Collisions
    this.physics.add.collider(this.player, this.ground, () => {
      // Optional: Add any ground collision effects here
    });
    this.physics.add.collider(this.player, this.leftWall);
    this.physics.add.collider(this.player, this.rightWall);
    this.physics.add.collider(this.dropper, this.topPlatform);

    // Input
    this.cursors = this.input!.keyboard!.createCursorKeys();
    this.boostKey = this.input!.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
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
      .text(Math.round(32), Math.round(GAME_HEIGHT - 32), "Score: 0", {
        fontSize: "30px",
        color: "#fff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 1)
      .setDepth(0);
    this.scoreText.setResolution(2);

    this.highScoreText = this.add
      .text(Math.round(32), Math.round(GAME_HEIGHT - 70), "High Score: 0", {
        fontSize: "24px",
        color: "#fff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 1)
      .setDepth(0);
    this.highScoreText.setResolution(2);

    this.gameTimeText = this.add
      .text(Math.round(GAME_WIDTH / 2), Math.round(32), "Time: 0", {
        fontSize: "30px",
        color: "#fff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5, 0)
      .setDepth(0);
    this.gameTimeText.setResolution(2);

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
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "", {
        fontSize: "96px",
        color: "#FF9800", // Bright orange
        fontFamily:
          "'UnifrakturCook', 'Cinzel Decorative', 'MedievalSharp', serif",
        fontStyle: "bold",
        stroke: "#222222", // Black outline
        strokeThickness: 12,
        shadow: {
          offsetX: 4,
          offsetY: 4,
          color: "#222222",
          blur: 8,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(300);

    // Score subtitle (smaller, bright green, fantasy/serif font)
    this.gameOverScoreText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "", {
        fontSize: "40px",
        color: "#FF9800", // Bright orange (same as Victory!)
        fontFamily:
          "'UnifrakturCook', 'Cinzel Decorative', 'MedievalSharp', serif",
        fontStyle: "italic",
        stroke: "#222222", // Black outline
        strokeThickness: 6,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#222222",
          blur: 4,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(300);

    // Add high score text
    this.gameOverHighScoreText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, "", {
        fontSize: "32px",
        color: "#FF9800",
        fontFamily:
          "'UnifrakturCook', 'Cinzel Decorative', 'MedievalSharp', serif",
        fontStyle: "italic",
        stroke: "#222222",
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#222222",
          blur: 4,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(300);

    // Add a bold, orange fantasy panel behind the text
    const panel = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        500,
        200,
        0xff9800, // Bright orange
        0.2 // 20% opacity
      )
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(299);

    // Add a thick, strong blue border using Graphics (stroke only, no fill)
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(8, 0x000000, 1); // 8px, blue, fully opaque
    borderGraphics.strokeRect(
      GAME_WIDTH / 2 - 255,
      GAME_HEIGHT / 2 - 105,
      510,
      210
    );
    borderGraphics.setVisible(false);
    borderGraphics.setDepth(298);

    this.gameOverPanel = panel;
    this.gameOverBorder = borderGraphics;

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

    // In create(), after creating this.topPlatform
    const platformImg = this.add.image(
      this.topPlatform.x,
      this.topPlatform.y + 20,
      "platform-img"
    );
    platformImg.setOrigin(0.5, 0.5);
    platformImg.displayWidth = 850;
    platformImg.displayHeight = (334 / 1889) * 850; // maintain aspect ratio
    platformImg.setDepth(1000); // foreground

    // Generate a cartoony dust-circle texture (dark outline, light fill)
    const dustSize = 20;
    const graphics = this.add.graphics();
    graphics.fillStyle(0xf8f8f8, 1); // light gray fill
    graphics.lineStyle(3, 0x333333, 1); // dark outline
    graphics.strokeCircle(dustSize / 2, dustSize / 2, dustSize / 2 - 2);
    graphics.fillCircle(dustSize / 2, dustSize / 2, dustSize / 2 - 4);
    graphics.generateTexture("dust-circle", dustSize, dustSize);
    graphics.destroy();
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
    this.lives = LIVES;
    this.gameOver = false;
    this.gameOverText.setVisible(false);
    this.gameOverPanel.setVisible(false);
    this.gameOverBorder.setVisible(false);
    this.gameOverScoreText.setVisible(false);
    this.gameOverHighScoreText.setVisible(false);
  }

  private startVictoryCelebration() {
    // Random movement pattern
    const moveLeft = () => {
      if (!this.gameOver) return;
      this.player.setVelocityX(-PLAYER_SPEED * 1.5);
      this.player.setFlipX(true);
      this.player.anims.play("wizard-walk", true);

      // Random jump
      if (Phaser.Math.Between(0, 1) === 1) {
        this.player.setVelocityY(-400);
        this.player.anims.play("wizard-jump", true);
      }

      // Random dash
      if (Phaser.Math.Between(0, 2) === 1) {
        this.isBoosting = true;
        this.boostTimer = PLAYER_BOOST_DURATION;
        this.player.anims.play("wizard-slide", true);
      }

      this.time.delayedCall(Phaser.Math.Between(500, 1000), moveRight);
    };

    const moveRight = () => {
      if (!this.gameOver) return;
      this.player.setVelocityX(PLAYER_SPEED * 1.5);
      this.player.setFlipX(false);
      this.player.anims.play("wizard-walk", true);

      // Random jump
      if (Phaser.Math.Between(0, 1) === 1) {
        this.player.setVelocityY(-400);
        this.player.anims.play("wizard-jump", true);
      }

      // Random dash
      if (Phaser.Math.Between(0, 2) === 1) {
        this.isBoosting = true;
        this.boostTimer = PLAYER_BOOST_DURATION;
        this.player.anims.play("wizard-slide", true);
      }

      this.time.delayedCall(Phaser.Math.Between(500, 1000), moveLeft);
    };

    // Start the celebration
    moveLeft();
  }

  private gameOverHandler() {
    this.gameOver = true;
    this.player.anims.play("wizard-dizzy", true);
    this.gameOverPanel.setVisible(true);
    this.gameOverBorder.setVisible(true);
    this.gameOverText.setText("Game Over!");
    this.gameOverText.setVisible(true);

    // Update high score if needed
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.gameOverScoreText.setText(`New High Score: ${this.score}!`);
    } else {
      this.gameOverScoreText.setText(`Score: ${this.score}`);
    }
    this.gameOverScoreText.setVisible(true);

    this.gameOverHighScoreText.setText(`High Score: ${this.highScore}`);
    this.gameOverHighScoreText.setVisible(true);

    // Stop the golem's movement and keep it in place
    if (this.dropper.body) {
      this.dropper.setVelocityX(0);
      // Ensure golem stays within platform bounds
      const golemWidth = 150;
      const platformLeft = 85 + golemWidth / 2;
      const platformRight = GAME_WIDTH - 100 - golemWidth / 2;
      this.dropper.x = Phaser.Math.Clamp(
        this.dropper.x,
        platformLeft,
        platformRight
      );
      this.continuousThrow();
    }

    // Start the celebration animation
    this.startVictoryCelebration();
  }

  private continuousThrow() {
    if (!this.gameOver) return;

    // Ensure golem stays within platform bounds
    const golemWidth = 150;
    const platformLeft = 85 + golemWidth / 2;
    const platformRight = GAME_WIDTH - 100 - golemWidth / 2;
    this.dropper.x = Phaser.Math.Clamp(
      this.dropper.x,
      platformLeft,
      platformRight
    );

    // Play throw animation at 3x speed
    this.dropper.anims.play("golem-throw", true);
    this.dropper.anims.timeScale = 3; // 3x faster animation
    // Create blast after 167ms (halfway through the faster animation)
    this.time.delayedCall(167, () => {
      this.createGolemBlast();
    });
    this.dropper.once("animationcomplete-golem-throw", () => {
      if (this.gameOverText.text.includes("Game Over")) {
        // Spawn gems during victory
        for (let i = 0; i < 3; i++) {
          // Create 3 items per throw
          const randomX = Phaser.Math.Between(50, GAME_WIDTH - 50);
          const spawnY = this.topPlatform.y + 50; // Spawn below the platform
          const item = this.physics.add.sprite(randomX, spawnY, "gem-1");

          // Gem settings
          item.displayWidth = 50;
          item.displayHeight = 50;
          item.play("gem-sparkle");

          const itemBody = item.body as Phaser.Physics.Arcade.Body;
          if (itemBody) {
            itemBody.setGravityY(300);
            itemBody.setAllowGravity(true);
            itemBody.setSize(50, 50);
            itemBody.setOffset(0.5, 0);
          }

          // Destroy item when it hits ground and create spell effect
          this.physics.add.collider(item, this.ground, () => {
            const localX = item.x - this.fgContainer.x;
            const impactY =
              item.y + (item.displayHeight ? -item.displayHeight / 2 : 0);
            const spell2 = this.add.sprite(localX, impactY, "spell-hit2");
            this.fgContainer.add(spell2);
            spell2.setScale(0.35);
            spell2.setOrigin(0.5);
            spell2.play("spell-hit2", true);
            spell2.once("animationcomplete", () => spell2.destroy());
            item.destroy();
          });
        }
      } else {
        // Only spawn bullets during game over (not victory)
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
  }

  init(data: { itemsEarned?: number }) {
    // No longer needed since we're not using rounds
  }

  private addEarnedItems(count: number) {
    // No longer needed since we're not using rounds
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
      // Screen shake: use camera shake only
      this.cameras.main.shake(350, 0.002); // match duration for both
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

    // Screen shake: use camera shake only
    this.cameras.main.shake(350, 0.008); // smoother, less jittery
  }

  private stunPlayer() {
    this.isStunned = true;
    this.stunTimer = this.STUN_DURATION;
    this.player.anims.play("wizard-dizzy", true);
    // Decelerate horizontal movement quickly when stunned
    if (this.player.body) {
      this.tweens.add({
        targets: this.player.body.velocity,
        x: 0,
        duration: 250,
        ease: "Quad.easeOut",
      });
    }
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
    const localX = x - this.fgContainer.x;
    const explosion = this.add.sprite(localX, y, "explosion-1");
    this.fgContainer.add(explosion);
    explosion.setScale(0.075); // Increased from 0.05 (50% larger)
    explosion.setDepth(200); // Ensure it appears above everything
    explosion.setOrigin(0.5); // Center the explosion
    explosion.play("explosion", true); // Force restart the animation
    explosion.once("animationcomplete", () => {
      explosion.destroy();
    });
  }

  // Helper to create the golem blast effect under the fist
  private createGolemBlast() {
    const golem = this.dropper;
    const blastOffset = -20;
    const facingRight = golem.flipX === true; // true when facing right, false when facing left
    const direction = facingRight ? 1 : -1; // true when facing right, false when facing left
    const golemLeadingEdge = golem.x + (direction * golem.displayWidth) / 2;
    const blastX = golemLeadingEdge + direction * blastOffset;
    const blastY = golem.y + golem.displayHeight / 2 - 10;

    // Create the block that pops up
    const block = this.add
      .image(blastX, TOP_PLATFORM_HEIGHT / 2 + 155 + 15, "block-img") // Start 15px below platform
      .setOrigin(0.5, 1)
      .setDepth(900) // Between golem (100) and blast (1000)
      .setDisplaySize(50, 50 * (125 / 148)); // Maintain aspect ratio (148:125)

    // Add dust particles
    const dustParticles = this.add
      .particles(blastX, TOP_PLATFORM_HEIGHT / 2 + 155 + 15, "dust-circle", {
        speed: { min: 50, max: 100 },
        angle: { min: 200, max: 340 }, // Upward spread
        scale: { start: 0.5, end: 0 },
        lifespan: 400,
        quantity: 8,
        alpha: { start: 0.7, end: 0 },
        gravityY: 300,
        emitting: false,
      })
      .setDepth(899);

    // Emit particles when block bounces
    dustParticles.explode(8);

    // Animate the block bouncing
    this.tweens.add({
      targets: block,
      y: TOP_PLATFORM_HEIGHT / 2 + 155, // Bounce up to platform level
      duration: 150,
      ease: "Quad.easeOut",
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: block,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            block.destroy();
            dustParticles.destroy();
          },
        });
      },
    });

    const blast = this.add
      .sprite(blastX, blastY, "golem-blast")
      .setOrigin(0.5, 1)
      .setDepth(1000);
    blast.setScale(0.25, 0.4); // Scale to make blast 50px wide
    if (!facingRight) blast.setFlipX(true);

    // Create a parallel tween for scale and alpha
    this.tweens.add({
      targets: blast,
      alpha: 0,
      scaleX: 0.325, // 0.25 * 1.3
      scaleY: 0.52, // 0.4 * 1.3
      duration: 250,
      onComplete: () => blast.destroy(),
    });
  }

  update(time: number, delta: number) {
    if (this.gameOver) {
      // Allow movement during game over celebration
      if (this.player.body) {
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        // Return to idle when landing
        if (
          playerBody.blocked.down &&
          this.player.anims.currentAnim?.key === "wizard-jump"
        ) {
          this.player.play("wizard-rest", true);
        }
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

    // Update game time
    this.gameTime += delta;
    const seconds = Math.floor(this.gameTime / 1000);
    this.gameTimeText.setText(`Time: ${seconds}`);

    // Update difficulty
    this.difficultyTimer += delta;
    if (this.difficultyTimer >= DIFFICULTY_INCREASE_INTERVAL) {
      this.difficultyTimer = 0;
      this.difficultyLevel++;
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

    // Movement with animation (only if not stunned and not in game over celebration)
    if (!this.isStunned && !this.gameOverText.text.includes("Game Over")) {
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
        this.player.setFlipX(false);
      } else {
        this.player.setVelocityX(0);
      }

      // Player animation
      if (!this.isStunned) {
        if (this.isBoosting) {
          // Play slide animation during boost
          if (this.player.anims.currentAnim?.key !== "wizard-slide") {
            this.player.play("wizard-slide", true);
          }
        } else if (this.player.body && !this.player.body.blocked.down) {
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
    }

    // Dropper movement with increasing speed and range
    const dropperBody = this.dropper.body as Phaser.Physics.Arcade.Body;
    if (dropperBody && !this.isThrowing) {
      // Calculate boundaries accounting for golem width
      const golemWidth = 150; // golem's display width
      const platformLeft = 85 + golemWidth / 2; // Left edge + half golem width
      const platformRight = GAME_WIDTH - 100 - golemWidth / 2; // Right edge - half golem width

      // Force the golem to stay within bounds
      if (this.dropper.x <= platformLeft) {
        this.dropper.x = platformLeft;
        this.dropperSpeed = Phaser.Math.Between(
          DROPPER_MIN_SPEED *
            (1 + (this.difficultyLevel - 1) * DIFFICULTY_SPEED_MULTIPLIER),
          DROPPER_MAX_SPEED *
            (1 + (this.difficultyLevel - 1) * DIFFICULTY_SPEED_MULTIPLIER)
        );
      } else if (this.dropper.x >= platformRight) {
        this.dropper.x = platformRight;
        this.dropperSpeed = -Phaser.Math.Between(
          DROPPER_MIN_SPEED *
            (1 + (this.difficultyLevel - 1) * DIFFICULTY_SPEED_MULTIPLIER),
          DROPPER_MAX_SPEED *
            (1 + (this.difficultyLevel - 1) * DIFFICULTY_SPEED_MULTIPLIER)
        );
      }

      // Ensure the golem stays within bounds even if it somehow gets past the collision
      this.dropper.x = Phaser.Math.Clamp(
        this.dropper.x,
        platformLeft,
        platformRight
      );
      dropperBody.setVelocityX(this.dropperSpeed);
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

        // Golem dust emission (side effect)
        if (
          this.dropper.anims.currentAnim?.key === "golem-walk" &&
          Math.abs(this.dropper.body.velocity.x) > 0.5
        ) {
          this.golemTrailTimer += delta;
          if (this.golemTrailTimer > 300) {
            this.golemTrailTimer = 0;
            const dust = this.add.sprite(
              this.dropper.x,
              this.dropper.y + this.dropper.displayHeight / 2 - 10,
              "dust-circle"
            );
            const scale = Phaser.Math.FloatBetween(1.5, 2.0);
            dust.setScale(scale);
            dust.setAlpha(Phaser.Math.FloatBetween(0.5, 0.7));
            dust.setDepth(110);
            this.tweens.add({
              targets: dust,
              alpha: 0,
              y: dust.y + Phaser.Math.Between(12, 28),
              scale: scale * 2.2,
              duration: Phaser.Math.Between(600, 900),
              ease: "Quad.easeOut",
              onComplete: () => dust.destroy(),
            });
          }
        } else {
          this.golemTrailTimer = 300;
        }
      } else {
        this.dropper.anims.play("golem-rest", true);
      }
    }

    // Drop items continuously with increasing frequency
    if (!this.isThrowing) {
      this.dropTimer += delta;
      // Calculate base interval with difficulty scaling
      const baseInterval =
        BASE_DROP_INTERVAL *
        Math.max(
          0.2,
          1 - (this.difficultyLevel - 1) * DIFFICULTY_DROP_INTERVAL_MULTIPLIER
        );
      // Calculate min and max intervals based on difficulty
      const minInterval =
        MIN_DROP_INTERVAL *
        Math.max(
          0.2,
          1 - (this.difficultyLevel - 1) * DIFFICULTY_DROP_INTERVAL_MULTIPLIER
        );
      const maxInterval =
        MAX_DROP_INTERVAL *
        Math.max(
          0.2,
          1 - (this.difficultyLevel - 1) * DIFFICULTY_DROP_INTERVAL_MULTIPLIER
        );

      // Get random interval between min and max
      const currentDropInterval = Phaser.Math.Between(minInterval, maxInterval);

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
          // Create blast after 500ms (halfway through the animation)
          this.time.delayedCall(500, () => {
            this.createGolemBlast();
          });
          this.dropper.once("animationcomplete-golem-throw", () => {
            const itemType = Phaser.Math.RND.pick(
              Object.keys(ITEM_TYPES)
            ) as keyof typeof ITEM_TYPES;
            const item = this.physics.add.sprite(
              this.dropper.x + (this.dropper.flipX ? 50 : -50),
              this.dropper.y + (itemType === "HARMFUL" ? 125 : 115),
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
              item.displayWidth = 50;
              item.displayHeight = 50;
              item.play("gem-sparkle");
            } else {
              item.displayWidth = 40 * (538 / 244);
              item.displayHeight = 40;
              item.setAngle(90);
              item.play("bullet-spin");
            }
            const itemBody = item.body as Phaser.Physics.Arcade.Body;
            if (itemBody) {
              itemBody.setGravityY(
                300 *
                  (1 +
                    (this.difficultyLevel - 1) * DIFFICULTY_GRAVITY_MULTIPLIER)
              );
              itemBody.setAllowGravity(true);
              if (itemType === "REQUIRED") {
                itemBody.setSize(40, 40);
              } else if (itemType === "BONUS") {
                itemBody.setSize(50, 50);
              } else {
                itemBody.setSize(40 * (538 / 244), 40);
              }
              itemBody.setOffset(0.5, 0);
            }

            this.physics.add.collider(item, this.ground, () => {
              const localX = item.x - this.fgContainer.x;
              const impactY =
                item.y + (item.displayHeight ? -item.displayHeight / 2 : 0);
              if (itemType === "REQUIRED") {
                const spell9 = this.add.sprite(localX, impactY, "spell-hit9");
                this.fgContainer.add(spell9);
                spell9.setScale(0.35);
                spell9.setOrigin(0.5);
                spell9.play("spell-hit9", true);
                spell9.once("animationcomplete", () => spell9.destroy());
                this.lives--;
                this.updateLivesText();
                this.createMissEffect(item.x, item.y);
                if (this.lives <= 0) {
                  this.gameOverHandler();
                }
              } else if (itemType === "BONUS") {
                const spell2 = this.add.sprite(localX, impactY, "spell-hit2");
                this.fgContainer.add(spell2);
                spell2.setScale(0.35);
                spell2.setOrigin(0.5);
                spell2.play("spell-hit2", true);
                spell2.once("animationcomplete", () => spell2.destroy());
              } else if (itemType === "HARMFUL") {
                this.createExplosionEffect(item.x, item.y);
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
                if (
                  this.player.body &&
                  (this.player.body as Phaser.Physics.Arcade.Body).blocked.down
                ) {
                  this.player.setVelocityY(-300);
                  this.player.play("wizard-jump", true);
                }
              }
              item.destroy();
            });

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

    if (this.player && this.player.body) {
      // Parallax for single wide bg1
      const targetX = GAME_WIDTH / 2 - this.player.x * 0.2;
      const currentX = this.bg1.x;
      // Smoothly interpolate to target position
      this.bg1.x = currentX + (targetX - currentX) * 0.1;

      const targetContainerX = -this.player.x * 0.2;
      const currentContainerX = this.fgContainer.x;
      // Smoothly interpolate to target position
      this.fgContainer.x =
        currentContainerX + (targetContainerX - currentContainerX) * 0.1;

      // Smooth tile position changes
      const targetTileX = this.player.x * 0.1;
      const currentTileX = this.bg2.tilePositionX;
      this.bg2.tilePositionX =
        currentTileX + (targetTileX - currentTileX) * 0.1;

      const targetTileX3 = this.player.x * 0.05;
      const currentTileX3 = this.bg3.tilePositionX;
      this.bg3.tilePositionX =
        currentTileX3 + (targetTileX3 - currentTileX3) * 0.1;
    }

    // Return to idle when landing
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (playerBody) {
      const isOnGround = playerBody.blocked.down;
      if (isOnGround && this.player.anims.currentAnim?.key === "wizard-jump") {
        this.player.play("wizard-rest", true);
      }
    }

    // Dash (slide) trail
    if (
      this.isBoosting &&
      this.player.body &&
      Math.abs(this.player.body.velocity.x) > 0 &&
      !this.isStunned
    ) {
      this.dashTrailTimer += delta;
      if (this.dashTrailTimer > 30) {
        this.dashTrailTimer = 0;
        const dust = this.add.sprite(
          this.player.x + (this.player.flipX ? -38 : 38),
          this.player.y + this.player.displayHeight / 2 - 12,
          "dust-circle"
        );
        const scale = Phaser.Math.FloatBetween(0.5, 0.8);
        dust.setScale(scale);
        dust.setAlpha(0.7);
        dust.setDepth(110);
        this.tweens.add({
          targets: dust,
          alpha: 0,
          y: dust.y + Phaser.Math.Between(8, 18),
          scale: scale * 3.5,
          duration: Phaser.Math.Between(300, 450),
          ease: "Quad.easeOut",
          onComplete: () => dust.destroy(),
        });
      }
    } else {
      this.dashTrailTimer = 30;
    }

    // Regular movement trail
    if (
      !this.isBoosting &&
      this.player.body &&
      Math.abs(this.player.body.velocity.x) > 0 &&
      !this.isStunned
    ) {
      this.walkTrailTimer += delta;
      if (this.walkTrailTimer > 40) {
        // Emit twice as often
        this.walkTrailTimer = 0;
        const dust = this.add.sprite(
          this.player.x + (this.player.flipX ? 14 : -14),
          this.player.y + this.player.displayHeight / 2 - 2,
          "dust-circle"
        );
        const scale = Phaser.Math.FloatBetween(0.38, 0.55) * 1.2; // 20% bigger
        dust.setScale(scale);
        dust.setAlpha(Phaser.Math.FloatBetween(0.44, 0.64));
        dust.setDepth(110);
        this.tweens.add({
          targets: dust,
          alpha: 0,
          y: dust.y + Phaser.Math.Between(4, 10),
          scale: scale * 1.5,
          duration: Phaser.Math.Between(250, 350),
          ease: "Quad.easeOut",
          onComplete: () => dust.destroy(),
        });
      }
    } else {
      this.walkTrailTimer = 40;
    }
  }
}
