import { create } from 'zustand';
import type { QuizQuestion } from '../components/shared/QuizEngine';

// Structure d'une réponse donnée par l'utilisateur
export interface QuizAnswer {
    questionId: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
}

// Séparation de l'état (State)
interface QuizState {
    // Session courante
    isActive: boolean;
    questions: QuizQuestion[];
    currentIndex: number;
    answers: QuizAnswer[];

    // Statistiques de la session courante
    score: number;
    isFinished: boolean;

    // Mode examen
    isExamMode: boolean;
    examStartTime: number | null;
    examDurationMs: number;
}

// Séparation des actions (Actions)
interface QuizActions {
    // Initialiser un nouveau quiz avec un set de questions
    startQuiz: (questions: QuizQuestion[], examMode?: boolean) => void;
    // Soumettre une réponse pour la question courante
    answerQuestion: (optionIndex: number) => void;
    // Passer à la question suivante
    nextQuestion: () => void;
    // Mettre fin au quiz (passage aux résultats)
    finishQuiz: () => void;
    // Quitter/Annuler le quiz en cours
    resetQuiz: () => void;
}

// Combinaison pour le store
export type QuizStore = QuizState & QuizActions;

const initialState: QuizState = {
    isActive: false,
    questions: [],
    currentIndex: 0,
    answers: [],
    score: 0,
    isFinished: false,
    isExamMode: false,
    examStartTime: null,
    examDurationMs: 45 * 60 * 1000, // 45 minutes par défaut
};

// Création du store ÉPHÉMÈRE (pas de middleware persist ici !)
export const useQuizStore = create<QuizStore>((set, get) => ({
    // --- ÉTAT INITIAL ---
    ...initialState,

    // --- ACTIONS ---
    startQuiz: (questions, examMode = false) =>
        set({
            isActive: true,
            questions,
            currentIndex: 0,
            answers: [],
            score: 0,
            isFinished: false,
            isExamMode: examMode,
            examStartTime: examMode ? Date.now() : null,
        }),

    answerQuestion: (optionIndex) => {
        const state = get();
        if (!state.isActive || state.isFinished) return;

        const currentQuestion = state.questions[state.currentIndex];
        if (!currentQuestion) return;

        // Éviter les doubles réponses
        const alreadyAnswered = state.answers.some(a => a.questionId === currentQuestion.id);
        if (alreadyAnswered) return;

        const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;

        set((state) => ({
            answers: [
                ...state.answers,
                {
                    questionId: currentQuestion.id,
                    selectedOptionIndex: optionIndex,
                    isCorrect,
                },
            ],
            score: isCorrect ? state.score + 1 : state.score,
        }));
    },

    nextQuestion: () => {
        const state = get();
        if (state.currentIndex < state.questions.length - 1) {
            set({ currentIndex: state.currentIndex + 1 });
        } else {
            // Fin naturelle du quiz si on est à la dernière question
            get().finishQuiz();
        }
    },

    finishQuiz: () =>
        set({
            isActive: false,
            isFinished: true,
        }),

    resetQuiz: () => set(initialState),
}));
