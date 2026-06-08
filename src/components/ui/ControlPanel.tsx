import React from 'react';
import { RotateCcw, Eye, RefreshCw } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { ViewMode, Difficulty } from '../../chess/types';
import { GameModeSelector } from './GameModeSelector';

const viewModes: { value: ViewMode; label: string; icon: string }[] = [
  { value: 'white', label: '白方视角', icon: '♔' },
  { value: 'black', label: '黑方视角', icon: '♚' },
  { value: 'top', label: '俯视视角', icon: '⬇' },
  { value: 'free', label: '自由视角', icon: '🔄' },
];

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
];

export const ControlPanel: React.FC = () => {
  const { viewMode, difficulty, setViewMode, setDifficulty, undo, resetGame, moves, currentTurn, gameStatus, isAIThinking, gameMode, isReplayMode, isRotating } = useGameStore();

  const canUndo = moves.length > 0 && !isReplayMode && !isRotating && gameStatus === 'playing' && !isAIThinking && (gameMode === 'single' ? currentTurn === 'white' : true);
  const canReset = gameStatus === 'checkmate' || gameStatus === 'stalemate' || moves.length > 0;
  const showDifficulty = gameMode === 'single' && moves.length === 0;
  const showViewMode = !isReplayMode && !isRotating;

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700">
      <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
        <Eye className="w-5 h-5" />
        控制面板
      </h3>

      <div className="space-y-4">
        {moves.length === 0 && (
          <GameModeSelector />
        )}

        {showViewMode && (
          <div>
            <label className="text-sm text-slate-400 mb-2 block">视角模式</label>
            <div className="grid grid-cols-2 gap-2">
              {viewModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                    viewMode === mode.value
                      ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showDifficulty && (
          <div>
            <label className="text-sm text-slate-400 mb-2 block">AI 难度</label>
            <div className="grid grid-cols-2 gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setDifficulty(diff.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    difficulty === diff.value
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              canUndo
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            悔棋
          </button>

          <button
            onClick={resetGame}
            disabled={!canReset}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              canReset
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            重开
          </button>
        </div>

        {isReplayMode && (
          <div className="bg-indigo-900/50 rounded-lg p-3 border border-indigo-500/50">
            <div className="text-indigo-300 text-sm text-center">
              回放模式 - 使用下方控制面板操作
            </div>
          </div>
        )}

        {isRotating && (
          <div className="bg-purple-900/50 rounded-lg p-3 border border-purple-500/50">
            <div className="text-purple-300 text-sm text-center animate-pulse">
              切换视角中...
            </div>
          </div>
        )}

        {isAIThinking && (
          <div className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-amber-400 text-sm font-medium">AI 思考中...</span>
          </div>
        )}

        {gameMode === 'hotseat' && moves.length === 0 && (
          <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
            <div className="text-purple-300 text-xs text-center">
              热座模式：白方先行，走棋后自动切换到黑方视角
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
