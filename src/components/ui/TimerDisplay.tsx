import React, { useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { PIECE_SYMBOLS } from '../../chess/types';

interface TimerDisplayProps {
  side: 'white' | 'black';
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 100);
  
  if (ms < 30000) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ side }) => {
  const { 
    whiteTime, blackTime, currentTurn, timerEnabled, timerActive, 
    gameStatus, isReplayMode, updateTimer, startTimer, gameMode, moves
  } = useGameStore();

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerEnabled && timerActive && !isReplayMode && gameStatus === 'playing') {
      intervalRef.current = window.setInterval(() => {
        updateTimer();
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerEnabled, timerActive, isReplayMode, gameStatus, updateTimer]);

  useEffect(() => {
    if (timerEnabled && moves.length === 1 && !timerActive && gameStatus === 'playing') {
      startTimer();
    }
  }, [moves.length, timerEnabled, timerActive, gameStatus, startTimer]);

  if (!timerEnabled) {
    return null;
  }

  const time = side === 'white' ? whiteTime : blackTime;
  const isActive = currentTurn === side && timerActive && gameStatus === 'playing';
  const isLow = time < 30000;
  const isCritical = time < 10000;

  const showTimer = gameMode === 'hotseat' || (gameMode === 'single' && side === 'white');

  if (!showTimer) {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
        isActive 
          ? isCritical 
            ? 'bg-red-900/80 border-2 border-red-500 shadow-lg shadow-red-500/50 animate-pulse' 
            : isLow 
            ? 'bg-amber-900/80 border-2 border-amber-500 shadow-lg shadow-amber-500/30' 
            : 'bg-slate-800/90 border-2 border-emerald-500 shadow-lg shadow-emerald-500/30'
          : 'bg-slate-800/60 border border-slate-700'
      }`}
    >
      <div className="text-3xl">
        {PIECE_SYMBOLS[side].king}
      </div>
      
      <div className="flex flex-col">
        <div className="text-xs text-slate-400 mb-0.5">
          {side === 'white' ? '白方' : '黑方'}
        </div>
        <div 
          className={`font-mono text-2xl font-bold tracking-wider transition-colors ${
            isCritical 
              ? 'text-red-400' 
              : isLow 
              ? 'text-amber-400' 
              : isActive 
              ? 'text-emerald-400' 
              : 'text-slate-400'
          }`}
        >
          {formatTime(time)}
        </div>
      </div>

      {isCritical && (
        <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
      )}
      
      {isActive && !isCritical && !isLow && (
        <Clock className="w-5 h-5 text-emerald-400" />
      )}
    </div>
  );
};

export const TimerControls: React.FC = () => {
  const { timerEnabled, timerDuration, setTimerEnabled, setTimerDuration, moves, gameStatus } = useGameStore();

  const durations: { value: 5 | 10 | 15; label: string }[] = [
    { value: 5, label: '5分钟' },
    { value: 10, label: '10分钟' },
    { value: 15, label: '15分钟' },
  ];

  const canChange = moves.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          计时器
        </label>
        <button
          onClick={() => setTimerEnabled(!timerEnabled)}
          disabled={!canChange}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            timerEnabled ? 'bg-emerald-500' : 'bg-slate-600'
          } ${!canChange ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div 
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              timerEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {timerEnabled && (
        <div>
          <label className="text-xs text-slate-500 mb-2 block">总时长</label>
          <div className="grid grid-cols-3 gap-1">
            {durations.map((d) => (
              <button
                key={d.value}
                onClick={() => setTimerDuration(d.value)}
                disabled={!canChange}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timerDuration === d.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                } ${!canChange ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
