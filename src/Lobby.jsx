import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify';
import { listGames, createGame } from './graphql/queries';

function Lobby() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const gameData = await API.graphql(graphqlOperation(listGames));
      setGames(gameData.data.listGames.items);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const joinGame = async (gameId) => {
    console.log(`Beitreten zu Spiel: ${gameId}`);
    // Füge hier den Code hinzu, um einem Spiel beizutreten
  };

  const startNewGame = async () => {
    try {
      const newGame = await API.graphql(graphqlOperation(createGame, { input: { player1Id: Math.random().toString(36).substr(2, 9) }}));
      console.log("Neues Spiel erstellt", newGame);
    } catch (error) {
      console.error('Error starting new game:', error);
    }
  };

  return (
    <div>
      <h2>Lobby</h2>
      <button onClick={startNewGame}>Neues Spiel starten</button>
      <ul>
        {games.map((game) => (
          <li key={game.id}>
            {game.player1Id} wartet auf einen Gegner
            <button onClick={() => joinGame(game.id)}>Spiel beitreten</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Lobby;
