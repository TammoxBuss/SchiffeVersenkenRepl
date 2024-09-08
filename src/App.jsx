import React, { useState, useEffect, useCallback } from "react";
import { Amplify, generateClient } from "aws-amplify";
import { withAuthenticator } from '@aws-amplify/ui-react';
import awsExports from "./aws-exports";
import { getGame, listHighScores } from "./graphql/queries";
import { createHighScore } from "./graphql/mutations";
import { onMoveMade } from "./graphql/subscriptions";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Lobby from './Lobby';

Amplify.configure(awsExports);

function App() {
  const [gameState, setGameState] = useState({
    playerGrid: createEmptyGrid(),
    opponentGrid: createEmptyGrid(),
    currentShipIndex: 0,
    isGameReady: false,
    gameId: null,
    playerId: Math.random().toString(36).substr(2, 9),
    currentPlayer: null,
    isMyTurn: false,
    winner: "",
    showQRCode: false,
  });

  const [highScores, setHighScores] = useState([]);
  const [activeTab, setActiveTab] = useState("game"); // Tab-Steuerung

  useEffect(() => {
    fetchHighScores();
  }, []);

  useEffect(() => {
    if (gameState.gameId) {
      fetchGame();
      const subscription = API.graphql(
        graphqlOperation(onMoveMade, { gameId: gameState.gameId })
      ).subscribe({
        next: ({ value }) => handleMoveReceived(value.data.onMoveMade),
      });
      return () => subscription.unsubscribe();
    }
  }, [gameState.gameId]);

  const handleMoveReceived = useCallback(
    (move) => {
      const newOpponentGrid = [...gameState.opponentGrid];
      newOpponentGrid[move.row][move.col].hit = true;
      setGameState((prev) => ({ ...prev, opponentGrid: newOpponentGrid, isMyTurn: true }));
    },
    [gameState.opponentGrid]
  );

  const fetchGame = async () => {
    try {
      const gameData = await API.graphql(graphqlOperation(getGame, { id: gameState.gameId }));
      const game = gameData.data.getGame;
      setGameState((prev) => ({
        ...prev,
        currentPlayer: game.currentTurn,
        playerGrid: game.player1Id === gameState.playerId ? JSON.parse(game.player1Grid) : JSON.parse(game.player2Grid),
        opponentGrid: game.player1Id !== gameState.playerId ? JSON.parse(game.player1Grid) : JSON.parse(game.player2Grid),
        winner: game.winner,
      }));
    } catch (error) {
      console.error("Error fetching game data:", error);
    }
  };

  const fetchHighScores = async () => {
    try {
      const highScoreData = await API.graphql(graphqlOperation(listHighScores));
      setHighScores(highScoreData.data.listHighScores.items);
    } catch (error) {
      console.error("Error fetching high scores:", error);
    }
  };

  const saveGame = async () => {
    const gameData = {
      id: gameState.gameId,
      player1Grid: JSON.stringify(gameState.playerGrid),
      player2Grid: JSON.stringify(gameState.opponentGrid),
      currentTurn: gameState.currentPlayer,
      winner: gameState.winner
    };

    try {
      await API.graphql(graphqlOperation(updateGame, { input: gameData }));
      console.log("Game successfully saved");
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  return (
    <div className="App">
      <h1>Schiffe Versenken - Semco-Edition</h1>

      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab("game")}>Spiel</button>
        <button onClick={() => setActiveTab("qr")}>QR-Code</button>
        <button onClick={() => setActiveTab("highscore")}>Highscores</button>
      </div>

      {/* Inhalt basierend auf dem aktiven Tab */}
      {activeTab === "game" && (
        <>
          {!gameState.isGameReady ? (
          <>
            <h2>Platziere deine Schiffe</h2>
            <p>Aktuelles Schiff: Länge {shipsToPlace[gameState.currentShipIndex].length}</p>
            <button onClick={togglePlacementDirection}>
              {isHorizontal ? "Platzierung: Horizontal" : "Platzierung: Vertikal"}
            </button>
            <div className="grid">
              {gameState.playerGrid.map((row, rowIndex) => (
                <div key={rowIndex} className="row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`cell ${cell.hasShip ? "ship" : ""}`}
                      style={{ backgroundColor: cell.hasShip ? cell.color : "lightblue" }}
                      onClick={() => placeShip(rowIndex, colIndex)} // Platzierung basierend auf der Richtung
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </>
          ) : (
            <>
              <h2>{gameState.winner ? `${gameState.winner} hat gewonnen!` : `Zug von: ${gameState.isMyTurn ? "Du" : "Gegner"}`}</h2>
              <section className="grid-section">
                <h2>Dein Spielfeld</h2>
                <div className="grid">
                  {gameState.playerGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                      {row.map((cell, colIndex) => (
                        <div key={colIndex} className={`cell ${cell.hit ? "hit" : ""}`}></div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid-section">
                <h2>Gegnerisches Spielfeld</h2>
                <div className="grid">
                  {gameState.opponentGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                      {row.map((cell, colIndex) => (
                        <div
                          key={colIndex}
                          className={`cell ${cell.hit ? "hit" : ""}`}
                          onClick={() => handleMove(rowIndex, colIndex)}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}

      {activeTab === "qr" && (
        <div>
          <h2>Dein QR-Code:</h2>
          <button onClick={() => setGameState((prev) => ({ ...prev, showQRCode: !gameState.showQRCode }))}>
            {gameState.showQRCode ? "Verstecke QR-Code" : "Zeige QR-Code"}
          </button>
          {gameState.showQRCode && <QRCodeSVG value={`https://main.d3f0agz7jxl6qm.amplifyapp.com/?playerId=${gameState.playerId}`} size={256} />}
        </div>
      )}

      {activeTab === "highscore" && (
        <section className="highscore-section">
          <h2>Highscore Liste</h2>
          <ul>
            {highScores.map((score) => (
              <li key={score.id}>
                {score.username}: {score.score}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function createEmptyGrid() {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({ hit: false, hasShip: false })));
}

const shipsToPlace = [
  { length: 5, placed: false, color: 'blue' },
  { length: 3, placed: false, color: 'green' },
  { length: 2, placed: false, color: 'red' },
];

const placeShip = (row, col) => {
  const newGrid = [...gameState.playerGrid];
  const ship = shipsToPlace[gameState.currentShipIndex];

  // Überprüfen, ob das Schiff auf das Spielfeld passt und kein anderes Schiff da ist
  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal && (col + i >= newGrid[row].length || newGrid[row][col + i].hasShip)) return;
    if (!isHorizontal && (row + i >= newGrid.length || newGrid[row + i][col].hasShip)) return;
  }

  // Platziere das Schiff
  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      newGrid[row][col + i] = { ...newGrid[row][col + i], hasShip: true, color: ship.color };
    } else {
      newGrid[row + i][col] = { ...newGrid[row + i][col], hasShip: true, color: ship.color };
    }
  }

  // Erhöhe den aktuellen Schiffindex, um das nächste Schiff zu platzieren
  const nextShipIndex = gameState.currentShipIndex + 1;
  setGameState((prev) => ({
    ...prev,
    playerGrid: newGrid,
    currentShipIndex: nextShipIndex,
    isGameReady: nextShipIndex >= shipsToPlace.length,
  }));
};


const [isHorizontal, setIsHorizontal] = useState(true); // Steuert die Platzierungsrichtung

const togglePlacementDirection = () => {
  setIsHorizontal((prev) => !prev);
};

export default withAuthenticator(App);
