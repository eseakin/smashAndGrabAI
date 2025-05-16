import Phaser from "phaser";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TYPING_SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "How vexingly quick daft zebras jump!",
  "Sphinx of black quartz, judge my vow.",
  "Crazy Fredrick bought many very exquisite opal jewels.",
];

const ITEM_WIDTH = 20;
const ITEM_HEIGHT = 20;
const PLATE_WIDTH = 200;
const PLATE_HEIGHT = 20;
const PLATE_COLOR = 0x8b4513;
const ITEM_COLOR = 0xff00ff;

export class TypingScene extends Phaser.Scene {
  private sentenceText!: Phaser.GameObjects.Text;
  private inputText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private currentSentence = "";
  private currentInput = "";
  private currentSentenceText!: Phaser.GameObjects.Text;
  private currentInputText!: Phaser.GameObjects.Text;
  private timer = 0;
  private countdown = 3;
  private isTyping = false;
  private itemsEarned = 0;
  private itemsEarnedText!: Phaser.GameObjects.Text;
  private plate!: Phaser.GameObjects.Rectangle;
  private earnedItems: Phaser.Physics.Arcade.Sprite[] = [];
  private currentCharIndex = 0;
  private correctText!: Phaser.GameObjects.Text;
  private incorrectText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "TypingScene" });
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
    debugButton.textContent = "Complete Sentence";
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
      this.itemsEarned += 2;
      this.addEarnedItems(2);
      this.currentSentence = Phaser.Math.RND.pick(TYPING_SENTENCES);
      this.currentInput = "";
      this.sentenceText.setText(this.currentSentence);
      this.inputText.setText("");
    };
    document.body.appendChild(debugButton);

    // Background
    this.cameras.main.setBackgroundColor(0x2c3e50);

    // Title
    this.add
      .text(GAME_WIDTH / 2, 100, "Type the sentence:", {
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(0.5);

    // Sentence to type
    this.currentSentence = Phaser.Math.RND.pick(TYPING_SENTENCES);
    this.sentenceText = this.add
      .text(GAME_WIDTH / 2, 200, "", {
        fontSize: "24px",
        color: "#fff",
        wordWrap: { width: GAME_WIDTH - 100 },
        fontFamily: "monospace",
        align: "center",
      })
      .setOrigin(0.5);

    // Input text
    this.inputText = this.add
      .text(GAME_WIDTH / 2, 300, "", {
        fontSize: "24px",
        color: "#0f0",
        wordWrap: { width: GAME_WIDTH - 100 },
      })
      .setOrigin(0.5);

    // Timer
    this.timerText = this.add
      .text(GAME_WIDTH / 2, 400, "Time: 30", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5);

    // Plate
    this.plate = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 100,
      PLATE_WIDTH,
      PLATE_HEIGHT,
      PLATE_COLOR
    );
    this.physics.add.existing(this.plate, true);

    // Start typing
    this.input.keyboard.on("keydown", (event: KeyboardEvent) => {
      if (!this.isTyping) {
        this.isTyping = true;
        this.timer = 10; // 10 seconds to type
      }

      if (event.key === "Backspace") {
        this.currentInput = this.currentInput.slice(0, -1);
        this.currentCharIndex = Math.max(0, this.currentCharIndex - 1);
      } else if (event.key.length === 1) {
        this.currentInput += event.key;
        this.currentCharIndex++;
      }

      this.inputText.setText(this.currentInput);

      // Check if sentence is complete
      if (this.currentInput === this.currentSentence) {
        this.itemsEarned += 2;
        this.addEarnedItems(2);
        this.currentSentence = Phaser.Math.RND.pick(TYPING_SENTENCES);
        this.currentInput = "";
        this.sentenceText.setText(this.currentSentence);
        this.inputText.setText("");
      }
    });

    this.correctText = this.add
      .text(GAME_WIDTH / 2, 200, "", {
        fontSize: "24px",
        color: "#00ff00",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5);
    this.incorrectText = this.add
      .text(GAME_WIDTH / 2, 200, "", {
        fontSize: "24px",
        color: "#ff0000",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5);
    this.remainingText = this.add
      .text(GAME_WIDTH / 2, 200, "", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5);
    this.sentenceText.setVisible(false); // Hide the old sentenceText
  }

  private addEarnedItems(count: number) {
    for (let i = 0; i < count; i++) {
      const item = this.physics.add.sprite(
        this.plate.x + Phaser.Math.Between(-PLATE_WIDTH / 3, PLATE_WIDTH / 3),
        this.plate.y - PLATE_HEIGHT / 2 - ITEM_HEIGHT / 2 - 100, // Start higher up
        "blank"
      );
      item.displayWidth = ITEM_WIDTH;
      item.displayHeight = ITEM_HEIGHT;
      item.setTint(ITEM_COLOR);
      const itemBody = item.body as Phaser.Physics.Arcade.Body;
      if (itemBody) {
        itemBody.setBounce(0.3);
        itemBody.setFriction(0.8);
        itemBody.setGravityY(500); // Increased gravity
        itemBody.setVelocityY(100); // Initial downward velocity
        itemBody.setAngularVelocity(Phaser.Math.Between(-100, 100)); // Add some spin
      }
      this.earnedItems.push(item);
      this.physics.add.collider(item, this.plate);
      this.physics.add.collider(item, this.earnedItems);
    }
  }

  update(time: number, delta: number) {
    if (this.isTyping) {
      this.timer -= delta / 1000;
      this.timerText.setText("Time: " + Math.ceil(this.timer));

      if (this.timer <= 0) {
        this.isTyping = false;
        this.startCountdown();
      }
    }

    // Build the three segments:
    let correct = "";
    let incorrect = "";
    let hasError = false;
    for (let i = 0; i < this.currentInput.length; i++) {
      if (i < this.currentSentence.length) {
        if (!hasError && this.currentInput[i] === this.currentSentence[i]) {
          correct += this.currentSentence[i];
        } else {
          hasError = true;
          // Show the actual input character (including mistyped spaces)
          incorrect += this.currentInput[i];
        }
      } else {
        // Extra input beyond the prompt
        hasError = true;
        incorrect += this.currentInput[i];
      }
    }
    const remaining = this.currentSentence.slice(this.currentInput.length);
    this.correctText.setText(correct);
    this.incorrectText.setText(incorrect);
    this.remainingText.setText(remaining);
    // Position the segments in sequence, centered as a whole
    const totalWidth =
      this.correctText.width +
      this.incorrectText.width +
      this.remainingText.width;
    let x = (GAME_WIDTH - totalWidth) / 2;
    this.correctText.setX(x);
    x += this.correctText.width;
    this.incorrectText.setX(x);
    x += this.incorrectText.width;
    this.remainingText.setX(x);

    // Check for sentence completion
    if (this.currentInput === this.currentSentence) {
      this.itemsEarned += 2;
      this.itemsEarnedText.setText("Items Earned: " + this.itemsEarned);
      this.addEarnedItems(2);
      this.currentSentence = Phaser.Math.RND.pick(TYPING_SENTENCES);
      this.currentInput = "";
      this.currentCharIndex = 0;
    }
  }

  private startCountdown() {
    this.timerText.setText("Next round in: " + this.countdown);
    const countdownInterval = setInterval(() => {
      this.countdown--;
      this.timerText.setText("Next round in: " + this.countdown);
      if (this.countdown <= 0) {
        clearInterval(countdownInterval);
        this.scene.start("MainScene", { itemsEarned: this.itemsEarned });
      }
    }, 1000);
  }
}
