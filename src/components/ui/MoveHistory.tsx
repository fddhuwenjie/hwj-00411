import React, { useRef, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatEvaluation, getEvaluationColor } from '../../chess/evaluation';

export const MoveHistory: React.FC = () => {
  const { moves, moveEvaluations, isReplayMode, replayIndex, replayToIndex, enterReplayMode } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !isReplayMode) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves, isReplayMode]);

  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];
    const whiteEval = moveEvaluations[i];
    const blackEval = moveEvaluations[i + 1];
    
    pairs.push({
      number: i / 2 + 1,
      white: whiteMove?.notation || '',
      black: blackMove?.notation || '',
      whiteEval,
      blackEval,
      whiteIndex: i,
      blackIndex: i + 1,
    });
  }

  const handleMoveClick = (index: number) => {
    if (index < 0 || index >= moves.length) return;
    
    if (!isReplayMode) {
      enterReplayMode();
      setTimeout(() => {
        replayToIndex(index);
      }, 50);
    } else {
      replayToIndex(index);
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
        <ScrollText className="w-5 h-5" />
        走法记录
      </h3>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {moves.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">
            暂无走法记录
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="text-slate-500 text-xs">
                <th className="text-left py-1 px-2 w-12">#</th>
                <th className="text-left py-1 px-2 text-amber-200">白方</th>
                <th className="text-left py-1 px-2 text-slate-300">黑方</th>
                <th className="text-right py-1 px-2 text-slate-400">评估</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair, i) => (
                <React.Fragment key={i}>
                  <tr 
                    className={`border-b border-slate-700/50 ${
                      isReplayMode && (pair.whiteIndex === replayIndex || pair.blackIndex === replayIndex)
                        ? 'bg-indigo-900/50'
                        : i === pairs.length - 1 && !isReplayMode
                        ? 'bg-slate-700/30'
                        : ''
                    }`}
                  >
                    <td className="py-1.5 px-2 text-slate-500 font-mono">
                      {pair.number}.
                    </td>
                    <td 
                      className={`py-1.5 px-2 font-mono cursor-pointer rounded transition-colors hover:bg-slate-700/50 ${
                        isReplayMode && pair.whiteIndex === replayIndex
                          ? 'bg-indigo-600/50 text-white'
                          : 'text-amber-100'
                      }`}
                      onClick={() => handleMoveClick(pair.whiteIndex)}
                    >
                      {pair.white}
                    </td>
                    <td 
                      className={`py-1.5 px-2 font-mono cursor-pointer rounded transition-colors hover:bg-slate-700/50 ${
                        pair.black && isReplayMode && pair.blackIndex === replayIndex
                          ? 'bg-indigo-600/50 text-white'
                          : 'text-slate-300'
                      }`}
                      onClick={() => pair.black && handleMoveClick(pair.blackIndex)}
                    >
                      {pair.black}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {pair.blackEval !== undefined ? (
                        <span className={getEvaluationColor(pair.blackEval)}>
                          {formatEvaluation(pair.blackEval)}
                        </span>
                      ) : pair.whiteEval !== undefined ? (
                        <span className={getEvaluationColor(pair.whiteEval)}>
                          {formatEvaluation(pair.whiteEval)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>共 {moves.length} 步</span>
        {!isReplayMode && moves.length > 0 && (
          <button
            onClick={enterReplayMode}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            点击走法进入回放
          </button>
        )}
        {isReplayMode && (
          <span className="text-indigo-400">回放模式 - 点击跳转</span>
        )}
      </div>
    </div>
  );
};
