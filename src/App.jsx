import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Amplify, generateClient } from "aws-amplify";
import awsExports from "./aws-exports";
import { getGame, listHighScores } from "./graphql/queries";
import { createHighScore } from "./graphql/mutations";
import { onMoveMade } from "./graphql/subscriptions";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

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

  const placeShip = (row, col, isHorizontal) => {
    const newGrid = [...gameState.playerGrid];
    const ship = shipsToPlace[gameState.currentShipIndex];

    for (let i = 0; i < ship.length; i++) {
      if (isHorizontal && newGrid[row][col + i].hasShip) return;
      if (!isHorizontal && newGrid[row + i][col].hasShip) return;
    }

    for (let i = 0; i < ship.length; i++) {
      if (isHorizontal) {
        newGrid[row][col + i] = { ...newGrid[row][col + i], hasShip: true, color: ship.color };
      } else {
        newGrid[row + i][col] = { ...newGrid[row + i][col], hasShip: true, color: ship.color };
      }
    }

    const nextShipIndex = gameState.currentShipIndex + 1;
    setGameState((prev) => ({
      ...prev,
      playerGrid: newGrid,
      currentShipIndex: nextShipIndex,
      isGameReady: nextShipIndex >= shipsToPlace.length,
    }));
  };

  const handleMove = async (row, col) => {
    if (!gameState.isMyTurn || gameState.opponentGrid[row][col].hit || gameState.winner) return;

    const newGrid = [...gameState.opponentGrid];
    newGrid[row][col].hit = true;

    try {
      await API.graphql(graphqlOperation(makeMove, { input: { gameId: gameState.gameId, playerId: gameState.playerId, row, col } }));
      setGameState((prev) => ({ ...prev, opponentGrid: newGrid, isMyTurn: false }));
    } catch (error) {
      console.error("Error making move:", error);
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

  const submitHighScore = async (username, score) => {
    try {
      await API.graphql(graphqlOperation(createHighScore, { input: { username, score } }));
      fetchHighScores(); // Update high scores after submission
    } catch (error) {
      console.error("Error submitting high score:", error);
    }
  };

  return (
    <div className="App">
      <h1>Schiffe Versenken - Semco-Edition</h1>

      <button onClick={() => setGameState((prev) => ({ ...prev, showQRCode: !gameState.showQRCode }))}>
        {gameState.showQRCode ? "Verstecke QR-Code" : "Zeige QR-Code"}
      </button>

      {gameState.showQRCode && (
        <div>
          <h2>Dein QR-Code:</h2>
          <QRCodeSVG value={`https://main.d3f0agz7jxl6qm.amplifyapp.com/?playerId=${gameState.playerId}`} size={256} />
        </div>
      )}

      {!gameState.isGameReady ? (
        <>
          <h2>Platziere deine Schiffe</h2>
          <p>Aktuelles Schiff: Länge {shipsToPlace[gameState.currentShipIndex].length}</p>
          <div className="grid">
            {gameState.playerGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="row">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`cell ${cell.hasShip ? "ship" : ""}`}
                    style={{ backgroundColor: cell.hasShip ? cell.color : "lightblue" }}
                    onClick={() => placeShip(rowIndex, colIndex, true)}
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

export default App;
