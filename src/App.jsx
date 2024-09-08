import { Amplify, generateClient } from "aws-amplify";
import awsExports from "./aws-exports";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { listHighScores } from "./graphql/queries";
import { QRCodeSVG } from "qrcode.react";
import "./App.css"; // Optional: Für eigene Styles

Amplify.configure(awsExports);

function App() {
  const [scores, setScores] = useState([]); // State für die Highscore-Liste
  const [playerId, setPlayerId] = useState(""); // State für die einzigartige Spieler-ID

  // Funktion zum Abrufen der Highscores aus der API
  const fetchScores = async () => {
    try {
      const scoreData = await API.graphql(graphqlOperation(listHighScores));
      const scoreList = scoreData.data.listHighScores.items;
      setScores(scoreList);
    } catch (error) {
      console.error("Fehler beim Abrufen der Highscores:", error);
    }
  };

  // Generiere eine einzigartige Spieler-ID und hole die Highscores beim Laden der Komponente
  useEffect(() => {
    const uniqueId = Math.random().toString(36).substr(2, 9); // Zufällige eindeutige ID
    setPlayerId(uniqueId);
    fetchScores();
  }, []);

  // Definiere die URL, die im QR-Code eingebettet wird
  const playerURL = `https://deine-domain.amplifyapp.com/game?playerId=${playerId}`; // Ersetze mit deiner Amplify-URL

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
        {/* Anzeige des QR-Codes für die eindeutige Spieler-URL */}
        <QRCode value={playerURL} size={256} />
        <p>Scanne diesen QR-Code, um gegen diesen Spieler zu spielen!</p>
      </section>
    </div>
  );
}

export default withAuthenticator(App);
