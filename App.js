import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
// Import the word database
import frenchWordsData from './frenchWords.json';

const App = () => {
  // Use the imported word database
  const [currentWord, setCurrentWord] = useState(getRandomWord());
  const [showDefinition, setShowDefinition] = useState(false);
  const [selectedWordDef, setSelectedWordDef] = useState('');

  function getRandomWord() {
    return frenchWordsData[Math.floor(Math.random() * frenchWordsData.length)];
  }

  const handleNewWord = () => {
    setCurrentWord(getRandomWord());
    setShowDefinition(false);
  };

  const handleWordPress = () => {
    setSelectedWordDef(currentWord.definition);
    setShowDefinition(true);
  };

  const closeDefinition = () => {
    setShowDefinition(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Mots Rares</Text>
        <Text style={styles.subtitle}>Français</Text>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {frenchWordsData.length} mots rares • Collection Le Garde-mots
          </Text>
        </View>
        
        <View style={styles.wordContainer}>
          <TouchableOpacity onPress={handleWordPress} style={styles.wordButton}>
            <Text style={styles.word}>{currentWord.word}</Text>
            <Text style={styles.category}>{currentWord.category}</Text>
            <Text style={styles.tapHint}>Touchez pour voir la définition</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNewWord}>
          <Text style={styles.buttonText}>Nouveau Mot</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Découvrez les trésors du français !</Text>
      </View>

      <Modal
        visible={showDefinition}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDefinition}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalWord}>{currentWord.word}</Text>
            <Text style={styles.modalCategory}>• {currentWord.category} •</Text>
            <ScrollView style={styles.definitionContainer}>
              <Text style={styles.definition}>{selectedWordDef}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={closeDefinition}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#E8F4FD',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  statsText: {
    fontSize: 14,
    color: '#E8F4FD',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  wordContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 40,
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    minWidth: 250,
    alignItems: 'center',
  },
  wordButton: {
    alignItems: 'center',
  },
  word: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 10,
  },
  category: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  tapHint: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  footer: {
    fontSize: 14,
    color: '#E8F4FD',
    marginTop: 40,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    maxHeight: '70%',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalWord: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalCategory: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  definitionContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  definition: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    textAlign: 'justify',
  },
  closeButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;