import Phaser from "phaser";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GROUND_HEIGHT = 40;
const TOP_PLATFORM_HEIGHT = 40;
const PLATFORM_WIDTH = 600;
const PLATFORM_X = (GAME_WIDTH - PLATFORM_WIDTH) / 2;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 30;
const PLAYER_COLOR = 0x1976d2;
const PLAYER_SPEED = 200;
const PLAYER_BOOST_MULTIPLIER = 1.5;
const PLAYER_BOOST_DURATION = 1500; // ms
const DROPPER_WIDTH = 40;
const DROPPER_HEIGHT = 40;
const DROPPER_COLOR = 0xff5722;
const DROPPER_MIN_SPEED = 100;
const DROPPER_MAX_SPEED = 300;
const ITEM_WIDTH = 20;
const ITEM_HEIGHT = 20;
const ITEM_COLOR = 0x00ff00;
const BASE_DROP_INTERVAL = 2000; // ms
const LIVES_PER_ROUND = 3;
const ROUND_DURATION = 10000; // 10 seconds per round

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

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // Create a blank texture for our sprites
    this.textures.generate("blank", {
      data: ["1"],
      pixelWidth: 1,
      pixelHeight: 1,
    });
  }

  create() {
    // Debug button
    const debugButton = document.createElement("button");
    debugButton.textContent = "Skip to Next Round";
    debugButton.style.position = "absolute";
    debugButton.style.top = "10px";
    debugButton.style.left = "50%";
    debugButton.style.transform = "translateX(-50%)";
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
      GAME_HEIGHT - GROUND_HEIGHT / 2,
      GAME_WIDTH,
      GROUND_HEIGHT,
      0x4e342e
    );
    this.physics.add.existing(this.ground, true);

    // Top platform (dropper area)
    this.topPlatform = this.add.rectangle(
      GAME_WIDTH / 2,
      TOP_PLATFORM_HEIGHT / 2 + 20 + 50,
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

    // Player (rectangle placeholder)
    this.player = this.physics.add.sprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT / 2,
      "blank"
    );
    this.player.displayWidth = PLAYER_WIDTH;
    this.player.displayHeight = PLAYER_HEIGHT;
    this.player.setTint(PLAYER_COLOR);
    this.player.setCollideWorldBounds(true);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (playerBody) {
      playerBody.setGravityY(600); // Enable gravity for jumping
      playerBody.setAllowGravity(true);
      this.player.setImmovable(false);
    }

    // Dropper (rectangle placeholder)
    const platformCenterY = TOP_PLATFORM_HEIGHT / 2 + 20 + 50;
    const platformTopY = platformCenterY - TOP_PLATFORM_HEIGHT / 2;
    const dropperY = platformTopY - DROPPER_HEIGHT / 2;
    this.dropper = this.physics.add.sprite(GAME_WIDTH / 2, dropperY, "blank");
    this.dropper.displayWidth = DROPPER_WIDTH;
    this.dropper.displayHeight = DROPPER_HEIGHT;
    this.dropper.setTint(DROPPER_COLOR);
    this.dropper.setCollideWorldBounds(true);
    const dropperBody = this.dropper.body as Phaser.Physics.Arcade.Body;
    if (dropperBody) {
      dropperBody.setGravityY(0);
      dropperBody.setAllowGravity(false);
      this.dropper.setImmovable(false);
    }

    // Collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.leftWall);
    this.physics.add.collider(this.player, this.rightWall);
    this.physics.add.collider(this.dropper, this.topPlatform);
    this.physics.add.collider(this.dropper, this.leftWall);
    this.physics.add.collider(this.dropper, this.rightWall);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.boostKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    // Initialize dropper speed
    this.dropperSpeed = Phaser.Math.Between(
      DROPPER_MIN_SPEED,
      DROPPER_MAX_SPEED
    );

    // UI Elements
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "18px",
      color: "#000",
    });
    this.livesText = this.add.text(16, 48, "Lives: " + this.lives, {
      fontSize: "18px",
      color: "#000",
    });
    this.roundText = this.add.text(
      GAME_WIDTH - 200,
      16,
      "Round: " + this.round,
      {
        fontSize: "18px",
        color: "#000",
      }
    );
    this.roundTimerText = this.add.text(GAME_WIDTH - 200, 48, "Time: 30", {
      fontSize: "18px",
      color: "#000",
    });
    this.gameOverText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        fontSize: "64px",
        color: "#ff0000",
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.itemsLeftText = this.add.text(GAME_WIDTH - 200, 80, "Items Left: 0", {
      fontSize: "18px",
      color: "#000",
    });
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
    this.countdownText.setText(this.countdown.toString());
    this.countdownText.setVisible(true);
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdown--;
        if (this.countdown > 0) {
          this.countdownText.setText(this.countdown.toString());
        } else {
          this.countdownText.setText("GO!");
          this.time.delayedCall(700, () => {
            this.countdownText.setVisible(false);
            this.countdownActive = false;
          });
        }
      },
    });
  }

  private startNewRound() {
    this.round++;
    if (this.round > this.maxRounds) {
      this.gameOver = true;
      this.gameOverText.setText("Victory!\nFinal Score: " + this.score);
      this.gameOverText.setVisible(true);
      return;
    }
    this.lives = LIVES_PER_ROUND;
    this.roundTimer = 0;
    this.livesText.setText("Lives: " + this.lives);
    this.roundText.setText("Round: " + this.round);
    this.gameOver = false;
    this.gameOverText.setVisible(false);
    this.scene.start("TypingScene");
  }

  private gameOverHandler() {
    this.gameOver = true;
    this.gameOverText.setText("Game Over!\nFinal Score: " + this.score);
    this.gameOverText.setVisible(true);
  }

  init(data: { itemsEarned?: number }) {
    if (data.itemsEarned) {
      // Add bonus items based on typing performance
      for (let i = 0; i < data.itemsEarned; i++) {
        const item = this.physics.add.sprite(
          this.dropper.x,
          this.dropper.y + DROPPER_HEIGHT / 2 + ITEM_HEIGHT / 2,
          "blank"
        );
        item.displayWidth = ITEM_WIDTH;
        item.displayHeight = ITEM_HEIGHT;
        item.setTint(ITEM_TYPES.BONUS.color);
        const itemBody = item.body as Phaser.Physics.Arcade.Body;
        if (itemBody) {
          itemBody.setGravityY(300 * (1 + (this.round - 1) * 0.1));
          itemBody.setAllowGravity(true);
        }
        this.physics.add.collider(item, this.ground, () => {
          item.destroy();
        });
        this.physics.add.overlap(item, this.player, () => {
          this.score += ITEM_TYPES.BONUS.points;
          this.scoreText.setText("Score: " + this.score);
          item.destroy();
        });
      }
    }
  }

  private addEarnedItems(count: number) {
    for (let i = 0; i < count; i++) {
      const item = this.physics.add.sprite(
        this.dropper.x +
          Phaser.Math.Between(-DROPPER_WIDTH / 3, DROPPER_WIDTH / 3),
        this.dropper.y - DROPPER_HEIGHT / 2 - ITEM_HEIGHT / 2 - 100,
        "blank"
      );
      item.displayWidth = ITEM_WIDTH;
      item.displayHeight = ITEM_HEIGHT;
      item.setTint(ITEM_COLOR);
      const itemBody = item.body as Phaser.Physics.Arcade.Body;
      if (itemBody) {
        itemBody.setBounce(0.3);
        itemBody.setFriction(0.8);
        itemBody.setGravityY(500);
        itemBody.setVelocityY(100);
        itemBody.setAngularVelocity(Phaser.Math.Between(-100, 100));
      }
      this.earnedItems.push(item);
      this.physics.add.collider(item, this.dropper);
      this.physics.add.collider(item, this.earnedItems);
    }
  }

  private createCatchEffect(x: number, y: number, points: number) {
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
      .text(x, y, "MISS!", {
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

  update(time: number, delta: number) {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.boostKey)) {
        this.scene.restart();
      }
      return;
    }

    // Pause all gameplay during countdown
    if (this.countdownActive) {
      return;
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

    // Movement with animation
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

    // Dropper movement with increasing speed
    const dropperBody = this.dropper.body as Phaser.Physics.Arcade.Body;
    if (dropperBody) {
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

    // Item drop logic with decreasing interval
    this.dropTimer += delta;
    const currentDropInterval =
      BASE_DROP_INTERVAL * Math.max(0.5, 1 - (this.round - 1) * 0.1);
    if (this.dropTimer >= currentDropInterval) {
      this.dropTimer = 0;
      const itemType = Phaser.Math.RND.pick(
        Object.keys(ITEM_TYPES)
      ) as keyof typeof ITEM_TYPES;
      const item = this.physics.add.sprite(
        this.dropper.x,
        this.dropper.y + DROPPER_HEIGHT / 2 + ITEM_HEIGHT / 2,
        "blank"
      );
      item.displayWidth = ITEM_WIDTH;
      item.displayHeight = ITEM_HEIGHT;
      item.setTint(ITEM_TYPES[itemType].color);
      const itemBody = item.body as Phaser.Physics.Arcade.Body;
      if (itemBody) {
        itemBody.setGravityY(300 * (1 + (this.round - 1) * 0.1));
        itemBody.setAllowGravity(true);
      }
      this.physics.add.collider(item, this.ground, () => {
        if (itemType === "REQUIRED") {
          this.lives--;
          this.livesText.setText("Lives: " + this.lives);
          this.createMissEffect(item.x, item.y);
          if (this.lives <= 0) {
            this.gameOverHandler();
          }
        }
        item.destroy();
      });
      this.physics.add.overlap(item, this.player, () => {
        this.score += ITEM_TYPES[itemType].points;
        this.scoreText.setText("Score: " + this.score);
        this.createCatchEffect(item.x, item.y, ITEM_TYPES[itemType].points);
        item.destroy();
      });
    }

    this.itemsLeftText.setText(
      "Items Left: " + Math.max(0, this.itemsToDrop - this.itemsDropped)
    );
  }
}
