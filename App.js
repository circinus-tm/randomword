import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Switch,
  Animated,
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
  // State for "Guerre intérieure" mode
  const [isGuerreInterieureMode, setIsGuerreInterieureMode] = useState(false);
  // State for the timer
  const [timeLeft, setTimeLeft] = useState(30);
  // Animated value for dramatic animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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

    const wrongDefinitions = [];
    while (wrongDefinitions.length < 3) {
      const randomWord = getRandomWord(newWord);
      if (randomWord.definition !== newWord.definition) {
        wrongDefinitions.push(randomWord.definition);
      }
    }

    const allDefinitions = shuffleArray([newWord.definition, ...wrongDefinitions]);
    setDefinitions(allDefinitions);
  };

  // Initialize the first round when the component mounts
  useEffect(() => {
    setupNewRound();
  }, []);

  // Timer effect for "Guerre intérieure" mode
  useEffect(() => {
    let timer;
    if (isGuerreInterieureMode && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsGuerreInterieureMode(false);
      setTimeLeft(30); // Reset timer
    }
    return () => clearInterval(timer);
  }, [isGuerreInterieureMode, timeLeft]);

  // Handle when a user selects a definition
  const handleDefinitionPress = (definition, index) => {
    if (answered) return;

    setAnswered(true);
    setSelectedDefinitionIndex(index);

    if (definition === currentWord.definition) {
      setScore(prevScore => prevScore + 1);
      if (isGuerreInterieureMode) {
        // Dramatic success animation
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    } else {
      if (isGuerreInterieureMode) {
        // Dramatic fail animation
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }
    }
  };

  // Toggle "Guerre intérieure" mode
  const toggleGuerreInterieureMode = () => {
    setIsGuerreInterieureMode(previousState => !previousState);
    setScore(0);
    setTimeLeft(30);
  };

  // Function to determine the style of a definition button
  const getDefinitionStyle = (definition, index) => {
    const stylesArray = [styles.definitionButton];
    if (isGuerreInterieureMode) {
      stylesArray.push(styles.guerreDefinitionButton);
    }
    if (answered) {
      if (definition === currentWord.definition) {
        stylesArray.push(styles.correctAnswer);
      } else if (index === selectedDefinitionIndex) {
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

  const shake = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1deg', '1deg'],
  });

  const animatedStyle = {
    transform: [{ scale: scaleAnim }, { rotate: shake }],
  };

  const backgroundSource = isGuerreInterieureMode
    ? require('./assets/guerre-interieure-bg.jpg')
    : { uri: '' }; // No specific image for normal mode, it will use the backgroundColor

  return (
    <ImageBackground 
      source={backgroundSource} 
      style={styles.container}
      imageStyle={{opacity: 0.5}}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={isGuerreInterieureMode ? '#000000' : '#4A90E2'} />
        
        <View style={styles.header}>
          <Text style={styles.title}>{isGuerreInterieureMode ? "Guerre Intérieure" : "Mots Rares"}</Text>
          <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
        </View>
        
        {isGuerreInterieureMode && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>
        )}

        <Animated.View style={[styles.content, isGuerreInterieureMode && animatedStyle]}>
          <View style={[styles.wordContainer, isGuerreInterieureMode && styles.guerreWordContainer]}>
            <Text style={[styles.word, isGuerreInterieureMode && styles.guerreWord]}>{currentWord.word}</Text>
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

          <TouchableOpacity style={[styles.button, isGuerreInterieureMode && styles.guerreButton]} onPress={setupNewRound}>
            <Text style={[styles.buttonText, isGuerreInterieureMode && styles.guerreButtonText]}>Nouveau Mot</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Guerre Intérieure</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isGuerreInterieureMode ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleGuerreInterieureMode}
            value={isGuerreInterieureMode}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  safeArea: {
    flex: 1,
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
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 22,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  switchLabel: {
    color: '#FFFFFF',
    marginRight: 10,
    fontSize: 16,
  },
  // Styles for "Guerre intérieure" mode
  guerreWordContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  guerreWord: {
    color: '#ff4757',
  },
  guerreDefinitionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  guerreButton: {
    backgroundColor: '#ff4757',
  },
  guerreButtonText: {
    color: '#FFFFFF',
  },
});

export default App;