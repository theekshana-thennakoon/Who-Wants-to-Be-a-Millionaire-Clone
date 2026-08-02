import React, { useState, useEffect } from 'react';
import './GameScreen.css';
import questionsData from '../data/questions';

const GameScreen = ({ questionData, questionIndex, totalQuestions, onAnswer, currentPrize }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    // Reset state when new question loads
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [questionData]);

  const handleOptionClick = (option) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks

    setSelectedAnswer(option);

    // Simulate "locking in" answer suspense
    setTimeout(() => {
      const correct = option === questionData.answer;
      setIsCorrect(correct);
      
      // Tell parent app the result after a brief delay showing the correct/incorrect colors
      onAnswer(correct, questionData.prize);
    }, 2000);
  };

  const getOptionClass = (option) => {
    if (selectedAnswer === null) return 'option-btn';
    
    if (option === selectedAnswer) {
      if (isCorrect === null) return 'option-btn selected'; // Locked in
      if (isCorrect === true) return 'option-btn correct';
      if (isCorrect === false) return 'option-btn incorrect';
    } else {
      // Highlight correct answer if user got it wrong
      if (isCorrect === false && option === questionData.answer) {
        return 'option-btn correct';
      }
    }
    return 'option-btn disabled';
  };

  return (
    <div className="game-screen">
      <div className="main-game-area">
        <div className="question-header">
          <span>Question {questionIndex + 1} of {totalQuestions}</span>
          <span className="current-prize">For {currentPrize}</span>
        </div>
        
        <div className="question-box">
          <h2>{questionData.question}</h2>
        </div>

        <div className="options-grid">
          {questionData.options.map((option, index) => (
            <button 
              key={index}
              className={getOptionClass(option)}
              onClick={() => handleOptionClick(option)}
              disabled={selectedAnswer !== null}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}: </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="prize-ladder">
        <h3>Prizes</h3>
        <ul>
          {[...questionsData].reverse().map((q, idx) => {
            const ladderIndex = totalQuestions - 1 - idx;
            let liClass = 'ladder-item';
            if (ladderIndex === questionIndex) liClass += ' active';
            if (ladderIndex < questionIndex) liClass += ' passed';
            return (
              <li key={idx} className={liClass}>
                <span className="ladder-num">{ladderIndex + 1}</span>
                <span className="ladder-prize">{q.prize}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default GameScreen;
