

import React from 'react';

import { StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import { Button, Card, Text, TextInput } from 'react-native-paper';

import { useApi } from '../../../hooks/useApi';

import { Category } from '../../../types/category.types';



const PracticeSetupScreen = () => {

  const router = useRouter();

  const params = useLocalSearchParams<{ categoryId: string }>();

  const categoryId = params.categoryId;

  

	  const { data: category, status } = useApi<Category>(

	    categoryId ? `/api/categories/${categoryId}/` : '',

	    !categoryId // lazy load if no categoryId

	  );



  const [numberOfQuestions, setNumberOfQuestions] = React.useState('10');

  

  const handleStartPractice = () => {
    if (!categoryId) return;
    router.push({
      pathname: `/practice/[categoryId]/question`,
      params: { categoryId, count: numberOfQuestions }
    });
  };



  if (status === 'loading') {

    return <ActivityIndicator animating={true} size="large" style={styles.loader} />;

  }



  if (status === 'error' || !category) {

    return (

      <SafeAreaView style={styles.container}>

        <Stack.Screen options={{ title: 'Error' }} />

        <Text style={styles.errorText}>

          Could not load category.

        </Text>

        <Button onPress={() => router.back()}>Go Back</Button>

      </SafeAreaView>

    );

  }



  return (

    <SafeAreaView style={styles.container}>

      <Stack.Screen options={{ title: category.name_en }} />

      <Card style={styles.card}>

        <Card.Title title="Setup Your Practice Session" titleStyle={styles.title} />

        <Card.Content>

          <Text style={styles.text}>You are practicing in category:</Text>

          <Text style={styles.categoryName}>{category.name_en}</Text>

          

          <TextInput

            label="Number of questions"

            value={numberOfQuestions}

            onChangeText={setNumberOfQuestions}

            keyboardType="number-pad"

            style={styles.input}

            mode="outlined"

          />



          <Button 

            mode="contained" 

            onPress={handleStartPractice} 

            style={styles.button}

            icon="play-circle"

            disabled={!numberOfQuestions || parseInt(numberOfQuestions, 10) <= 0}

          >

            Start Practice

          </Button>

        </Card.Content>

      </Card>

    </SafeAreaView>

  );

};



const styles = StyleSheet.create({

  container: {

    flex: 1,

    justifyContent: 'center',

    padding: 16,

  },

  loader: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

  card: {

    paddingVertical: 16,

  },

  title: {

    marginBottom: 16,

  },

  text: {

    fontSize: 16,

    textAlign: 'center',

    marginBottom: 8,

  },

  categoryName: {

    fontSize: 22,

    fontWeight: 'bold',

    textAlign: 'center',

    marginBottom: 24,

  },

  input: {

    marginBottom: 24,

  },

  button: {

    paddingVertical: 8,

  },

  errorText: {

    textAlign: 'center',

    marginBottom: 20,

    fontSize: 18,

    color: 'red',

  },

});



export default PracticeSetupScreen;
