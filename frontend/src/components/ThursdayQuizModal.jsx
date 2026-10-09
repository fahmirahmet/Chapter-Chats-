import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, HelpCircle, CheckCircle2, AlertCircle, Award, Calendar, ArrowRight, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ThursdayQuizModal({ isOpen, onClose }) {
  const { refreshProfile } = useAuth();
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live Thursday Quiz from API on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        let res;
        try {
          res = await apiClient.get('/activities/thursday-quiz/');
        } catch {
          res = await apiClient.get('/activities/sunday-quiz/');
        }

        if (res.data && isMounted) {
          const qData = res.data;
          const questionsList = qData.questions || [];
          if (questionsList.length > 0) {
            const formatted = {
              id: qData.id,
              title: qData.title || 'Thursday Reading Quiz',
              bookTitle: qData.book_title || 'Active Cycle Book',
              timeLimitSeconds: qData.time_limit_seconds || 180,
              xpReward: 50,
              questions: questionsList.map(q => {
                const correctIdx = typeof q.correct_option === 'string' 
                  ? ['A', 'B', 'C', 'D'].indexOf(q.correct_option.toUpperCase())
                  : (q.correctIndex ?? 0);
                return {
                  question: q.prompt || q.question,
                  options: q.options || [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
                  correctIndex: correctIdx >= 0 ? correctIdx : 0,
                  explanation: q.explanation || 'Refer to the cycle reading target.'
                };
              })
            };
            setActiveQuiz(formatted);
            setSecondsRemaining(formatted.timeLimitSeconds);

            // If the user already completed this quiz, show results directly
            if (qData.has_completed || qData.user_has_completed) {
              setIsSubmitted(true);
              const scoreVal = qData.user_score ?? 0;
              setApiResult({
                score: scoreVal,
                total_questions: questionsList.length,
                is_perfect_score: (questionsList.length > 0 && scoreVal === questionsList.length),
                xp_earned: (questionsList.length > 0 && scoreVal === questionsList.length) ? 50 : Math.max(20, scoreVal * 10)
              });
            }
          } else {
            setActiveQuiz(null);
          }
        }
      } catch (err) {
        console.warn('Thursday quiz not available from API:', err);
        if (isMounted) setActiveQuiz(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuiz();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Timer Countdown logic
  useEffect(() => {
    if (!isOpen || isSubmitted || !activeQuiz) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isSubmitted, activeQuiz]);

  if (!isOpen) return null;

  const handleSelectOption = (optIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentStep]: optIdx }));
  };

  const calculateScore = () => {
    if (!activeQuiz) return 0;
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const handleFinish = async () => {
    setIsSubmitted(true);
    try {
      let res;
      try {
        res = await apiClient.post(`/activities/quizzes/${activeQuiz?.id || ''}/submit/`, {
          answers: selectedAnswers,
        });
      } catch {
        res = await apiClient.post('/activities/thursday-quiz/submit/', {
          answers: selectedAnswers,
        });
      }
      if (res.data) {
        setApiResult(res.data);
        if (typeof refreshProfile === 'function') {
          refreshProfile();
        }
      }
    } catch (err) {
      console.warn('API error submitting quiz answers:', err);
      if (err.response?.data?.detail) {
        setApiResult(prev => ({
          ...prev,
          score: calculateScore(),
          detail: err.response.data.detail
        }));
      }
    }
  };


  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const questions = activeQuiz?.questions || [];
  const currentQ = questions[currentStep] || questions[0];
  const finalScore = apiResult?.score ?? calculateScore();
  const isPerfectScore = apiResult?.is_perfect_score ?? (questions.length > 0 && finalScore === questions.length);
  const earnedXp = apiResult?.xp_earned ?? (isPerfectScore ? 50 : 20);

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    >
      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#F8F4EC] rounded-2xl shadow-2xl border-2 border-[#D8C8B0] overflow-hidden z-10 flex flex-col my-auto animate-slide-down"
      >
        {/* Top Header */}
        <div className="bg-[#2D1B0F] text-[#F8F4EC] p-5 sm:p-6 border-b-2 border-[#C48B47]/30 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#EFE7DA]/70 hover:text-white hover:bg-[#422817] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between gap-4 pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C48B47] text-[#2D1B0F] px-2.5 py-0.5 rounded-full">
                  Thursday Initiative
                </span>
                <span className="text-[11px] font-semibold text-[#EFE7DA]/80">
                  +50 XP Reward
                </span>
              </div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white">
                {activeQuiz?.title || 'Pre-Meetup Thursday Quiz'}
              </h3>
              <p className="text-xs text-[#EFE7DA]/80 font-medium">
                {activeQuiz?.bookTitle || 'Reading Progress Validation'}
              </p>
            </div>

            {/* Countdown Clock Display */}
            {activeQuiz && !isSubmitted && (
              <div className={`px-3.5 py-2 rounded-2xl border font-mono font-bold text-sm shrink-0 flex items-center gap-1.5 ${
                secondsRemaining < 30 
                  ? 'bg-rose-900 text-rose-200 border-rose-500 animate-pulse' 
                  : 'bg-[#1A0E06] text-[#C48B47] border-[#D8C8B0]/30'
              }`}>
                <Clock className="w-4 h-4 text-[#C48B47]" />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-[#2D1B0F] space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-xs font-semibold text-[#A35C33] flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 animate-spin" />
              <span>Loading Thursday Reading Quiz...</span>
            </div>
          ) : !activeQuiz ? (
            /* Empty State */
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EFE7DA] border-2 border-[#D8C8B0] flex items-center justify-center mx-auto text-[#A35C33]">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h4 className="font-serif font-bold text-xl text-[#2D1B0F]">
                No Thursday quiz scheduled for this reading cycle yet.
              </h4>
              <p className="text-xs text-[#2D1B0F]/70 max-w-sm mx-auto leading-relaxed">
                Quizzes open on Thursdays prior to the Tuesday review. Check back when the editorial team activates the next set!
              </p>
            </div>
          ) : !isSubmitted ? (
            /* Question Player Screen */
            <div className="space-y-6">
              {/* Question Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#2D1B0F]">
                  <span>Question {currentStep + 1} of {questions.length}</span>
                  <span className="text-[#A35C33] font-semibold">
                    {Math.round(((currentStep + 1) / questions.length) * 100)}% Completed
                  </span>
                </div>
                <div className="w-full bg-[#EFE7DA] h-2 rounded-full overflow-hidden border border-[#D8C8B0]">
                  <div 
                    className="bg-[#A35C33] h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Statement */}
              {currentQ && (
                <>
                  <div className="p-5 rounded-2xl bg-white border-2 border-[#D8C8B0] shadow-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#A35C33] tracking-wider">
                      Question Prompt
                    </span>
                    <h4 className="font-serif font-bold text-base sm:text-lg text-[#2D1B0F] leading-relaxed">
                      {currentQ.question}
                    </h4>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentStep] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full p-4 rounded-2xl border-2 text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#2D1B0F] text-[#FFF8EE] border-[#C48B47] shadow-sm'
                              : 'bg-white text-[#2D1B0F] border-[#D8C8B0] hover:bg-[#EFE7DA]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-serif text-xs font-bold shrink-0 ${
                              isSelected ? 'bg-[#C48B47] text-[#2D1B0F]' : 'bg-[#EFE7DA] text-[#2D1B0F]'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#C48B47] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-3xl bg-[#2D1B0F] text-[#F8F4EC] text-center space-y-3 border-2 border-[#C48B47]/40 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-[#C48B47] text-[#2D1B0F] flex items-center justify-center mx-auto shadow-sm">
                  <Award className="w-9 h-9" />
                </div>

                <h4 className="font-serif font-bold text-2xl text-white">
                  {isPerfectScore ? 'Perfect Score! 🎉' : `Quiz Completed: ${finalScore} / ${questions.length}`}
                </h4>

                <p className="text-xs text-[#EFE7DA]/85 max-w-md mx-auto">
                  {isPerfectScore 
                    ? `Outstanding! You achieved a perfect score and earned +${earnedXp} XP for your profile badge counter!`
                    : 'Good effort! Review the question explanations below before Tuesday\'s meeting.'
                  }
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A35C33] text-white font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-[#C48B47]" />
                  <span>+{earnedXp} XP Credited</span>
                </div>

                {/* Clean unclickable completion notice */}
                <div className="pt-2">
                  <div className="py-2.5 px-4 rounded-xl bg-[#1A0E06]/60 border border-[#C48B47]/30 text-center select-none pointer-events-none">
                    <p className="text-xs text-[#EFE7DA]/90 font-medium italic">
                      ✓ Quiz recorded. Points have been credited to your reader profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Explanations Recap List */}
              <div className="space-y-3">
                <h5 className="font-serif font-bold text-sm uppercase tracking-wider text-[#A35C33]">
                  Question Explanations &amp; Answers
                </h5>

                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const userAns = selectedAnswers[idx];
                    const isCorrect = userAns !== undefined ? userAns === q.correctIndex : null;
                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-white border border-[#D8C8B0] space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#2D1B0F]">Q{idx + 1}: {q.question}</span>
                          {isCorrect !== null && (
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#2D1B0F]/80 bg-[#F8F4EC] p-2.5 rounded-xl border border-[#D8C8B0]/60">
                          <strong className="text-[#A35C33]">Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="p-4 sm:p-5 bg-white border-t-2 border-[#D8C8B0] flex items-center justify-between">
          {!activeQuiz ? (
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2.5 rounded-xl bg-[#2D1B0F] text-[#F8F4EC] font-bold text-xs hover:bg-[#1A0E06] transition-colors cursor-pointer"
            >
              Close
            </button>
          ) : !isSubmitted ? (
            <>
              <button
                onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-xl border border-[#D8C8B0] text-[#2D1B0F] font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              {currentStep < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(prev + 1, questions.length - 1))}
                  className="px-5 py-2.5 rounded-xl bg-[#A35C33] text-white font-bold text-xs hover:bg-[#8B4C28] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 rounded-xl bg-[#2D1B0F] text-[#C48B47] border border-[#C48B47] font-bold text-xs hover:bg-[#1A0E06] transition-colors shadow-sm cursor-pointer"
                >
                  Submit Answers
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              type="button"
              className="ml-auto px-6 py-2.5 rounded-xl bg-[#2D1B0F] text-[#F8F4EC] font-bold text-xs hover:bg-[#1A0E06] transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

