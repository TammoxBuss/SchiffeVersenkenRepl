/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getHighScore = /* GraphQL */ `
  query GetHighScore($id: ID!) {
    getHighScore(id: $id) {
      id
      username
      score
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listHighScores = /* GraphQL */ `
  query ListHighScores(
    $filter: ModelHighScoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHighScores(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        username
        score
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;

export const getGame = /* GraphQL */ `
  query GetGame($id: ID!) {
    getGame(id: $id) {
      id
      player1Id
      player2Id
      player1Grid
      player2Grid
      currentTurn
      winner
    }
  }
`;

// Example of queries and mutations

export const listGames = /* GraphQL */ `
  query ListGames {
    listGames {
      items {
        id
        player1Id
        player2Id
        currentTurn
        winner
      }
    }
  }
`;

export const createGame = /* GraphQL */ `
  mutation CreateGame($input: CreateGameInput!) {
    createGame(input: $input) {
      id
      player1Id
      player2Id
      currentTurn
      winner
    }
  }
`;


