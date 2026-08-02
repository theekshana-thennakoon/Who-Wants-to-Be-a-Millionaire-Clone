import React, { useState, useEffect } from 'react';
import './GameScreen.css';
import questionsData from '../data/questions';

const GameScreen = ({ questionData, questionIndex, totalQuestions, onLockAnswer, lockedAnswer, revealedAnswer, showCorrectAnswer, currentPrize, lifelines, isQuestionVisible }) => {

  const playSound = (isCorrect) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (isCorrect) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1.5);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1);
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    if (revealedAnswer && lockedAnswer) {
      const isCorrect = lockedAnswer === questionData.answer;
      playSound(isCorrect);
    }
  }, [revealedAnswer, lockedAnswer, questionData.answer]);

  useEffect(() => {
    if (showCorrectAnswer) {
      playSound(true);
    }
  }, [showCorrectAnswer]);

  const handleOptionClick = (option) => {
    if (lockedAnswer !== null || showCorrectAnswer) return; // Prevent multiple clicks
    onLockAnswer(option);
  };

  const getOptionClass = (option) => {
    if (showCorrectAnswer && option === questionData.answer) {
      return 'option-btn correct';
    }

    if (lockedAnswer === null) return 'option-btn';
    
    if (option === lockedAnswer) {
      if (!revealedAnswer) return 'option-btn selected'; // Locked in
      
      const isCorrect = lockedAnswer === questionData.answer;
      if (isCorrect) return 'option-btn correct';
      return 'option-btn incorrect';
    } else {
      // Highlight correct answer if user got it wrong
      if (revealedAnswer && option === questionData.answer) {
        return 'option-btn correct';
      }
    }
    return 'option-btn disabled';
  };

  // Determine if option is hidden by 50:50
  const isOptionHidden = (option) => {
    return lifelines?.fiftyFifty?.active && lifelines.fiftyFifty.data.includes(option);
  };

  return (
    <div className="game-screen">
      {!isQuestionVisible ? (
        <div className="waiting-screen">
          <div className="pulse-circle"></div>
          <h1 className="waiting-title">QUESTION {questionIndex + 1}</h1>
          <h2 className="waiting-prize">Playing for {currentPrize}</h2>
          <div className="waiting-animation">
            <span>Get Ready...</span>
          </div>
        </div>
      ) : (
        <div className="main-game-area">
          <div className="lifelines-display">
            <div className={`lifeline-icon ${lifelines?.fiftyFifty?.used ? 'used' : ''}`}>50:50</div>
            <div className={`lifeline-icon ${lifelines?.askAudience?.used ? 'used' : ''}`}>🗣️ Ask</div>
            <div className={`lifeline-icon ${lifelines?.phoneFriend?.used ? 'used' : ''}`}>📞 Phone</div>
          </div>

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
                disabled={lockedAnswer !== null || isOptionHidden(option)}
                style={{ visibility: isOptionHidden(option) ? 'hidden' : 'visible' }}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}: </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Lifeline Modals */}
      {lifelines?.askAudience?.active && (
        <div className="lifeline-modal-overlay">
          <div className="lifeline-modal">
            <h2>Ask the Audience</h2>
            <div className="audience-chart">
              {lifelines.askAudience.data.map((percent, idx) => (
                <div key={idx} className="chart-bar-container">
                  <div className="chart-bar" style={{ height: `${percent}%` }}>
                    <span className="chart-percent">{percent}%</span>
                  </div>
                  <span className="chart-label">{String.fromCharCode(65 + idx)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {lifelines?.phoneFriend?.active && (
        <div className="lifeline-modal-overlay">
          <div className="lifeline-modal">
            <h2>Phone a Friend</h2>
            <p className="friend-quote">"{lifelines.phoneFriend.data}"</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameScreen;
