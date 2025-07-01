import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
// Import the word database
import frenchWordsData from './frenchWords.json';

// Helper function to shuffle an array
const shuffleArray = (array) => {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const App = () => {
  // State for the current word object
  const [currentWord, setCurrentWord] = useState(null);
  // State for the score
  const [score, setScore] = useState(0);
  // State to hold the 4 definition choices
  const [definitions, setDefinitions] = useState([]);
  // State to track the selected answer and whether the round is answered
  const [answered, setAnswered] = useState(false);
  // State to track the index of the selected definition
  const [selectedDefinitionIndex, setSelectedDefinitionIndex] = useState(null);


  // Function to get a random word from the database
  const getRandomWord = (excludeWord = null) => {
    let newWord;
    do {
      newWord = frenchWordsData[Math.floor(Math.random() * frenchWordsData.length)];
    } while (excludeWord && newWord.word === excludeWord.word);
    return newWord;
  };

  // Function to set up a new round
  const setupNewRound = () => {
    setAnswered(false);
    setSelectedDefinitionIndex(null);
    const newWord = getRandomWord(currentWord);
    setCurrentWord(newWord);

    // Get 3 random wrong definitions
    const wrongDefinitions = [];
    while (wrongDefinitions.length < 3) {
      const randomWord = getRandomWord(newWord);
      if (randomWord.definition !== newWord.definition) {
        wrongDefinitions.push(randomWord.definition);
      }
    }

    // Combine correct and wrong definitions and shuffle them
    const allDefinitions = shuffleArray([newWord.definition, ...wrongDefinitions]);
    setDefinitions(allDefinitions);
  };

  // Initialize the first round
  useEffect(() => {
    setupNewRound();
  }, []);


  // Handle when a user selects a definition
  const handleDefinitionPress = (definition, index) => {
    if (answered) return; // Prevent changing answer

    setAnswered(true);
    setSelectedDefinitionIndex(index);

    if (definition === currentWord.definition) {
      setScore(prevScore => prevScore + 1);
    }
  };

  // Function to get the style for a definition button based on the state
  const getDefinitionStyle = (definition, index) => {
    if (!answered) {
      return styles.definitionButton;
    }
    if (definition === currentWord.definition) {
      return [styles.definitionButton, styles.correctAnswer];
    }
    if (index === selectedDefinitionIndex) {
      return [styles.definitionButton, styles.incorrectAnswer];
    }
    return styles.definitionButton;
  };

  if (!currentWord) {
    // Render a loading state or null while the first word is being set up
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Mots Rares</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.wordContainer}>
          <Text style={styles.word}>{currentWord.word}</Text>
          <Text style={styles.category}>{currentWord.category}</Text>
        </View>

        <View style={styles.definitionsContainer}>
          {definitions.map((definition, index) => (
            <TouchableOpacity
              key={index}
              style={getDefinitionStyle(definition, index)}
              onPress={() => handleDefinitionPress(definition, index)}
              disabled={answered}
            >
              <Text style={styles.definitionText}>{definition}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={setupNewRound}>
          <Text style={styles.buttonText}>Nouveau Mot</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreContainer: {
    backgroundColor: '#e67e22',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  wordContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  category: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 5,
  },
  definitionsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  definitionButton: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  definitionText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  correctAnswer: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  incorrectAnswer: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  button: {
    backgroundColor: '#e67e22',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default App;