// Helper utilities for timed interview flow

export const TIME_LIMITS = [
    { value: 5, label: "5 minutes" },
    { value: 10, label: "10 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 20, label: "20 minutes" },
    { value: 30, label: "30 minutes" },
];

// Calculate number of questions based on time limit
// Assumes ~2-3 minutes per question
export const calculateQuestionCount = (timeLimitMinutes: number): number => {
    // Always return a high number to ensure we use all available questions
    // The interview will end based on time or when questions run out
    return 50;
};

// Get questions for a session (always starts with "Tell me about yourself")
export const getQuestionsForSession = (
    role: string,
    count: number,
    roleQuestions: Record<string, string[]>
): string[] => {
    const questions: string[] = [];
    const roleQuestionBank = roleQuestions[role] || roleQuestions["General"];

    // Always start with "Tell me about yourself"
    const tellMeAboutYourself = roleQuestionBank.find(q =>
        q.toLowerCase().includes("tell me about yourself")
    ) || "Tell me about yourself.";

    questions.push(tellMeAboutYourself);

    // Add remaining questions (excluding the one we already added)
    const remainingQuestions = roleQuestionBank.filter(q => q !== tellMeAboutYourself);
    const questionsNeeded = Math.min(count - 1, remainingQuestions.length);

    for (let i = 0; i < questionsNeeded; i++) {
        questions.push(remainingQuestions[i]);
    }

    return questions;
};

// Format time remaining for display
export const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Interview flow states
export enum InterviewState {
    SETUP = "SETUP",
    QUESTION = "QUESTION",
    RECORDING = "RECORDING",
    ANALYZING = "ANALYZING",
    FEEDBACK = "FEEDBACK",
    COMPLETED = "COMPLETED",
}
