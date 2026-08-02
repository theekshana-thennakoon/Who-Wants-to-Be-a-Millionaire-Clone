import { useState } from 'react'
import './App.css'
import StartScreen from './components/StartScreen'
import GameScreen from './components/GameScreen'
import questionsData from './data/questions'

function App() {
  const [gameState, setGameState] = useState('start') // 'start', 'playing', 'gameover', 'won'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [moneyWon, setMoneyWon] = useState('$0')

  const startGame = () => {
    setGameState('playing')
    setCurrentQuestionIndex(0)
    setMoneyWon('$0')
  }

  const handleAnswer = (isCorrect, nextPrize) => {
    if (isCorrect) {
      setMoneyWon(nextPrize)
      if (currentQuestionIndex < questionsData.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
        }, 2000)
      } else {
        setTimeout(() => {
          setGameState('won')
        }, 2000)
      }
    } else {
      setTimeout(() => {
        setGameState('gameover')
      }, 2000)
    }
  }

  return (
    <div className="app-container">
      {gameState === 'start' && <StartScreen onStart={startGame} />}
      {gameState === 'playing' && (
        <GameScreen 
          questionData={questionsData[currentQuestionIndex]} 
          questionIndex={currentQuestionIndex}
          totalQuestions={questionsData.length}
          onAnswer={handleAnswer} 
          currentPrize={questionsData[currentQuestionIndex].prize}
        />
      )}
      {gameState === 'gameover' && (
        <div className="end-screen game-over">
          <h1>Game Over!</h1>
          <h2>You walk away with: {moneyWon}</h2>
          <button className="play-again-btn" onClick={startGame}>Play Again</button>
        </div>
      )}
      {gameState === 'won' && (
        <div className="end-screen won">
          <h1>Congratulations!</h1>
          <h2>You are a Millionaire! You won {moneyWon}</h2>
          <button className="play-again-btn" onClick={startGame}>Play Again</button>
        </div>
      )}
    </div>
  )
}

export default App
