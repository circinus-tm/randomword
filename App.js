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
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
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
  // State to track if the current question has been answered
  const [answered, setAnswered] = useState(false);
  // State to track the index of the selected definition
  const [selectedDefinitionIndex, setSelectedDefinitionIndex] = useState(null);

  // Function to get a random word, optionally excluding the current one
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
      // Ensure the wrong definition is not the same as the correct one
      if (randomWord.definition !== newWord.definition) {
        wrongDefinitions.push(randomWord.definition);
      }
    }

    // Combine correct and wrong definitions and shuffle them
    const allDefinitions = shuffleArray([newWord.definition, ...wrongDefinitions]);
    setDefinitions(allDefinitions);
  };

  // Initialize the first round when the component mounts
  useEffect(() => {
    setupNewRound();
  }, []);

  // Handle when a user selects a definition
  const handleDefinitionPress = (definition, index) => {
    if (answered) return; // Prevent changing answer after one has been selected

    setAnswered(true);
    setSelectedDefinitionIndex(index);

    if (definition === currentWord.definition) {
      setScore(prevScore => prevScore + 1);
    }
  };

  // Function to determine the style of a definition button based on the game state
  const getDefinitionStyle = (definition, index) => {
    const stylesArray = [styles.definitionButton];
    if (answered) {
      if (definition === currentWord.definition) {
        // Style for the correct answer
        stylesArray.push(styles.correctAnswer);
      } else if (index === selectedDefinitionIndex) {
        // Style for the selected incorrect answer
        stylesArray.push(styles.incorrectAnswer);
      }
    }
    return stylesArray;
  };
  
  // Function to determine the text style for a definition button
  const getDefinitionTextStyle = (definition, index) => {
      if (answered && (definition === currentWord.definition || index === selectedDefinitionIndex)) {
          return [styles.definitionText, { color: '#FFFFFF' }];
      }
      return styles.definitionText;
  }

  // Render a loading state or null while the first word is being set up
  if (!currentWord) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
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
              <Text style={getDefinitionTextStyle(definition, index)}>{definition}</Text>
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
    backgroundColor: '#4A90E2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    paddingVertical: 30,
    paddingHorizontal: 25,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  word: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
  },
  category: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
  definitionsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  definitionButton: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  definitionText: {
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
  },
  correctAnswer: {
    backgroundColor: '#2ecc71', // Green
  },
  incorrectAnswer: {
    backgroundColor: '#e74c3c', // Red
  },
  button: {
    backgroundColor: '#FFFFFF',
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
    color: '#4A90E2',
    textAlign: 'center',
  },
});

export default App;
