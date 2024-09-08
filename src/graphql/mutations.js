/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createHighScore = /* GraphQL */ `
  mutation CreateHighScore(
    $input: CreateHighScoreInput!
    $condition: ModelHighScoreConditionInput
  ) {
    createHighScore(input: $input, condition: $condition) {
      id
      username
      score
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateHighScore = /* GraphQL */ `
  mutation UpdateHighScore(
    $input: UpdateHighScoreInput!
    $condition: ModelHighScoreConditionInput
  ) {
    updateHighScore(input: $input, condition: $condition) {
      id
      username
      score
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteHighScore = /* GraphQL */ `
  mutation DeleteHighScore(
    $input: DeleteHighScoreInput!
    $condition: ModelHighScoreConditionInput
  ) {
    deleteHighScore(input: $input, condition: $condition) {
      id
      username
      score
      createdAt
      updatedAt
      __typename
    }
  }
`;
