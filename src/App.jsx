import { useState, useEffect, useRef } from 'react'
import './App.css'
import GameScreen from './components/GameScreen'
import JudgeScreen from './components/JudgeScreen'
import questionsData from './data/questions'

function App() {
  const isPlayer = window.location.search.includes('role=player')
  const role = isPlayer ? 'player' : 'judge'

  const [gameState, setGameState] = useState('waiting') // 'waiting', 'playing', 'gameover', 'won'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [moneyWon, setMoneyWon] = useState('$0')
  const [lockedAnswer, setLockedAnswer] = useState(null)
  const [revealedAnswer, setRevealedAnswer] = useState(false)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [isQuestionVisible, setIsQuestionVisible] = useState(false)

  // Lifelines State
  const initialLifelines = {
    fiftyFifty: { used: false, data: [] }, // data = hidden option strings
    askAudience: { used: false, active: false, data: [] }, // data = percentages [number, number, number, number] corresponding to options
    phoneFriend: { used: false, active: false, data: '' } // data = string message
  }
  const [lifelines, setLifelines] = useState(initialLifelines)

  const channelRef = useRef(null)
  
  // Keep a ref of the latest state to respond to player requests
  const stateRef = useRef({ gameState, currentQuestionIndex, moneyWon, lifelines, lockedAnswer, revealedAnswer, showCorrectAnswer, isQuestionVisible })
  useEffect(() => {
    stateRef.current = { gameState, currentQuestionIndex, moneyWon, lifelines, lockedAnswer, revealedAnswer, showCorrectAnswer, isQuestionVisible }
  }, [gameState, currentQuestionIndex, moneyWon, lifelines, lockedAnswer, revealedAnswer, showCorrectAnswer, isQuestionVisible])

  // Helper to sync state to other tabs
  const broadcastState = (newState) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SYNC_STATE',
        payload: { ...stateRef.current, ...newState }
      })
    }
  }

  useEffect(() => {
    channelRef.current = new BroadcastChannel('millionaire_game_channel')

    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data
      if (type === 'SYNC_STATE') {
        setGameState(payload.gameState)
        setCurrentQuestionIndex(payload.currentQuestionIndex)
        setMoneyWon(payload.moneyWon)
        setLockedAnswer(payload.lockedAnswer)
        setRevealedAnswer(payload.revealedAnswer)
        setShowCorrectAnswer(payload.showCorrectAnswer)
        setIsQuestionVisible(payload.isQuestionVisible)
        if (payload.lifelines) setLifelines(payload.lifelines)
      } else if (type === 'REQUEST_STATE' && role === 'judge') {
        // When a new player window opens, it asks for the state
        broadcastState(stateRef.current)
      }
    }

    if (role === 'player') {
      // Ask the judge for the current state when the player window loads
      channelRef.current.postMessage({ type: 'REQUEST_STATE' })
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close()
      }
    }
  }, [role])


  const startGame = async () => {
    if (role === 'judge') {
      try {
        // Check if the modern Window Management API is supported
        if ('getScreenDetails' in window) {
          const screenDetails = await window.getScreenDetails();
          const screens = screenDetails.screens;
          
          if (screens.length > 1) {
            // Find a screen that is different from the current one
            const secondaryScreen = screens.find(s => s !== screenDetails.currentScreen) || screens[1];
            
            // Open on the secondary screen using its coordinates
            window.open(
              window.location.origin + '?role=player', 
              'PlayerWindow', 
              `left=${secondaryScreen.left},top=${secondaryScreen.top},width=${secondaryScreen.width},height=${secondaryScreen.height},fullscreen=yes`
            );
          } else {
            // Fallback if only 1 screen detected
            window.open(window.location.origin + '?role=player', 'PlayerWindow', 'width=1280,height=720');
          }
        } else {
          // Fallback for unsupported browsers
          window.open(window.location.origin + '?role=player', 'PlayerWindow', 'width=1280,height=720');
        }
      } catch (error) {
        console.error("Could not automatically place window on second screen. Did you deny permissions?", error);
        window.open(window.location.origin + '?role=player', 'PlayerWindow', 'width=1280,height=720');
      }
    }

    const newState = {
      gameState: 'playing',
      currentQuestionIndex: 0,
      moneyWon: '$0',
      lifelines: initialLifelines,
      lockedAnswer: null,
      revealedAnswer: false,
      showCorrectAnswer: false,
      isQuestionVisible: false
    }
    setGameState(newState.gameState)
    setCurrentQuestionIndex(newState.currentQuestionIndex)
    setMoneyWon(newState.moneyWon)
    setLifelines(newState.lifelines)
    setLockedAnswer(newState.lockedAnswer)
    setRevealedAnswer(newState.revealedAnswer)
    setShowCorrectAnswer(newState.showCorrectAnswer)
    setIsQuestionVisible(newState.isQuestionVisible)
    broadcastState(newState)
  }

  const handleLifeline = (lifelineKey) => {
    if (lifelines[lifelineKey].used) return;
    
    let newLifelineData = { ...lifelines[lifelineKey], used: true, active: true };
    const currentQ = questionsData[currentQuestionIndex];
    
    if (lifelineKey === 'fiftyFifty') {
      const incorrects = currentQ.options.filter(o => o !== currentQ.answer);
      incorrects.sort(() => Math.random() - 0.5);
      newLifelineData.data = [incorrects[0], incorrects[1]];
    } else if (lifelineKey === 'askAudience') {
      let percentages = [0, 0, 0, 0];
      const correctIdx = currentQ.options.indexOf(currentQ.answer);
      let remaining = 100;
      const correctShare = Math.floor(Math.random() * 30) + 40; // 40-70%
      percentages[correctIdx] = correctShare;
      remaining -= correctShare;
      
      for(let i=0; i<4; i++) {
        if(i !== correctIdx) {
          const share = i === 3 ? remaining : (remaining > 0 ? Math.floor(Math.random() * remaining) : 0);
          percentages[i] = share;
          remaining -= share;
        }
      }
      newLifelineData.data = percentages;
    } else if (lifelineKey === 'phoneFriend') {
      newLifelineData.data = `I'm pretty sure it's ${currentQ.answer}!`;
    }
    
    const newLifelines = { ...lifelines, [lifelineKey]: newLifelineData };
    setLifelines(newLifelines);
    broadcastState({ lifelines: newLifelines });
  };

  const handleLockAnswer = (option) => {
    setLockedAnswer(option);
    broadcastState({ lockedAnswer: option });
  };

  const handleShowQuestion = () => {
    setIsQuestionVisible(true);
    broadcastState({ isQuestionVisible: true });
  };

  const handleShowCorrectAnswer = () => {
    setShowCorrectAnswer(true);
    broadcastState({ showCorrectAnswer: true });

    const resetLifelines = {
      fiftyFifty: { ...lifelines.fiftyFifty, active: false, data: [] },
      askAudience: { ...lifelines.askAudience, active: false },
      phoneFriend: { ...lifelines.phoneFriend, active: false }
    };

    setTimeout(() => {
      setLifelines(resetLifelines);
      if (currentQuestionIndex < questionsData.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setLockedAnswer(null);
        setRevealedAnswer(false);
        setShowCorrectAnswer(false);
        setIsQuestionVisible(false); // Show waiting screen
        broadcastState({ 
          gameState: 'playing', 
          currentQuestionIndex: nextIndex, 
          moneyWon, 
          lifelines: resetLifelines,
          lockedAnswer: null,
          revealedAnswer: false,
          showCorrectAnswer: false,
          isQuestionVisible: false
        });
      } else {
        setGameState('won');
        broadcastState({ 
          gameState: 'won', 
          currentQuestionIndex, 
          moneyWon, 
          lifelines: resetLifelines 
        });
      }
    }, 4000);
  };

  const handleRevealAnswer = () => {
    setRevealedAnswer(true);
    broadcastState({ revealedAnswer: true });

    const currentQ = questionsData[currentQuestionIndex];
    const isCorrect = lockedAnswer === currentQ.answer;

    const resetLifelines = {
      fiftyFifty: { ...lifelines.fiftyFifty, active: false, data: [] },
      askAudience: { ...lifelines.askAudience, active: false },
      phoneFriend: { ...lifelines.phoneFriend, active: false }
    };

    setTimeout(() => {
      setLifelines(resetLifelines);
      
      if (isCorrect) {
        const updatedPrize = currentQ.prize;
        setMoneyWon(updatedPrize);
        
        if (currentQuestionIndex < questionsData.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          setLockedAnswer(null);
          setRevealedAnswer(false);
          setShowCorrectAnswer(false);
          setIsQuestionVisible(false); // Show waiting screen
          broadcastState({ 
            gameState: 'playing', 
            currentQuestionIndex: nextIndex, 
            moneyWon: updatedPrize, 
            lifelines: resetLifelines,
            lockedAnswer: null,
            revealedAnswer: false,
            showCorrectAnswer: false,
            isQuestionVisible: false
          });
        } else {
          setGameState('won');
          broadcastState({ 
            gameState: 'won', 
            currentQuestionIndex: currentQuestionIndex, 
            moneyWon: updatedPrize, 
            lifelines: resetLifelines 
          });
        }
      } else {
        setGameState('gameover');
        broadcastState({ 
          gameState: 'gameover', 
          currentQuestionIndex, 
          moneyWon, 
          lifelines: resetLifelines 
        });
      }
    }, 4000);
  };

  if (role === 'judge') {
    return (
      <div className="app-container">
        <JudgeScreen 
          questionData={questionsData[currentQuestionIndex]}
          questionIndex={currentQuestionIndex}
          totalQuestions={questionsData.length}
          currentPrize={questionsData[currentQuestionIndex]?.prize || '$0'}
          gameState={gameState}
          onStartGame={startGame}
          lifelines={lifelines}
          onUseLifeline={handleLifeline}
          lockedAnswer={lockedAnswer}
          revealedAnswer={revealedAnswer}
          onRevealAnswer={handleRevealAnswer}
          showCorrectAnswer={showCorrectAnswer}
          onShowCorrectAnswer={handleShowCorrectAnswer}
          isQuestionVisible={isQuestionVisible}
          onShowQuestion={handleShowQuestion}
        />
      </div>
    )
  }

  // Player Role Rendering
  return (
    <div className="app-container">
      {gameState === 'waiting' && (
        <div className="start-screen">
          <div className="logo-container">
            <div className="logo-circle">
              <h1>WHO WANTS TO BE A</h1>
              <h2>MILLIONAIRE?</h2>
            </div>
          </div>
          <h2 style={{ color: '#ffb703', marginTop: '2rem' }}>Loading game...</h2>
        </div>
      )}
      
      {gameState === 'playing' && (
        <GameScreen 
          questionData={questionsData[currentQuestionIndex]} 
          questionIndex={currentQuestionIndex}
          totalQuestions={questionsData.length}
          onLockAnswer={handleLockAnswer}
          lockedAnswer={lockedAnswer}
          revealedAnswer={revealedAnswer}
          showCorrectAnswer={showCorrectAnswer}
          isQuestionVisible={isQuestionVisible}
          onAnswer={() => {}} // Legacy prop support
          currentPrize={questionsData[currentQuestionIndex].prize}
          lifelines={lifelines}
        />
      )}
      
      {gameState === 'gameover' && (
        <div className="end-screen game-over">
          <h1>Game Over!</h1>
          <h2>You walk away with: {moneyWon}</h2>
          <p style={{ color: '#a3a8ff' }}>Waiting for Judge to restart...</p>
        </div>
      )}
      
      {gameState === 'won' && (
        <div className="end-screen won">
          <h1>Congratulations!</h1>
          <h2>You are a Millionaire! You won {moneyWon}</h2>
          <p style={{ color: '#a3a8ff' }}>Waiting for Judge to restart...</p>
        </div>
      )}
    </div>
  )
}

export default App
