import React from 'react';
import { ChessScene } from '../components/3d/ChessScene';
import { ControlPanel } from '../components/ui/ControlPanel';
import { GameStatus } from '../components/ui/GameStatus';
import { MoveHistory } from '../components/ui/MoveHistory';
import { PromotionModal } from '../components/ui/PromotionModal';
import { ReplayPanel } from '../components/ui/ReplayPanel';
import { TimerDisplay } from '../components/ui/TimerDisplay';
import { OpeningInfo } from '../components/ui/OpeningInfo';
import { useGameStore } from '../store/gameStore';

const Home: React.FC = () => {
  const { gameMode, timerEnabled, currentTurn, gameStatus } = useGameStore();

  const getHeaderText = () => {
    if (gameMode === 'hotseat') {
      return '热座模式 · 双人同屏对战';
    }
    return '执白先行 · 对战 AI';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="p-4 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            ♔ 3D 国际象棋
          </h1>
          <p className="text-slate-400 text-sm">
            {getHeaderText()}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            {timerEnabled && (gameMode === 'hotseat' || currentTurn === 'white') && (
              <div className="flex justify-start mb-3">
                <TimerDisplay side="white" />
              </div>
            )}

            <div className="game-wrapper rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 relative">
              <ChessScene />
              
              {(gameStatus === 'checkmate' || gameStatus === 'stalemate') && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="bg-slate-800 rounded-2xl p-8 text-center border border-slate-600 shadow-2xl">
                    <div className="text-6xl mb-4">
                      {gameStatus === 'checkmate' ? '🏆' : '🤝'}
                    </div>
                    <div className="text-2xl font-bold text-amber-400 mb-2">
                      {gameStatus === 'checkmate' 
                        ? (currentTurn === 'white' ? '黑方获胜！' : '白方获胜！')
                        : '和棋（逼和）'
                      }
                    </div>
                    <div className="text-slate-400 text-sm">
                      {gameStatus === 'checkmate' ? '将军！' : '无子可动'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {timerEnabled && gameMode === 'hotseat' && (
              <div className="flex justify-end mt-3">
                <TimerDisplay side="black" />
              </div>
            )}
          </div>

          <div className="lg:w-80 flex flex-col gap-4">
            <GameStatus />
            <ControlPanel />
            <OpeningInfo />
            <ReplayPanel />
            <div className="flex-1 min-h-[200px]">
              <MoveHistory />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-amber-400 font-semibold mb-2">操作说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>点击己方棋子选中，查看合法移动位置</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>点击绿色标记的格子移动棋子</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>鼠标拖拽旋转视角，滚轮缩放（仅自由视角）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>支持王车易位、吃过路兵、兵升变</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>进入回放模式可逐步查看历史走法</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500">•</span>
              <span>热座模式下每步自动切换视角</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-500">•</span>
              <span>开启计时器，超时自动判负</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>点击提示按钮获取最佳走法建议</span>
            </div>
          </div>
        </div>
      </main>

      <PromotionModal />
    </div>
  );
};

export default Home;
