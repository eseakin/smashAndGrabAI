import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Phaser from "phaser";
import { GAME_CONFIG } from "./game/config";

function App() {
  return <div id="phaser-root" className="phaser-centerer"></div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// Mount Phaser to the wrapper div
new Phaser.Game({ ...GAME_CONFIG, parent: "phaser-root" });
