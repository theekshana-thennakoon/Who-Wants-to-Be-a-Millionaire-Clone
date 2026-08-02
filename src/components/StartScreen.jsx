import React from 'react';
import './StartScreen.css';

const StartScreen = ({ onStart }) => {
  return (
    <div className="start-screen">
      <div className="logo-container">
        <div className="logo-circle">
          <h1>WHO WANTS TO BE A</h1>
          <h2>MILLIONAIRE?</h2>
        </div>
      </div>
      <p className="rules">Answer 9 questions correctly to win $1,000,000!</p>
      <button className="start-btn" onClick={onStart}>
        Play Now
      </button>
    </div>
  );
};

export default StartScreen;
