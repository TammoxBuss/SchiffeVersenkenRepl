import React, { useState, useEffect } from "react";
import { Amplify, generateClient } from "aws-amplify";
import awsExports from "./aws-exports";
import { getGame } from "./graphql/queries";
import { makeMove } from "./graphql/mutations";
import { onMoveMade } from "./graphql/subscriptions";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

function App() {
  const [playerGrid, setPlayerGrid] = useState(createEmptyGrid());
  const [opponentGrid, setOpponentGrid] = useState(createEmptyGrid());
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [winner, setWinner] = useState("");

  useEffect(() => {
    // Initialize playerId and game setup
    const uniqueId = Math.random().toString(36).substr(2, 9);
    setPlayerId(uniqueId);

    // Fetch game data
    const fetchGame = async () => {
      try {
        const gameData = await API.graphql(
          graphqlOperation(getGame, { id: gameId }),
        );
        const game = gameData.data.getGame;
        setCurrentPlayer(game.currentTurn);
        setPlayerGrid(
          game.player1Id === playerId
            ? JSON.parse(game.player1Grid)
            : JSON.parse(game.player2Grid),
        );
        setOpponentGrid(
          game.player1Id !== playerId
            ? JSON.parse(game.player1Grid)
            : JSON.parse(game.player2Grid),
        );
        setWinner(game.winner);
      } catch (error) {
        console.error("Error fetching game data:", error);
      }
    };

    if (gameId) {
      fetchGame();

      // Subscribe to opponent moves
      const subscription = API.graphql(
        graphqlOperation(onMoveMade, { gameId }),
      ).subscribe({
        next: (moveData) => {
          const move = moveData.value.data.onMoveMade;
          const newGrid = [...opponentGrid];
          newGrid[move.row][move.col].hit = true;
          setOpponentGrid(newGrid);
          setIsMyTurn(true);
        },
      });

      return () => subscription.unsubscribe();
    }
  }, [gameId, playerId]);

  const handleMove = async (row, col) => {
    if (!isMyTurn || opponentGrid[row][col].hit || winner) return;

    const newGrid = [...opponentGrid];
    newGrid[row][col].hit = true;

    // Send move to the server
    try {
      await API.graphql(
        graphqlOperation(makeMove, {
          input: { gameId, playerId, row, col },
        }),
      );
      setOpponentGrid(newGrid);
      setIsMyTurn(false);
    } catch (error) {
      console.error("Error making move:", error);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Schiffe Versenken - Semco-Edition</h1>
        <h2>
          {winner
            ? `${winner} hat gewonnen!`
            : `Zug von: ${isMyTurn ? "Du" : "Gegner"}`}
        </h2>
      </header>

      <section className="grid-section">
        <h2>Dein Spielfeld</h2>
        <div className="grid">
          {playerGrid.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className={`cell ${cell.hit ? "hit" : ""}`}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="grid-section">
        <h2>Gegnerisches Spielfeld</h2>
        <div className="grid">
          {opponentGrid.map((row, rowIndex) => (
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
    </div>
  );
}

function createEmptyGrid() {
  const grid = [];
  for (let i = 0; i < 10; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push({ hit: false, hasShip: false });
    }
    grid.push(row);
  }
  return grid;
}

export default App;
