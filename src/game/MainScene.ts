import Phaser from "phaser";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GROUND_HEIGHT = 40;
const TOP_PLATFORM_HEIGHT = 5;
const PLATFORM_WIDTH = 600;
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
  private livesText!: Phaser.GameObjects.Text;
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
  private debugGraphics!: Phaser.GameObjects.Graphics; // Add debug graphics

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // Background layers
    this.load.image("bg-layer1", "images/bg/MathWizBG/Layer1.png");
    this.load.image("bg-layer2", "images/bg/MathWizBG/Layer2.png");
    this.load.image("bg-layer3", "images/bg/MathWizBG/Layer3.png");

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

    // Wizard sprite sheets
    this.load.spritesheet("wizard-rest", "images/Wizard/wiz-rest-sm.png", {
      frameWidth: 200,
      frameHeight: 150,
    });
    this.load.spritesheet("wizard-hurt", "images/Wizard/wiz-hurt-sm.png", {
      frameWidth: 200,
      frameHeight: 150,
    });
    // Add more wizard animations as needed

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

    // Debug button
    const debugButton = document.createElement("button");
    debugButton.textContent = "Skip to Next Round";
    debugButton.style.position = "fixed";
    debugButton.style.top = "24px";
    debugButton.style.right = "32px";
    debugButton.style.left = "unset";
    debugButton.style.transform = "none";
    debugButton.style.zIndex = "1000";
    debugButton.style.padding = "8px 16px";
    debugButton.style.backgroundColor = "#4CAF50";
    debugButton.style.color = "white";
    debugButton.style.border = "none";
    debugButton.style.borderRadius = "4px";
    debugButton.style.cursor = "pointer";
    debugButton.onclick = () => {
      this.startNewRound();
    };
    document.body.appendChild(debugButton);

    // Background color
    this.cameras.main.setBackgroundColor(0xa0d8ef);

    // Ground platform (player area)
    this.ground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - GROUND_HEIGHT / 2 + 20, // Move down by 20px (half of the extra height)
      GAME_WIDTH + 40, // Extend 20px on each side
      GROUND_HEIGHT + 40, // Extend 40px down
      0x4e342e
    );
    this.physics.add.existing(this.ground, true);

    // Top platform (dropper area)
    this.topPlatform = this.add.rectangle(
      GAME_WIDTH / 2,
      TOP_PLATFORM_HEIGHT / 2 + 20 + 50 + 40, // Lowered by 40px
      PLATFORM_WIDTH,
      TOP_PLATFORM_HEIGHT,
      0x6d4c41
    );
    this.physics.add.existing(this.topPlatform, true);

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
      frames: this.anims.generateFrameNumbers("wizard-rest", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "wizard-hurt",
      frames: this.anims.generateFrameNumbers("wizard-hurt", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: 0,
    });
    // Calculate y so bottom of hitbox is at ground, then raise by 15px
    const playerDisplayHeight = 60;
    const playerHitboxHeight = 70;
    const playerY =
      GAME_HEIGHT -
      GROUND_HEIGHT -
      playerDisplayHeight / 2 -
      (playerHitboxHeight - playerDisplayHeight) / 2 -
      15;
    this.player = this.physics.add.sprite(
      GAME_WIDTH / 2,
      playerY,
      "wizard-rest"
    );
    this.player.displayWidth = 80;
    this.player.displayHeight = playerDisplayHeight;
    this.player.setCollideWorldBounds(true);
    this.player.play("wizard-rest");

    if (this.player.body) {
      const offsetX = this.player.flipX
        ? -PLAYER_HITBOX_OFFSET_X
        : PLAYER_HITBOX_OFFSET_X;
      this.player.body.setSize(100, 110);
      this.player.body.setOffset(offsetX, 0); // Mirror offset if flipped
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      playerBody.setGravityY(500);
      playerBody.setBounce(0.2);
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
      frameRate: 8,
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
      platformTopY - 40,
      "golem-rest"
    );
    this.dropper.setOrigin(0.5, 1); // bottom center
    this.dropper.displayWidth = 80;
    this.dropper.displayHeight = 80;
    this.dropper.setCollideWorldBounds(true);
    this.dropper.play("golem-rest");
    // Set golem body size to match display size and align with origin
    if (this.dropper.body) {
      this.dropper.body.setSize(80, 80);
      this.dropper.body.setOffset(0, 270);
    }

    // Collisions
    this.physics.add.collider(this.player, this.ground);
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
    this.scoreText = this.add.text(32, scoreboardY, "Score: 0", {
      fontSize: "20px",
      color: "#fff",
      fontFamily: "monospace",
    });
    this.livesText = this.add.text(
      32 + spacing,
      scoreboardY,
      "❤️".repeat(this.lives),
      {
        fontSize: "20px",
        fontFamily: "monospace",
      }
    );
    this.roundText = this.add.text(
      32 + spacing * 2,
      scoreboardY,
      "Round: " + this.round,
      {
        fontSize: "20px",
        color: "#fff",
        fontFamily: "monospace",
      }
    );
    this.roundTimerText = this.add.text(
      32 + spacing * 3,
      scoreboardY,
      "Time: 60",
      {
        fontSize: "20px",
        color: "#fff",
        fontFamily: "monospace",
      }
    );
    this.itemsLeftText = this.add.text(
      32 + spacing * 4,
      scoreboardY,
      "Items Left: 0",
      {
        fontSize: "20px",
        color: "#fff",
        fontFamily: "monospace",
      }
    );
    this.gameOverText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        fontSize: "64px",
        color: "#ff0000",
      })
      .setOrigin(0.5)
      .setVisible(false);
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

    // Add debug graphics
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(9999);
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
      return;
    }
    this.lives = LIVES_PER_ROUND;
    this.roundTimer = 0;
    this.updateLivesText();
    this.roundText.setText("Round: " + this.round);
    this.gameOver = false;
    this.gameOverText.setVisible(false);
  }

  private gameOverHandler() {
    this.gameOver = true;
    this.gameOverText.setText("Game Over!\nFinal Score: " + this.score);
    this.gameOverText.setVisible(true);
  }

  init(data: { itemsEarned?: number }) {
    if (data.itemsEarned) {
      this.itemsToDrop = data.itemsEarned * 2; // Double the items for longer rounds
    } else {
      this.itemsToDrop = 20; // Double the default count
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
      const particles = this.add.particles(x, y, "blank", {
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 500,
        quantity: 10,
        tint: 0xffffff,
      });
      // Create score popup
      const scorePopup = this.add
        .text(x, y, "+" + points, {
          fontSize: "24px",
          color: "#fff",
        })
        .setOrigin(0.5);
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
    const particles = this.add.particles(x, y, "blank", {
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: 0xff0000,
    });

    // Create miss text
    const missText = this.add
      .text(x, y, "💔", {
        fontSize: "24px",
        color: "#ff0000",
      })
      .setOrigin(0.5);

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
    this.player.anims.play("wizard-hurt", true);
    this.player.once("animationcomplete-wizard-hurt", () => {
      this.player.anims.play("wizard-rest", true);
    });
  }

  private createHitEffect(x: number, y: number) {
    console.log("Creating hit effect at", x, y); // Debug log
    const hitEffect = this.add.sprite(x, y + 30, "spell-hit"); // Changed from y + 40 to y + 30
    hitEffect.setScale(0.2);
    hitEffect.setDepth(9999);
    hitEffect.setAlpha(1);
    hitEffect.play("spell-hit");
    hitEffect.once("animationcomplete", () => {
      hitEffect.destroy();
    });
  }

  private updateLivesText() {
    this.livesText.setText("❤️".repeat(this.lives));
  }

  update(time: number, delta: number) {
    // Subtle parallax backgrounds based on player x
    if (this.player && this.player.body) {
      this.bg1.tilePositionX = this.player.x * 0.2;
      this.bg2.tilePositionX = this.player.x * 0.1;
      this.bg3.tilePositionX = this.player.x * 0.05;
    }

    if (this.gameOver) {
      // Stop dropper movement and clamp position
      if (this.dropper.body) {
        this.dropper.setVelocityX(0);
        const platformLeft =
          (GAME_WIDTH - PLATFORM_WIDTH) / 2 + DROPPER_WIDTH / 2;
        const platformRight =
          (GAME_WIDTH + PLATFORM_WIDTH) / 2 - DROPPER_WIDTH / 2;
        if (this.dropper.x < platformLeft) this.dropper.x = platformLeft;
        if (this.dropper.x > platformRight) this.dropper.x = platformRight;
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
    this.roundTimerText.setText("Time: " + timeLeft);

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
        }
      }
    }

    // Dropper movement with increasing speed
    const dropperBody = this.dropper.body as Phaser.Physics.Arcade.Body;
    if (dropperBody && !this.isThrowing) {
      const platformLeft =
        (GAME_WIDTH - PLATFORM_WIDTH) / 2 + DROPPER_WIDTH / 2;
      const platformRight =
        (GAME_WIDTH + PLATFORM_WIDTH) / 2 - DROPPER_WIDTH / 2;
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
      if (this.cursors.left.isDown || this.cursors.right.isDown) {
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

        // Wait 0.25s before playing throw animation
        this.time.delayedCall(250, () => {
          this.dropper.anims.play("golem-throw", true);
          this.dropper.once("animationcomplete-golem-throw", () => {
            const itemType = Phaser.Math.RND.pick(
              Object.keys(ITEM_TYPES)
            ) as keyof typeof ITEM_TYPES;
            const item = this.physics.add.sprite(
              this.dropper.x + (this.dropper.flipX ? 20 : -20),
              this.dropper.y + DROPPER_HEIGHT / 2 + ITEM_HEIGHT / 2 - 10,
              itemType === "REQUIRED"
                ? "coin-0"
                : itemType === "BONUS"
                ? "gem-1"
                : "bullet-1"
            );
            if (itemType === "REQUIRED") {
              item.displayWidth = 30;
              item.displayHeight = 30;
              item.play("coin-spin");
            } else if (itemType === "BONUS") {
              item.displayWidth = 30;
              item.displayHeight = 30;
              item.play("gem-sparkle");
            } else {
              // Bullet animation
              item.displayWidth = 30 * (538 / 244); // Target width
              item.displayHeight = 30; // Calculate height based on original aspect ratio
              item.setAngle(90); // Rotate 90 degrees clockwise
              item.play("bullet-spin");
            }
            const itemBody = item.body as Phaser.Physics.Arcade.Body;
            if (itemBody) {
              itemBody.setGravityY(300 * (1 + (this.round - 1) * 0.1));
              itemBody.setAllowGravity(true);
              // Set physics body size to match display size
              if (itemType === "REQUIRED") {
                itemBody.setSize(30, 30);
              } else if (itemType === "BONUS") {
                itemBody.setSize(30, 30);
              } else {
                // For bullets, swap dimensions since we rotate 90 degrees
                itemBody.setSize(30 * (538 / 244), 30);
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

    this.itemsLeftText.setText(
      "Items Left: " + Math.max(0, this.itemsToDrop - this.itemsDropped)
    );

    // Update debug graphics to show hitbox
    if (this.player && this.player.body) {
      this.debugGraphics.clear();
      this.debugGraphics.lineStyle(2, 0xff0000);
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const isJumping = !(body as Phaser.Physics.Arcade.Body).blocked.down;
      if (isJumping) {
        // While jumping, extend hitbox down by 50px
        const offsetX = this.player.flipX
          ? -PLAYER_HITBOX_OFFSET_X
          : PLAYER_HITBOX_OFFSET_X;
        this.debugGraphics.strokeRect(
          this.player.x - body.width / 2 + offsetX,
          this.player.y - body.height / 2 + body.offset.y,
          body.width,
          PLAYER_JUMP_HITBOX_HEIGHT
        );
      } else {
        // On ground, use normal hitbox
        const offsetX = this.player.flipX
          ? -PLAYER_HITBOX_OFFSET_X
          : PLAYER_HITBOX_OFFSET_X;
        this.debugGraphics.strokeRect(
          this.player.x - body.width / 2 + offsetX,
          this.player.y - body.height / 2 + body.offset.y,
          body.width,
          PLAYER_HITBOX_HEIGHT
        );
      }
    }
  }
}
