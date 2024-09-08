import React from 'react';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import awsExports from './aws-exports';
Amplify.configure(awsExports);

function App() {
  return (
    <div className="App">
      <h1>Willkommen zu Schiffe Versenken - Semco-Piraten-Edition!</h1>
      <p>Bereit für ein Spiel?</p>
    </div>
  );
}







export default withAuthenticator(App);
