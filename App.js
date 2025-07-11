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
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
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
  // State for epic music
  const [epicMusicSound, setEpicMusicSound] = useState(null);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  // State for time bonus animation
  const [showTimeBonus, setShowTimeBonus] = useState(false);
  const [timeBonusAmount, setTimeBonusAmount] = useState(0);
  const [timeBonusPosition, setTimeBonusPosition] = useState({ x: 0, y: 0 });
  // Animated value for dramatic animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timeBonusAnim = useRef(new Animated.Value(0)).current;
  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Function to get a random word, optionally excluding the current one
  const getRandomWord = (excludeWord = null) => {
    let newWord;
    do {
      newWord = frenchWordsData[Math.floor(Math.random() * frenchWordsData.length)];
    } while (excludeWord && newWord.word === excludeWord.word);
    return newWord;
  };

  // Leaderboard functions
  const loadLeaderboard = async () => {
    try {
      const storedLeaderboard = await AsyncStorage.getItem('leaderboard');
      if (storedLeaderboard) {
        const parsed = JSON.parse(storedLeaderboard);
        setLeaderboard(parsed);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const saveLeaderboard = async (newLeaderboard) => {
    try {
      await AsyncStorage.setItem('leaderboard', JSON.stringify(newLeaderboard));
      setLeaderboard(newLeaderboard);
    } catch (error) {
      console.error('Error saving leaderboard:', error);
    }
  };

  const checkIfScoreQualifies = (score) => {
    if (leaderboard.length < 10) return true;
    return score > leaderboard[leaderboard.length - 1].score;
  };

  const addToLeaderboard = (name, score) => {
    const newEntry = { name, score, date: new Date().toLocaleDateString() };
    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    saveLeaderboard(updatedLeaderboard);
    
    // Find the rank of the new entry
    const rank = updatedLeaderboard.findIndex(entry => entry.name === name && entry.score === score) + 1;
    return rank;
  };

  const handleGameEnd = (currentScore = score) => {
    setFinalScore(currentScore);
    if (checkIfScoreQualifies(currentScore)) {
      setShowNameModal(true);
    } else {
      Alert.alert(
        'Partie terminée !',
        `Votre score : ${currentScore}\nMalheureusement, ce score n'est pas suffisant pour entrer dans le top 10.`,
        [
          { text: 'OK', onPress: () => {} },
          { text: 'Voir le classement', onPress: () => setShowLeaderboard(true) }
        ]
      );
    }
  };

  const handleNameSubmit = () => {
    if (playerName.trim()) {
      const rank = addToLeaderboard(playerName.trim(), finalScore);
      setShowNameModal(false);
      setPlayerName('');
      Alert.alert(
        'Félicitations !',
        `${playerName.trim()} a été ajouté au classement à la ${rank}${rank === 1 ? 'ère' : 'ème'} place avec un score de ${finalScore} !`,
        [{ text: 'Voir le classement', onPress: () => setShowLeaderboard(true) }]
      );
    }
  };

  // Function to set up a new round
  const setupNewRound = () => {
    setAnswered(false);
    setSelectedDefinitionIndex(null);
    
    // Ne générer un nouveau mot que si on clique explicitement sur "Nouveau Mot"
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

  // Function to just reset the current round without changing the word
  const resetCurrentRound = () => {
    setAnswered(false);
    setSelectedDefinitionIndex(null);
  };

  // Initialize the first round when the component mounts
  useEffect(() => {
    setupNewRound();
    loadLeaderboard();
    
    // Initialiser le système audio
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('Système audio initialisé');
      } catch (error) {
        console.log('Erreur lors de l\'initialisation audio:', error);
      }
    };
    
    initAudio();
  }, []);

  // Timer effect for "Guerre intérieure" mode
  useEffect(() => {
    let timer;
    if (isGuerreInterieureMode && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isGuerreInterieureMode) {
      // Capture the current score before resetting the mode
      const currentScore = score;
      setIsGuerreInterieureMode(false);
      setTimeLeft(15); // Reset timer to 15 seconds
      
      // Arrêter la musique épique de façon asynchrone
      stopEpicMusic().then(() => {
        // Check if score qualifies for leaderboard après arrêt de la musique
        handleGameEnd(currentScore);
      });
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGuerreInterieureMode, timeLeft, score]);

  // Cleanup effect for epic music
  useEffect(() => {
    return () => {
      stopEpicMusic();
    };
  }, []);

  // Handle when a user selects a definition
  const handleDefinitionPress = (definition, index, event) => {
    if (answered) return;

    setAnswered(true);
    setSelectedDefinitionIndex(index);

    if (definition === currentWord.definition) {
      setScore(prevScore => prevScore + 1);
      if (isGuerreInterieureMode) {
        // Ajouter 3 secondes au chronomètre pour une bonne réponse
        setTimeLeft(prevTime => prevTime + 3);
        
        // Capturer la position du clic pour l'animation
        if (event && event.nativeEvent) {
          const { pageX, pageY } = event.nativeEvent;
          setTimeBonusPosition({ x: pageX, y: pageY });
        } else {
          // Position par défaut au centre si pas d'event
          setTimeBonusPosition({ x: 200, y: 300 });
        }
        
        // Afficher l'animation du bonus de temps
        showTimeBonusAnimation(3);
        
        // Dramatic success animation
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        // En mode guerre intérieure, passer au mot suivant après un très court délai
        setTimeout(() => {
          setupNewRound();
        }, 400);
      }
    } else {
      // In guerre intérieure mode, wrong answers make you lose a point
      if (isGuerreInterieureMode) {
        setScore(prevScore => Math.max(0, prevScore - 1)); // Prevent score from going below 0
        // Dramatic fail animation
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        // En mode guerre intérieure, passer au mot suivant après un très court délai
        setTimeout(() => {
          setupNewRound();
        }, 400);
      }
    }
  };

  // Function to load and play epic music
  const loadEpicMusic = async () => {
    try {
      // D'abord arrêter la musique existante si elle existe
      await stopEpicMusic();
      
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/1983 inst mix ab oz.mp3'),
        { shouldPlay: !isMusicMuted, isLooping: true, volume: isMusicMuted ? 0 : 0.3 }
      );
      setEpicMusicSound(sound);
      console.log('Musique épique chargée et lancée');
    } catch (error) {
      console.log('Erreur lors du chargement de la musique épique:', error);
    }
  };

  // Function to stop epic music
  const stopEpicMusic = async () => {
    if (epicMusicSound) {
      try {
        const status = await epicMusicSound.getStatusAsync();
        if (status.isLoaded) {
          await epicMusicSound.stopAsync();
          await epicMusicSound.unloadAsync();
        }
        setEpicMusicSound(null);
        console.log('Musique épique arrêtée');
      } catch (error) {
        console.log('Erreur lors de l\'arrêt de la musique épique:', error);
        // Force le reset même en cas d'erreur
        setEpicMusicSound(null);
      }
    }
  };

  // Function to show time bonus animation
  const showTimeBonusAnimation = (seconds) => {
    setTimeBonusAmount(seconds);
    setShowTimeBonus(true);
    
    // Reset animation value
    timeBonusAnim.setValue(0);
    
    // Animation qui fait remonter le texte vers le haut avec fondu
    Animated.timing(timeBonusAnim, {
      toValue: 1,
      duration: 2000, // Animation plus longue pour un effet fluide
      useNativeDriver: true,
    }).start(() => {
      setShowTimeBonus(false);
    });
  };

  // Function to toggle music mute
  const toggleMusicMute = async () => {
    const newMutedState = !isMusicMuted;
    setIsMusicMuted(newMutedState);
    
    if (epicMusicSound) {
      try {
        if (newMutedState) {
          await epicMusicSound.pauseAsync();
        } else {
          await epicMusicSound.playAsync();
        }
      } catch (error) {
        console.log('Erreur lors du toggle de la musique:', error);
      }
    }
  };

  // Toggle "Guerre intérieure" mode
  const toggleGuerreInterieureMode = async () => {
    const newMode = !isGuerreInterieureMode;
    setIsGuerreInterieureMode(newMode);
    setScore(0);
    setTimeLeft(15); // Commencer avec 15 secondes
    
    if (newMode) {
      // Mode guerre intérieure activé - lancer la musique épique
      console.log('Activation du mode Guerre Intérieure - Chargement de la musique...');
      await loadEpicMusic();
    } else {
      // Mode guerre intérieure désactivé - arrêter la musique épique
      console.log('Désactivation du mode Guerre Intérieure - Arrêt de la musique...');
      await stopEpicMusic();
    }
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
      
      // In guerre intérieure mode, use white text for better visibility
      if (isGuerreInterieureMode) {
          return styles.guerreDefinitionText;
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

  return (
    <View style={styles.container}>
      {/* ImageBackground toujours présent pour préchargement */}
      <ImageBackground 
        source={require('./assets/img_guerre_interieure.png')} 
        style={[styles.guerreBackground, !isGuerreInterieureMode && styles.hidden]}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          <View style={[styles.header, styles.guerreHeader]}>
            <Text style={styles.title}>Guerre Intérieure</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.leaderboardButton}
                onPress={() => setShowLeaderboard(true)}
              >
                <Text style={styles.leaderboardButtonText}>🏆</Text>
              </TouchableOpacity>
              <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>Score: {score}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>

          {/* Animation du bonus de temps */}
          {showTimeBonus && (
            <Animated.View 
              style={[
                styles.timeBonusContainer,
                {
                  left: timeBonusPosition.x - 30, // Centrer le texte sur la position de clic
                  top: timeBonusPosition.y,
                  opacity: timeBonusAnim.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 1, 0], // Apparition rapide, maintien, puis fondu
                  }),
                  transform: [
                    {
                      translateY: timeBonusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -200], // Remonte de 200px vers le haut
                      }),
                    },
                  ],
                }
              ]}
            >
              <Text style={styles.timeBonusText}>+{timeBonusAmount}s!</Text>
            </Animated.View>
          )}

          <Animated.View style={[styles.content, animatedStyle]}>
            <View style={[styles.wordContainer, styles.guerreWordContainer]}>
              <Text style={[styles.word, styles.guerreWord]}>{currentWord.word}</Text>
              <Text style={[styles.category, styles.guerreCategory]}>{currentWord.category}</Text>
            </View>

            <View style={styles.definitionsContainer}>
              {definitions.map((definition, index) => (
                <TouchableOpacity
                  key={index}
                  style={getDefinitionStyle(definition, index)}
                  onPress={(event) => handleDefinitionPress(definition, index, event)}
                  disabled={answered}
                >
                  <Text style={getDefinitionTextStyle(definition, index)}>{definition}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.button, styles.guerreButton]} onPress={setupNewRound}>
              <Text style={[styles.buttonText, styles.guerreButtonText]}>Nouveau Mot</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, styles.guerreSwitchLabel]}>Guerre Intérieure</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isGuerreInterieureMode ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleGuerreInterieureMode}
              value={isGuerreInterieureMode}
            />
            {isGuerreInterieureMode && (
              <TouchableOpacity 
                style={styles.muteButtonBottom}
                onPress={toggleMusicMute}
              >
                <Text style={styles.muteButtonBottomText}>{isMusicMuted ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Modal for entering player name */}
          <Modal
            visible={showNameModal}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Félicitations !</Text>
                <Text style={styles.modalText}>Votre score de {finalScore} mérite d'être dans le classement !</Text>
                <Text style={styles.modalLabel}>Entrez votre nom :</Text>
                <TextInput
                  style={styles.nameInput}
                  value={playerName}
                  onChangeText={setPlayerName}
                  placeholder="Votre nom"
                  maxLength={20}
                  autoFocus={true}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowNameModal(false);
                      setPlayerName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleNameSubmit}
                  >
                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal for displaying leaderboard */}
          <Modal
            visible={showLeaderboard}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, styles.leaderboardModal]}>
                <Text style={styles.modalTitle}>🏆 Classement</Text>
                <ScrollView style={styles.leaderboardList}>
                  {leaderboard.length === 0 ? (
                    <Text style={styles.emptyLeaderboard}>Aucun score enregistré</Text>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <View key={index} style={styles.leaderboardEntry}>
                        <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                        <View style={styles.leaderboardInfo}>
                          <Text style={styles.leaderboardName}>{entry.name}</Text>
                          <Text style={styles.leaderboardDate}>{entry.date}</Text>
                        </View>
                        <Text style={styles.leaderboardScore}>{entry.score}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setShowLeaderboard(false)}
                >
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </ImageBackground>

      {/* Vue normale au-dessus quand guerre intérieure est désactivée */}
      {!isGuerreInterieureMode && (
        <View style={styles.normalView}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
            
            <View style={styles.header}>
              <Text style={styles.title}>Mots Rares</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  style={styles.leaderboardButton}
                  onPress={() => setShowLeaderboard(true)}
                >
                  <Text style={styles.leaderboardButtonText}>🏆</Text>
                </TouchableOpacity>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>Score: {score}</Text>
                </View>
              </View>
            </View>

            <Animated.View style={styles.content}>
              <View style={styles.wordContainer}>
                <Text style={styles.word}>{currentWord.word}</Text>
                <Text style={styles.category}>{currentWord.category}</Text>
              </View>

              <View style={styles.definitionsContainer}>
                {definitions.map((definition, index) => (
                  <TouchableOpacity
                    key={index}
                    style={getDefinitionStyle(definition, index)}
                    onPress={(event) => handleDefinitionPress(definition, index, event)}
                    disabled={answered}
                  >
                    <Text style={getDefinitionTextStyle(definition, index)}>{definition}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.button} onPress={setupNewRound}>
                <Text style={styles.buttonText}>Nouveau Mot</Text>
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

            {/* Modal for entering player name */}
            <Modal
              visible={showNameModal}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Félicitations !</Text>
                  <Text style={styles.modalText}>Votre score de {finalScore} mérite d'être dans le classement !</Text>
                  <Text style={styles.modalLabel}>Entrez votre nom :</Text>
                  <TextInput
                    style={styles.nameInput}
                    value={playerName}
                    onChangeText={setPlayerName}
                    placeholder="Votre nom"
                    maxLength={20}
                    autoFocus={true}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowNameModal(false);
                        setPlayerName('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={handleNameSubmit}
                    >
                      <Text style={styles.confirmButtonText}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Modal for displaying leaderboard */}
            <Modal
              visible={showLeaderboard}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, styles.leaderboardModal]}>
                  <Text style={styles.modalTitle}>🏆 Classement</Text>
                  <ScrollView style={styles.leaderboardList}>
                    {leaderboard.length === 0 ? (
                      <Text style={styles.emptyLeaderboard}>Aucun score enregistré</Text>
                    ) : (
                      leaderboard.map((entry, index) => (
                        <View key={index} style={styles.leaderboardEntry}>
                          <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                          <View style={styles.leaderboardInfo}>
                            <Text style={styles.leaderboardName}>{entry.name}</Text>
                            <Text style={styles.leaderboardDate}>{entry.date}</Text>
                          </View>
                          <Text style={styles.leaderboardScore}>{entry.score}</Text>
                        </View>
                      ))
                    )}
                  </ScrollView>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={() => setShowLeaderboard(false)}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  guerreBackground: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  hidden: {
    opacity: 0,
    zIndex: -1,
  },
  normalView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F4F8',
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#4A90E2',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  guerreHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 2,
    borderBottomColor: '#8A2BE2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  leaderboardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  leaderboardButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  muteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  muteButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  muteButtonBottom: {
    backgroundColor: 'rgba(138, 43, 226, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 15,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  muteButtonBottomText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  timerContainer: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 8,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timeBonusContainer: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBonusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#27AE60',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  wordContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    alignItems: 'center',
  },
  guerreWordContainer: {
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderColor: '#8A2BE2',
    borderWidth: 2,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  guerreWord: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  guerreCategory: {
    color: '#CCCCCC',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  definitionsContainer: {
    marginBottom: 30,
  },
  definitionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  guerreDefinitionButton: {
    backgroundColor: 'rgba(44, 44, 44, 0.9)',
    borderColor: '#8A2BE2',
    borderWidth: 1,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  definitionText: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 22,
  },
  guerreDefinitionText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  correctAnswer: {
    backgroundColor: '#27AE60',
  },
  incorrectAnswer: {
    backgroundColor: '#E74C3C',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  guerreButton: {
    backgroundColor: '#8A2BE2',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guerreButtonText: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontSize: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2C3E50',
    marginRight: 10,
  },
  guerreSwitchLabel: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(138, 43, 226, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  leaderboardModal: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2C3E50',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#34495E',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#2C3E50',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  confirmButton: {
    backgroundColor: '#27AE60',
  },
  closeButton: {
    backgroundColor: '#4A90E2',
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Leaderboard styles
  leaderboardList: {
    maxHeight: 300,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  leaderboardRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E67E22',
    width: 40,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  leaderboardDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  leaderboardScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  emptyLeaderboard: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default App;
