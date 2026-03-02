import React, { useEffect } from 'react';
import { QuizEngine, QuizQuestion } from '../components/shared/QuizEngine';
import { QuizResults } from '../components/shared/QuizResults';

// Simuler le chargement des données depuis le fichier JSON statique
import quizDataLocal from '../data/quizQuestions.json';
import { useQuizStore } from '../stores/useQuizStore';
import { useUserStore } from '../stores/useUserStore';
import { useTranslation } from 'react-i18next';

export const QuizView: React.FC = () => {
    const { t } = useTranslation();
    const { questions, isFinished, startQuiz, resetQuiz } = useQuizStore();
    const addScore = useUserStore((state) => state.addScore);

    const startNewQuiz = () => {
        const shuffled = [...(quizDataLocal as QuizQuestion[])].sort(() => 0.5 - Math.random());
        startQuiz(shuffled.slice(0, 10));
    };

    useEffect(() => {
        if (questions.length === 0 && !isFinished) {
            startNewQuiz();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect for triggering score save when quiz is finished
    useEffect(() => {
        if (isFinished && questions.length > 0) {
            handleFinish();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinished]);

    const handleFinish = () => {
        const finalScore = useQuizStore.getState().score;
        addScore(finalScore, questions.length);
    };

    const handleRestart = () => {
        resetQuiz();
        startNewQuiz();
    };

    // ---------- ÉCRAN DE RÉSULTATS DÉTAILLÉS ----------
    if (isFinished) {
        return <QuizResults onRestart={handleRestart} />;
    }

    // ---------- ÉCRAN DE QUIZ EN COURS ----------
    return (
        <div className="py-8">
            <div className="max-w-3xl mx-auto px-4 md:px-6 mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('quiz.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">{t('quiz.subtitle', { count: questions.length })}</p>
            </div>

            {questions.length > 0 ? (
                <QuizEngine />
            ) : (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
                </div>
            )}
        </div>
    );
};
