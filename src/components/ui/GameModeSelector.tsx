import React from 'react';
import { User, Users, Monitor } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { GameMode } from '../../chess/types';
import { TimerControls } from './TimerDisplay';

const modes: { value: GameMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'single',
    label: '单人对战',
    icon: <User className="w-5 h-5" />,
    description: '执白对战 AI',
  },
  {
    value: 'hotseat',
    label: '热座模式',
    icon: <Users className="w-5 h-5" />,
    description: '双人同屏轮流对战',
  },
];

export const GameModeSelector: React.FC = () => {
  const { gameMode, setGameMode, moves } = useGameStore();
  const canChange = moves.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          游戏模式
        </label>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setGameMode(mode.value)}
              disabled={!canChange}
              className={`p-3 rounded-lg text-left transition-all ${
                gameMode === mode.value
                  ? 'bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border-2 border-purple-400 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700 hover:border-slate-600'
              } ${!canChange ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`flex items-center gap-2 mb-1 ${
                gameMode === mode.value ? 'text-purple-300' : 'text-slate-300'
              }`}>
                {mode.icon}
                <span className="font-medium text-sm">{mode.label}</span>
              </div>
              <div className="text-xs text-slate-500">{mode.description}</div>
            </button>
          ))}
        </div>
      </div>

      <TimerControls />
    </div>
  );
};
