import React, { useState, useEffect } from "react";
import { Amplify, generateClient } from "aws-amplify";
import awsExports from "./aws-exports";
import { getGame } from "./graphql/queries";
import { makeMove } from "./graphql/mutations";
import { onMoveMade } from "./graphql/subscriptions";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

Amplify.configure(awsExports);

function App() {
  const [playerGrid, setPlayerGrid] = useState(createEmptyGrid());
  const [opponentGrid, setOpponentGrid] = useState(createEmptyGrid());
  const [shipsToPlace, setShipsToPlace] = useState([
    { length: 5, placed: false, color: 'blue' },
    { length: 3, placed: false, color: 'green' },
    { length: 2, placed: false, color: 'red' },
  ]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [winner, setWinner] = useState("");
  const [showQRCode, setShowQRCode] = useState(false); 

  useEffect(() => {
    const uniqueId = Math.random().toString(36).substr(2, 9);
    setPlayerId(uniqueId);

    if (gameId) {
      fetchGame();
      const subscription = API.graphql(
        graphqlOperation(onMoveMade, { gameId })
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

  const fetchGame = async () => {
    try {
      const gameData = await API.graphql(
        graphqlOperation(getGame, { id: gameId })
      );
      const game = gameData.data.getGame;
      setCurrentPlayer(game.currentTurn);
      setPlayerGrid(
        game.player1Id === playerId
          ? JSON.parse(game.player1Grid)
          : JSON.parse(game.player2Grid)
      );
      setOpponentGrid(
        game.player1Id !== playerId
          ? JSON.parse(game.player1Grid)
          : JSON.parse(game.player2Grid)
      );
      setWinner(game.winner);
    } catch (error) {
      console.error("Error fetching game data:", error);
    }
  };

  const placeShip = (row, col, isHorizontal) => {
    const newGrid = [...playerGrid];
    const ship = shipsToPlace[currentShipIndex];

    for (let i = 0; i < ship.length; i++) {
      if (isHorizontal) {
        if (newGrid[row][col + i].hasShip) return;
      } else {
        if (newGrid[row + i][col].hasShip) return;
      }
    }

    for (let i = 0; i < ship.length; i++) {
      if (isHorizontal) {
        newGrid[row][col + i] = { ...newGrid[row][col + i], hasShip: true, color: ship.color };
      } else {
        newGrid[row + i][col] = { ...newGrid[row + i][col], hasShip: true, color: ship.color };
      }
    }

    setPlayerGrid(newGrid);
    setShipsToPlace((prevShips) =>
      prevShips.map((s, index) => (index === currentShipIndex ? { ...s, placed: true } : s))
    );

    if (currentShipIndex < shipsToPlace.length - 1) {
      setCurrentShipIndex(currentShipIndex + 1);
    } else {
      setIsGameReady(true);
    }
  };

  const handleMove = async (row, col) => {
    if (!isMyTurn || opponentGrid[row][col].hit || winner) return;

    const newGrid = [...opponentGrid];
    newGrid[row][col].hit = true;

    try {
      await API.graphql(
        graphqlOperation(makeMove, {
          input: { gameId, playerId, row, col },
        })
      );
      setOpponentGrid(newGrid);
      setIsMyTurn(false);
    } catch (error) {
      console.error("Error making move:", error);
    }
  };

  return (
    <div className="App">
      <h1>Schiffe Versenken - Semco-Edition</h1>

      <button onClick={() => setShowQRCode(!showQRCode)}>
        {showQRCode ? "Verstecke QR-Code" : "Zeige QR-Code"}
      </button>

      {showQRCode && (
        <div>
          <h2>Dein QR-Code:</h2>
          <QRCodeSVG value={`https://your-app-url/game?playerId=${playerId}`} size={256} />
        </div>
      )}

      {!isGameReady ? (
        <>
          <h2>Platziere deine Schiffe</h2>
          <p>Aktuelles Schiff: Länge {shipsToPlace[currentShipIndex].length}</p>
          <div className="grid">
            {playerGrid.map((row, rowIndex) => (
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
          <h2>
            {winner ? `${winner} hat gewonnen!` : `Zug von: ${isMyTurn ? "Du" : "Gegner"}`}
          </h2>
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
        </>
      )}
    </div>
  );
}

function createEmptyGrid() {
  const grid = [];
  for (let i = 0; i < 8; i++) {  // Anpassung auf 8x8
    const row = [];
    for (let j = 0; j < 8; j++) {  // Anpassung auf 8x8
      row.push({ hit: false, hasShip: false });
    }
    grid.push(row);
  }
  return grid;
}

export default App;
