import React, { useState, useEffect } from "react";
import { Amplify, generateClient } from "aws-amplify";
import awsExports from "./aws-exports";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

Amplify.configure(awsExports);

function App() {
  const [player1Grid, setPlayer1Grid] = useState(createEmptyGrid());
  const [player2Grid, setPlayer2Grid] = useState(createEmptyGrid());
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [player1Points, setPlayer1Points] = useState(0);
  const [player2Points, setPlayer2Points] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");

  // Funktion für das leere Spielfeld
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

  // Zufälliges Platzieren von Schiffen
  const placeShipsRandomly = (grid) => {
    const ships = [
      { length: 5, placed: false },
      { length: 3, placed: false },
      { length: 2, placed: false },
    ];

    const placeShip = (grid, shipLength) => {
      const newGrid = [...grid];
      let placed = false;

      while (!placed) {
        const horizontal = Math.random() < 0.5;
        const row = Math.floor(
          Math.random() * (horizontal ? 10 : 10 - shipLength),
        );
        const col = Math.floor(
          Math.random() * (horizontal ? 10 - shipLength : 10),
        );

        let canPlace = true;

        for (let i = 0; i < shipLength; i++) {
          if (horizontal && newGrid[row][col + i].hasShip) {
            canPlace = false;
            break;
          } else if (!horizontal && newGrid[row + i][col].hasShip) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < shipLength; i++) {
            if (horizontal) {
              newGrid[row][col + i].hasShip = true;
            } else {
              newGrid[row + i][col].hasShip = true;
            }
          }
          placed = true;
        }
      }

      return newGrid;
    };

    let updatedGrid = grid;
    ships.forEach((ship) => {
      updatedGrid = placeShip(updatedGrid, ship.length);
    });

    return updatedGrid;
  };

  useEffect(() => {
    setPlayer1Grid(placeShipsRandomly(createEmptyGrid()));
    setPlayer2Grid(placeShipsRandomly(createEmptyGrid()));
  }, []);

  // Treffer- und Versenkt-Logik
  const checkIfSunk = (grid, row, col) => {
    const newGrid = [...grid];
    let isSunk = true;

    const horizontal =
      (col > 0 && newGrid[row][col - 1].hasShip) ||
      (col < 9 && newGrid[row][col + 1].hasShip);
    if (horizontal) {
      let i = col;
      while (i >= 0 && newGrid[row][i].hasShip) {
        if (!newGrid[row][i].hit) isSunk = false;
        i--;
      }
      i = col;
      while (i < 10 && newGrid[row][i].hasShip) {
        if (!newGrid[row][i].hit) isSunk = false;
        i++;
      }
    } else {
      let i = row;
      while (i >= 0 && newGrid[i][col].hasShip) {
        if (!newGrid[i][col].hit) isSunk = false;
        i--;
      }
      i = row;
      while (i < 10 && newGrid[i][col].hasShip) {
        if (!newGrid[i][col].hit) isSunk = false;
        i++;
      }
    }

    return isSunk;
  };

  const handleCellClick = (row, col) => {
    if (gameOver) return;

    let newGrid, setGrid, opponentGrid, setPoints;

    if (currentPlayer === 1) {
      newGrid = [...player2Grid];
      setGrid = setPlayer2Grid;
      opponentGrid = player1Grid;
      setPoints = setPlayer1Points;
    } else {
      newGrid = [...player1Grid];
      setGrid = setPlayer1Grid;
      opponentGrid = player2Grid;
      setPoints = setPlayer2Points;
    }

    if (!newGrid[row][col].hit) {
      newGrid[row][col].hit = true;
      setGrid(newGrid);

      if (newGrid[row][col].hasShip && checkIfSunk(newGrid, row, col)) {
        alert("Schiff versenkt!");
        setPoints((points) => points + 1);
      }

      if (checkGameOver(opponentGrid)) {
        setWinner(`Spieler ${currentPlayer} hat gewonnen!`);
        setGameOver(true);
      } else {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
    }
  };

  const checkGameOver = (grid) => {
    return grid.every((row) => row.every((cell) => !cell.hasShip || cell.hit));
  };

  return (
    <div className="App">
      <header>
        <h1>Schiffe Versenken - Piraten-Edition</h1>
        <h2>{gameOver ? winner : `Spieler ${currentPlayer} ist am Zug`}</h2>
        <h3>
          Punkte - Spieler 1: {player1Points} | Spieler 2: {player2Points}
        </h3>
      </header>

      <section className="game-section">
        <div className="grid-section">
          <h2>
            Spieler {currentPlayer === 1 ? "2" : "1"} - Schieße auf das
            Spielfeld
          </h2>
          <div className="grid">
            {(currentPlayer === 1 ? player2Grid : player1Grid).map(
              (row, rowIndex) => (
                <div key={rowIndex} className="row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`cell ${cell.hit ? "hit" : ""}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    ></div>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default withAuthenticator(App);
