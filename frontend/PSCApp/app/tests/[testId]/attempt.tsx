






import React, { useState, useEffect, useMemo, useCallback } from 'react';



import { View, StyleSheet, ActivityIndicator, BackHandler, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



import { Stack, useRouter, useLocalSearchParams } from 'expo-router';



import { Button, Card, Text, Title, RadioButton, ProgressBar } from 'react-native-paper';



import { useApi } from '../../../hooks/useApi';



import { MockTest, UserAttempt, UserAnswer, UserAnswerCreatePayload } from '../../../types/test.types';







const formatTime = (seconds: number) => {



    const minutes = Math.floor(seconds / 60);



    const remainingSeconds = seconds % 60;



    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;



};







const TestAttemptScreen = () => {



    const router = useRouter();



    const params = useLocalSearchParams<{ testId: string | string[] }>();







    const testId = useMemo(() => {



        if (Array.isArray(params.testId)) return params.testId[0];



        return params.testId;



    }, [params.testId]);







    // API callers



    const { execute: startAttempt, data: userAttempt, status: attemptStatus } = useApi<UserAttempt>('/api/attempts/start/', true);



    const { execute: fetchTest, data: testData, status: testStatus, error: testError } = useApi<MockTest>(testId ? `/api/mock-tests/${testId}/` : '', true);



    const { execute: submitAnswer } = useApi<UserAnswer>('/api/answers/', true);



    const { execute: submitTest, status: submitStatus } = useApi<UserAttempt>(userAttempt ? `/api/attempts/${userAttempt.id}/submit/` : '', true, { method: 'POST' });







    // Component State



    const [answers, setAnswers] = useState<Record<number, number | null>>({});



    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);



    const [timeLeft, setTimeLeft] = useState(0);



    



    // --- Step 1: Start attempt ---



    useEffect(() => {



        if (testId) startAttempt({ mock_test_id: parseInt(testId, 10), mode: "MOCK_TEST" });



    }, [testId, startAttempt]);







    // --- Step 2: Fetch test data ---



    useEffect(() => {



        if (userAttempt) fetchTest();



    }, [userAttempt, fetchTest]);



    



    // --- Step 3: Initialize timer ---



    useEffect(() => {



        if (testData && testData.duration_minutes) setTimeLeft(testData.duration_minutes * 60);



    }, [testData]);



    



    // --- Final Submission Logic ---



    const handleSubmit = useCallback(async () => {



        if (!userAttempt) return;



        try {



            await submitTest();



            router.replace(`/tests/${userAttempt.id}/results`);



	        } catch {



            Alert.alert("Submission Failed", "There was an error submitting your test. Please try again.");



        }



    }, [userAttempt, submitTest, router]);







    // --- Timer and Auto-submission ---



    useEffect(() => {



        if (timeLeft <= 0 || !testData || submitStatus === 'loading') return;



        if (timeLeft === 1) handleSubmit(); // Auto-submit when time is up



        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);



        return () => clearInterval(timer);



    }, [timeLeft, testData, handleSubmit, submitStatus]);







    // --- Prevent back navigation ---



    useEffect(() => {



        const backAction = () => {



          Alert.alert("Hold on!", "You can't go back during a test. Use the 'Finish & Submit' button to exit.", [{ text: "OK" }]);



          return true;



        };



        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);



        return () => backHandler.remove();



    }, []);







    const handleAnswerSelect = (questionId: number, answerId: number) => {



        setAnswers(prev => ({ ...prev, [questionId]: answerId }));



        if (userAttempt) {



            const payload: UserAnswerCreatePayload = {



                user_attempt: userAttempt.id,



                question: questionId,



                selected_answer: answerId,



                time_taken_seconds: 0, // Simplified for now



                is_skipped: false,



                is_marked_for_review: false,



            };



            submitAnswer(payload); // Fire-and-forget submission of answer



        }



    };







    const handleNext = () => {



        if (testData && testData.test_questions && currentQuestionIndex < testData.test_questions.length - 1) {



            setCurrentQuestionIndex(prev => prev + 1);



        }



    };







    const handlePrevious = () => {



        if (currentQuestionIndex > 0) {



            setCurrentQuestionIndex(prev => prev - 1);



        }



    };







    const showSubmitConfirm = () => {



        Alert.alert("Finish Test", "Are you sure you want to finish and submit your test?", [



            { text: "Cancel", style: "cancel" },



            { text: "Submit", onPress: handleSubmit }



        ]);



    };







    // --- Render Logic ---



    if (attemptStatus === 'loading' || testStatus === 'loading' || (testId && !testData)) {



        return <SafeAreaView style={styles.container}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Preparing your test...</Text></SafeAreaView>;



    }



    



    if (testStatus === 'error' || !testData) {



        return <SafeAreaView style={styles.container}><Title>Error</Title><Text style={styles.errorText}>{testError || 'Could not load the test.'}</Text><Button onPress={() => router.back()}>Go Back</Button></SafeAreaView>;



    }







    const currentQuestionData = testData.test_questions?.[currentQuestionIndex]?.question;



    if (!currentQuestionData) {



        return <SafeAreaView style={styles.container}><Text>No questions found for this test.</Text></SafeAreaView>;



    }



    const questionProgress = testData.test_questions ? (currentQuestionIndex + 1) / testData.test_questions.length : 0;







    return (



        <SafeAreaView style={styles.container}>



            <Stack.Screen options={{ title: `Taking Test: ${testData.title_en}` }} />



            



            <View style={styles.header}>



                <Text>Q {currentQuestionIndex + 1}/{testData.test_questions?.length || 0}</Text>



                <Title>{formatTime(timeLeft)}</Title>



                <Button onPress={showSubmitConfirm} disabled={submitStatus === 'loading'}>Finish</Button>



            </View>



            <ProgressBar progress={questionProgress} style={styles.progressBar} />







            <ScrollView contentContainerStyle={styles.scrollContainer}>



                <Card>



                    <Card.Content>



                        <Text style={styles.questionText}>{currentQuestionData.question_text_en}</Text>



                        <RadioButton.Group 



                            onValueChange={newValue => handleAnswerSelect(currentQuestionData.id, parseInt(newValue, 10))} 



                            value={answers[currentQuestionData.id]?.toString() || ''}



                        >



                            {currentQuestionData.answers?.map(option => (



                                <RadioButton.Item key={option.id} label={option.answer_text_en} value={option.id.toString()} style={styles.option} />



                            ))}



                        </RadioButton.Group>



                    </Card.Content>



                </Card>



            </ScrollView>







            <View style={styles.footer}>



                <Button onPress={handlePrevious} disabled={currentQuestionIndex === 0}>Previous</Button>



                <Button onPress={handleNext} disabled={currentQuestionIndex === (testData.test_questions?.length || 0) - 1}>Next</Button>



            </View>



        </SafeAreaView>



    );



};







const styles = StyleSheet.create({



    container: {



        flex: 1,



    },



    header: {



        flexDirection: 'row',



        justifyContent: 'space-between',



        alignItems: 'center',



        paddingHorizontal: 16,



        paddingVertical: 8,



    },



    progressBar: {



        marginHorizontal: 16,



    },



    scrollContainer: {



        padding: 16,



    },



    questionText: {



        fontSize: 18,



        lineHeight: 24,



        marginBottom: 16,



    },



    option: {



        borderWidth: 1,



        borderColor: '#ddd',



        borderRadius: 8,



        marginBottom: 8,



    },



    footer: {



        flexDirection: 'row',



        justifyContent: 'space-between',



        padding: 16,



        borderTopWidth: 1,



        borderTopColor: '#eee',



    },



    loadingText: {



        marginTop: 16,



        fontSize: 16,



    },



    errorText: {



        textAlign: 'center',



        margin: 20,



        fontSize: 18,



        color: 'red',



    },



});







export default TestAttemptScreen;




