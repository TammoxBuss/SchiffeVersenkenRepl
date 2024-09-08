import { Amplify, generateClient } from "aws-amplify";
import awsExports from "./aws-exports.js";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { listHighScores } from "./graphql/queries";
import { QRCodeSVG } from "qrcode.react";
import React, { useState, useEffect } from 'react';
import './App.css'; // Für Styles

Amplify.configure(awsExports);

function App() {
  const [scores, setScores] = useState([]); // Highscore-Liste
  const [playerId, setPlayerId] = useState(''); // Einzigartige Spieler-ID

  // Funktion zum Abrufen der Highscores
  const fetchScores = async () => {
    try {
      const scoreData = await API.graphql(graphqlOperation(listHighScores));
      const scoreList = scoreData.data.listHighScores.items;
      setScores(scoreList);
    } catch (error) {
      console.error("Fehler beim Abrufen der Highscores:", error);
    }
  };

  // Spielfeld erstellen (10x10-Grid)
  const createEmptyGrid = () => {
    const grid = [];
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        row.push({ hit: false, hasShip: false });
      }
      grid.push(row);
    }
    return grid;
  };

  const [grid, setGrid] = useState(createEmptyGrid());

  // Initialisiere Spieler-ID und hole Highscores
  useEffect(() => {
    const uniqueId = Math.random().toString(36).substr(2, 9);
    setPlayerId(uniqueId);
    fetchScores();
  }, []);

  const playerURL = `https://deine-domain.amplifyapp.com/game?playerId=${playerId}`;

  return (
    <div className="App">
      <header>
        <h1>Schiffe Versenken - Piraten-Edition</h1>
        <p>Bereit für ein 1vs1-Spiel?</p>
      </header>

      <section className="highscores">
        <h2>Highscore Liste</h2>
        <ul>
          {scores.map((score) => (
            <li key={score.id}>
              {score.username}: {score.score} Punkte
            </li>
          ))}
        </ul>
      </section>

      <section className="qr-code-section">
        <h2>Dein QR-Code:</h2>
        <QRCodeSVG value={playerURL} size={256} />
        <p>Scanne diesen QR-Code, um gegen diesen Spieler zu spielen!</p>
      </section>

      <section className="grid-section">
        <h2>Schiffe Versenken Spielfeld</h2>
        <div className="grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className={`cell ${cell.hit ? 'hit' : ''}`}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default withAuthenticator(App);
