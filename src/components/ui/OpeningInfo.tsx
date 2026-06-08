import React from 'react';
import { BookOpen, Lightbulb } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const OpeningInfo: React.FC = () => {
  const { detectedOpening, moves, showHint, gameStatus, isReplayMode, isAIThinking, hintArrow } = useGameStore();

  const canShowHint = !isReplayMode && gameStatus === 'playing' && !isAIThinking && !hintArrow;

  if (!detectedOpening && moves.length < 2) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            开局信息
          </h3>
          <button
            onClick={showHint}
            disabled={!canShowHint}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              canShowHint
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            提示
          </button>
        </div>
        <div className="mt-3 text-slate-500 text-sm text-center py-2">
          开始走棋后自动识别开局
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          开局信息
        </h3>
        <button
          onClick={showHint}
          disabled={!canShowHint}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            canShowHint
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          提示
        </button>
      </div>

      {detectedOpening ? (
        <div className="space-y-2">
          <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-lg p-3 border border-cyan-500/30">
            <div className="text-cyan-300 font-semibold text-lg">
              {detectedOpening.name}
            </div>
            <div className="text-slate-400 text-sm italic">
              {detectedOpening.nameEn}
            </div>
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-2">标准走法:</div>
            <div className="flex flex-wrap gap-1">
              {detectedOpening.moves.map((move, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded text-xs font-mono ${
                    i < moves.length
                      ? 'bg-emerald-600/50 text-emerald-200'
                      : 'bg-slate-600/50 text-slate-400'
                  }`}
                >
                  {Math.floor(i / 2) + 1}.{i % 2 === 0 ? '' : '..'}{move}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <div className="text-slate-400 text-sm">
            未识别到标准开局
          </div>
          <div className="text-slate-500 text-xs mt-1">
            可能是不常见的开局或自定义走法
          </div>
        </div>
      )}

      {hintArrow && (
        <div className="mt-3 bg-blue-900/50 rounded-lg p-2 border border-blue-500/50 flex items-center justify-center gap-2 animate-pulse">
          <Lightbulb className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-sm">蓝色箭头显示最佳走法建议</span>
        </div>
      )}
    </div>
  );
};
