import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const App = () => {
  const [currentWord, setCurrentWord] = useState('Appuyez sur le bouton !');

  // Liste de mots français variés
  const frenchWords = [
    'papillon', 'soleil', 'océan', 'montagne', 'étoile',
    'jardin', 'musique', 'voyage', 'sourire', 'liberté',
    'aventure', 'mystère', 'harmonie', 'découverte', 'bonheur',
    'cascade', 'horizon', 'mélodie', 'lumière', 'espoir',
    'créativité', 'passion', 'sérénité', 'élégance', 'magie',
    'inspiration', 'tendresse', 'émerveillement', 'plénitude', 'gratitude',
    'bienveillance', 'authenticité', 'spontanéité', 'simplicité', 'générosité',
    'chocolat', 'croissant', 'baguette', 'fromage', 'café',
    'château', 'bibliothèque', 'parapluie', 'vélo', 'fleur',
    'nuage', 'rivière', 'forêt', 'oiseau', 'chat'
  ];

  const generateRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * frenchWords.length);
    const selectedWord = frenchWords[randomIndex];
    setCurrentWord(selectedWord);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Générateur de Mots</Text>
        <Text style={styles.subtitle}>Français Aléatoires</Text>
        
        <View style={styles.wordContainer}>
          <Text style={styles.word}>{currentWord}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={generateRandomWord}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Nouveau Mot</Text>
        </TouchableOpacity>
        
        <Text style={styles.footer}>Appuyez pour découvrir un nouveau mot !</Text>
      </View>
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
    marginBottom: 60,
    textAlign: 'center',
  },
  wordContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 20,
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
  },
  word: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A90E2',
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
});

export default App;
