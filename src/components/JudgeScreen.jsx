import React from 'react';
import './JudgeScreen.css';

const JudgeScreen = ({ questionData, questionIndex, totalQuestions, currentPrize, gameState, onStartGame, lifelines, onUseLifeline, lockedAnswer, revealedAnswer, onRevealAnswer, showCorrectAnswer, onShowCorrectAnswer, onNextQuestion, isQuestionVisible, onShowQuestion }) => {
  return (
    <div className="judge-screen">
      <div className="judge-header">
        <h1>Judge Control Panel</h1>
        <div className="header-right">
          {!isQuestionVisible && gameState === 'playing' && (
            <button className="next-btn header-btn" onClick={onShowQuestion} style={{ background: 'linear-gradient(90deg, #9d4edd, #5a189a)', boxShadow: '0 0 20px rgba(157, 78, 221, 0.5)' }}>
              DISPLAY TO PLAYER
            </button>
          )}
          {isQuestionVisible && lockedAnswer && !revealedAnswer && !showCorrectAnswer && (
            <button className="reveal-btn header-btn" onClick={onRevealAnswer}>
              REVEAL ANSWER
            </button>
          )}
          {isQuestionVisible && !lockedAnswer && !showCorrectAnswer && gameState === 'playing' && (
            <button className="show-correct-btn header-btn" onClick={onShowCorrectAnswer}>
              SHOW CORRECT ANSWER
            </button>
          )}
          {(gameState === 'gameover' || gameState === 'won') && (
            <button className="judge-start-btn header-btn" onClick={onStartGame} style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
              RESTART GAME
            </button>
          )}
          <div className="status-indicator">
            Status: <span className={`status-${gameState}`}>{gameState.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {gameState === 'waiting' && (
        <div className="judge-actions">
          <h2>Ready to begin?</h2>
          <button className="judge-start-btn" onClick={onStartGame}>START GAME</button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'gameover' || gameState === 'won') && questionData && (
        <div className="judge-dashboard">
          <div className="judge-sidebar">
            <div className="judge-info-panel">
              <h3>Current State</h3>
              <p><strong>Question:</strong> {questionIndex + 1} of {totalQuestions}</p>
              <p><strong>Playing for:</strong> {currentPrize}</p>
            </div>
            
            {gameState === 'playing' && (
              <div className="judge-lifelines-panel">
                <h3>Lifelines</h3>
                <button 
                  className={`lifeline-btn ${lifelines?.fiftyFifty?.used ? 'used' : ''}`}
                  onClick={() => onUseLifeline('fiftyFifty')}
                  disabled={lifelines?.fiftyFifty?.used}
                >
                  50:50
                </button>
                <button 
                  className={`lifeline-btn ${lifelines?.askAudience?.used ? 'used' : ''}`}
                  onClick={() => onUseLifeline('askAudience')}
                  disabled={lifelines?.askAudience?.used}
                >
                  Ask Audience
                </button>
                <button 
                  className={`lifeline-btn ${lifelines?.phoneFriend?.used ? 'used' : ''}`}
                  onClick={() => onUseLifeline('phoneFriend')}
                  disabled={lifelines?.phoneFriend?.used}
                >
                  Phone a Friend
                </button>
              </div>
            )}
          </div>

          <div className="judge-question-panel">
            <h3>Question {questionIndex + 1}</h3>
            <p className="judge-question-text">{questionData.question}</p>
            
            <div className="judge-options">
              {questionData.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`judge-option 
                    ${option === questionData.answer ? 'correct-answer' : ''}
                    ${option === lockedAnswer ? 'locked-answer' : ''}
                  `}
                >
                  <span>{String.fromCharCode(65 + index)}: {option}</span>
                  <div className="badges">
                    {option === lockedAnswer && <span className="locked-badge">LOCKED IN</span>}
                    {option === questionData.answer && (revealedAnswer || showCorrectAnswer) && <span className="correct-badge">CORRECT</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {(gameState === 'gameover' || gameState === 'won') && (
        <div className="judge-actions">
          <h2>Game Finished</h2>
          <button className="judge-start-btn" onClick={onStartGame}>RESTART GAME</button>
        </div>
      )}
    </div>
  );
};

export default JudgeScreen;
