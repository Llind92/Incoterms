import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { useQuizStore } from '../../stores/useQuizStore';
import { useTranslation } from 'react-i18next';

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "case_study" | "calculation";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  source?: string;
}

const formatRichText = (text: string) => {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  const INCOTERMS = ['CCI 2020', 'ICC(A)', 'ICC(C)', 'DAT', 'DPU', 'DAP', 'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DDP', 'Art. 70 CDU', '110%'];

  const termsPattern = INCOTERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const financialPattern = '\\b\\d{1,3}(?:[ \\u00A0]\\d{3})*(?:,\\d+)?\\s?(?:€|\\$|USD|EUR|%)';
  const numberPattern = '\\b\\d{1,3}(?:[ \\u00A0]\\d{3})+(?:,\\d+)?\\b';
  const percentPattern = '\\b\\d+(?:,\\d+)?\\s?%';

  const TERMS_REGEX = new RegExp(`(${termsPattern}|${financialPattern}|${numberPattern}|${percentPattern})`, 'g');

  return paragraphs.map((paragraph, pIndex) => (
    <p key={pIndex} className="mb-3 last:mb-0">
      {paragraph.split(TERMS_REGEX).map((part, i) => {
        if (!part) return null;

        if (INCOTERMS.includes(part)) {
          return <strong key={i} className="text-slate-900 dark:text-white font-bold bg-slate-200 dark:bg-slate-700/60 px-1 rounded transition-colors whitespace-nowrap">{part}</strong>;
        }
        if (/^(\d{1,3}(?:[ \u00A0]\d{3})*(?:,\d+)?\s?(?:€|\$|USD|EUR|%))$/.test(part) || /^(\d{1,3}(?:[ \u00A0]\d{3})+(?:,\d+)?)$/.test(part) || /^(\d+(?:,\d+)?\s?%)$/.test(part)) {
          return <strong key={i} className="font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">{part}</strong>;
        }
        return part;
      })}
    </p>
  ));
};

export const QuizEngine: React.FC = () => {
  // ---------------------------------------------------------------------------
  // Utilisation de notre Store Global Zustand
  // ---------------------------------------------------------------------------
  const {
    questions,
    currentIndex,
    answers,
    answerQuestion,
    nextQuestion
  } = useQuizStore();

  const { t } = useTranslation();

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const isAnswered = !!currentAnswer;
  const selectedAnswerIndex = currentAnswer?.selectedOptionIndex ?? null;

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400 transition-colors">
        <p>{t('quiz.no_questions')}</p>
      </div>
    );
  }

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    answerQuestion(index);
  };

  const handleNext = () => {
    nextQuestion();
  };

  // ---------------------------------------------------------------------------
  // Variants de Framer Motion
  // ---------------------------------------------------------------------------
  const shakeAnimation = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4 },
    },
  };

  const explanationVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: 24, // spacing
      transition: { duration: 0.3, ease: "easeOut" as const }
    }
  };


  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 font-sans">

      {/* En-tête du Quiz */}
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4 md:px-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('quiz.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">{t('quiz.subtitle', { count: questions.length })}</p>
          </div>
          <Link to="/" className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:ring-offset-2">
            <ArrowLeft size={16} className="mr-2" /> {t('nav.back')}
          </Link>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">
            {t('quiz.question_progress', { current: currentIndex + 1, total: questions.length })}
          </span>
          <div className="flex gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 transition-colors">
              {currentQuestion.type === "case_study" ? t('quiz.type_case_study') : currentQuestion.type === "calculation" ? t('quiz.type_calculation') : t('quiz.type_mcq')}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize transition-colors">
              {currentQuestion.difficulty === "easy" ? t('quiz.diff_easy') : currentQuestion.difficulty === "medium" ? t('quiz.diff_medium') : t('quiz.diff_hard')}
            </span>
          </div>
        </div>
        {/* Barre de progression */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden transition-colors">
          <motion.div
            className="bg-blue-600 dark:bg-blue-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Card Principale (Shadcn style) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id} // Permet d'animer l'arrivée d'une nouvelle question
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
        >
          <div className="p-6 md:p-8">
            {/* Badge Source */}
            {currentQuestion.source && (
              <div className="mb-4">
                {currentQuestion.source.includes('Annale') ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50 transition-colors">
                    <Award size={13} />
                    {currentQuestion.source}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 transition-colors">
                    {currentQuestion.source}
                  </span>
                )}
              </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-xl border-l-4 border-blue-500 mb-8 shadow-sm">
              <div className="text-[1.05rem] leading-relaxed text-slate-800 dark:text-slate-200">
                {formatRichText(currentQuestion.question)}
              </div>
            </div>

            {/* Options de réponse */}
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswerIndex === index;
                const isCorrect = index === currentQuestion.correctAnswerIndex;
                const showAsCorrect = isAnswered && isCorrect;
                const showAsWrong = isAnswered && isSelected && !isCorrect;

                // Styles dynamiques Apple Academic avec Dark Mode
                let buttonStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm";

                if (showAsCorrect) {
                  buttonStyle = "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500 text-green-800 dark:text-green-400 ring-1 ring-green-500";
                } else if (showAsWrong) {
                  buttonStyle = "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500 text-red-800 dark:text-red-400 ring-1 ring-red-500";
                } else if (isAnswered) {
                  buttonStyle = "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed";
                }

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    disabled={isAnswered}
                    whileHover={!isAnswered ? { scale: 1.01 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    variants={showAsWrong ? shakeAnimation : undefined}
                    animate={showAsWrong ? "shake" : undefined}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 ${buttonStyle}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4 mt-0.5 font-mono text-sm font-bold opacity-50">
                        {String.fromCharCode(65 + index)}.
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Zone Pédagogique (Explication) intégrée à la Card mais visuellement distincte */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                variants={explanationVariants}
                initial="hidden"
                animate="visible"
                className="bg-indigo-50/60 dark:bg-indigo-950/30 border-t border-indigo-100 dark:border-indigo-900/50 transition-colors"
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {/* Icône d'information (Lucide-React style outline) */}
                      <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-indigo-800 dark:text-indigo-300 font-bold tracking-wider text-xs uppercase mb-4 transition-colors">
                        {t('quiz.explanation_title')}
                      </h3>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base transition-colors">
                        {formatRichText(currentQuestion.explanation)}
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'action "Suivant" */}
                  <div className="mt-8 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:ring-offset-2"
                    >
                      {currentIndex < questions.length - 1 ? t('quiz.next_question') : t('quiz.finish')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
