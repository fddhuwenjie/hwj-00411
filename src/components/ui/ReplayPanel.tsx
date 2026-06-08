import React, { useState } from 'react';
import { SkipBack, SkipForward, ChevronLeft, ChevronRight, X, Download, Upload, Copy, Check } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatEvaluation, getEvaluationColor } from '../../chess/evaluation';

export const ReplayPanel: React.FC = () => {
  const { 
    isReplayMode, enterReplayMode, exitReplayMode, 
    replayNext, replayPrev, replayToIndex, 
    replayIndex, moves, moveEvaluations, exportPGN, importPGN 
  } = useGameStore();
  
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState(false);

  const canReplay = moves.length > 0 && !isReplayMode;
  const canPrev = isReplayMode && replayIndex >= 0;
  const canNext = isReplayMode && replayIndex < moves.length - 1;
  const canFirst = isReplayMode && replayIndex > -1;
  const canLast = isReplayMode && replayIndex < moves.length - 1;

  const handleExport = () => {
    const pgn = exportPGN();
    navigator.clipboard.writeText(pgn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const success = importPGN(importText);
    if (success) {
      setShowImport(false);
      setImportText('');
      setImportError(false);
    } else {
      setImportError(true);
    }
  };

  const timelineSteps = [];
  for (let i = -1; i < moves.length; i++) {
    timelineSteps.push(i);
  }

  if (!isReplayMode && !canReplay) {
    return null;
  }

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700">
      {!isReplayMode ? (
        <button
          onClick={enterReplayMode}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
        >
          <SkipBack className="w-5 h-5" />
          进入回放模式
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
              <SkipBack className="w-5 h-5" />
              回放模式
            </h3>
            <button
              onClick={exitReplayMode}
              className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-2">
              步数: {replayIndex + 1} / {moves.length}
            </div>
            <div className="flex items-center justify-center gap-1 mb-3">
              <button
                onClick={() => replayToIndex(-1)}
                disabled={!canFirst}
                className={`p-2 rounded-lg transition-colors ${
                  canFirst ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={replayPrev}
                disabled={!canPrev}
                className={`p-2 rounded-lg transition-colors ${
                  canPrev ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={replayNext}
                disabled={!canNext}
                className={`p-2 rounded-lg transition-colors ${
                  canNext ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => replayToIndex(moves.length - 1)}
                disabled={!canLast}
                className={`p-2 rounded-lg transition-colors ${
                  canLast ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-8">
              <div className="absolute inset-0 flex items-center gap-0.5 overflow-x-auto pb-2">
                {timelineSteps.map((idx) => (
                  <button
                    key={idx}
                    onClick={() => replayToIndex(idx)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium transition-all ${
                      idx === replayIndex
                        ? 'bg-indigo-500 text-white scale-110'
                        : idx < replayIndex
                        ? 'bg-indigo-400/50 text-white'
                        : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {moves.length > 0 && replayIndex >= 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">当前局面评估:</span>
                <span className={`font-mono font-bold ${getEvaluationColor(moveEvaluations[replayIndex] || 0)}`}>
                  {formatEvaluation(moveEvaluations[replayIndex] || 0)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-slate-500">第 {Math.floor(replayIndex / 2) + 1} 回合:</div>
                <span className={`font-mono text-sm ${replayIndex % 2 === 0 ? 'text-amber-200' : 'text-slate-300'}`}>
                  {moves[replayIndex]?.notation}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {copied ? '已复制' : '导出 PGN'}
            </button>
            <button
              onClick={() => {
                setShowImport(!showImport);
                setImportText('');
                setImportError(false);
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-500 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              导入 PGN
            </button>
          </div>

          {showImport && (
            <div className="space-y-2">
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(false);
                }}
                placeholder="粘贴 PGN 格式文本..."
                className={`w-full h-24 px-3 py-2 rounded-lg bg-slate-900 text-slate-300 text-sm font-mono border ${
                  importError ? 'border-red-500' : 'border-slate-600'
                } focus:outline-none focus:border-indigo-500 resize-none`}
              />
              {importError && (
                <div className="text-red-400 text-xs">导入失败，请检查 PGN 格式是否正确</div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex-1 px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                  确认导入
                </button>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportText('');
                    setImportError(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-500 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
