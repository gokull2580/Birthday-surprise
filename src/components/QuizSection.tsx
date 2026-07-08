/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizQuestion } from '../types';
import { Sparkles, HeartCrack, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface QuizSectionProps {
  quiz: QuizQuestion[];
}

export default function QuizSection({ quiz }: QuizSectionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedIdx === null || isSubmitted) return;
    
    setIsSubmitted(true);
    if (selectedIdx === currentQuestion.correctAnswerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedIdx(null);
    setIsSubmitted(false);

    if (currentIdx + 1 < quiz.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setIsSubmitted(false);
    setScore(0);
    setShowResults(false);
  };

  return (
    <div id="quiz-section" className="relative w-full py-16 px-4 md:px-8 bg-amber-50/10 rounded-2xl border border-rose-100/20 flex flex-col items-center">
      {/* Tape Tape tag */}
      <div className="absolute top-0 transform -translate-y-1/2 left-[33%] w-32 h-7 bg-red-100 border border-red-200 shadow-2xs rotate-[2deg] flex items-center justify-center font-cursive text-red-900 text-xs select-none">
        Relationship Quiz 📝
      </div>

      <div className="max-w-xl w-full text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-cursive">
          How Well Do You Know Us? 💖
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          A tiny fun quiz about our little milestones and sweet quirks. Let's see if you can get a perfect score!
        </p>
      </div>

      <div className="max-w-lg w-full bg-white border border-rose-100 shadow-xl rounded-2xl p-6 md:p-8 relative min-h-[360px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentIdx}
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Score & Progress Tracker */}
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-4 pb-2 border-b border-rose-100/50">
                  <span>Question {currentIdx + 1} of {quiz.length}</span>
                  <span className="text-rose-500 font-bold">Score: {score}</span>
                </div>

                {/* Question */}
                <h3 className="text-lg md:text-xl font-bold text-slate-800 font-sans tracking-wide leading-snug">
                  {currentQuestion.question}
                </h3>

                {/* Options List */}
                <div className="mt-6 space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    let btnClass = 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300';
                    let iconNode = null;

                    if (selectedIdx === idx) {
                      btnClass = 'border-rose-400 bg-rose-50/50 text-rose-800 font-semibold';
                    }

                    if (isSubmitted) {
                      if (idx === currentQuestion.correctAnswerIndex) {
                        btnClass = 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold';
                        iconNode = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
                      } else if (selectedIdx === idx) {
                        btnClass = 'border-rose-300 bg-rose-50 text-rose-800';
                        iconNode = <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
                      } else {
                        btnClass = 'border-slate-100 text-slate-350 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-3.5 border rounded-xl text-sm flex justify-between items-center transition-all ${btnClass}`}
                      >
                        <span className="leading-normal">{option}</span>
                        {iconNode}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quiz interactive submit control triggers */}
              <div className="mt-8 border-t border-rose-100/40 pt-4 flex justify-end">
                {!isSubmitted ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmitAnswer}
                    disabled={selectedIdx === null}
                    className={`text-xs font-mono font-bold uppercase tracking-widest px-4 py-2.5 rounded-full shadow-md transition-all ${
                      selectedIdx !== null
                        ? 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700'
                        : 'bg-slate-100 text-slate-350 border border-slate-250 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Lock Match
                  </motion.button>
                ) : (
                  <div className="w-full flex flex-col gap-4">
                    {/* Tiny feedback line */}
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 leading-normal font-sans">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        {selectedIdx === currentQuestion.correctAnswerIndex
                          ? currentQuestion.cuteFeedbackCorrect
                          : currentQuestion.cuteFeedbackIncorrect}
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNextQuestion}
                      className="text-xs font-mono font-bold uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-md self-end transition-colors"
                    >
                      {currentIdx + 1 < quiz.length ? 'Next Question' : 'Complete Quiz'}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-500 mb-4 shadow-sm">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>

              <h3 className="text-2xl font-black text-rose-700 font-cursive mb-1">
                Quiz Accomplished! 🎉
              </h3>
              
              <div className="mt-4 bg-slate-50 border border-slate-200/50 p-4 rounded-2xl w-full">
                <span className="text-sm text-slate-400 font-mono block">YOUR FINAL RATING:</span>
                <span className="text-4xl font-extrabold font-mono text-slate-800">
                  {score} / {quiz.length}
                </span>
                
                <p className="text-xs text-slate-500 mt-3 leading-relaxed font-sans max-w-xs mx-auto px-2">
                  {score === quiz.length
                    ? "Absolute perfection! You know every single tiny detail of our love storyline! You represent my favorite anchor in life. ❤️"
                    : "Not bad, my sunshine! But it makes for a wonderful reason for us to cuddle up, drink tea, and reminisce about these beautiful moments! 😘"}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRestartQuiz}
                className="mt-6 text-xs font-mono font-bold uppercase tracking-widest border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-full shadow-md flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restart Quiz
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
