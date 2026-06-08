import React, { useEffect, useState } from 'react';
import { Crown, AlertTriangle, Trophy, Handshake } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { PIECE_SYMBOLS } from '../../chess/types';

export const GameStatus: React.FC = () => {
  const { currentTurn, gameStatus, isAIThinking, capturedPieces } = useGameStore();
  const [checkFlash, setCheckFlash] = useState(false);

  useEffect(() => {
    if (gameStatus === 'check') {
      const interval = setInterval(() => {
        setCheckFlash(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setCheckFlash(false);
    }
  }, [gameStatus]);

  const getStatusText = () => {
    switch (gameStatus) {
      case 'check':
        return '将军！';
      case 'checkmate':
        return currentTurn === 'white' ? '黑方获胜！' : '白方获胜！';
      case 'stalemate':
        return '和棋（逼和）';
      case 'draw':
        return '和棋';
      default:
        return currentTurn === 'white' ? '白方回合' : '黑方回合';
    }
  };

  const getStatusColor = () => {
    switch (gameStatus) {
      case 'check':
        return checkFlash ? 'text-red-500' : 'text-red-400';
      case 'checkmate':
        return 'text-emerald-400';
      case 'stalemate':
      case 'draw':
        return 'text-amber-400';
      default:
        return currentTurn === 'white' ? 'text-amber-100' : 'text-slate-300';
    }
  };

  const getStatusIcon = () => {
    switch (gameStatus) {
      case 'check':
        return <AlertTriangle className={`w-6 h-6 ${checkFlash ? 'text-red-500' : 'text-red-400'} animate-pulse`} />;
      case 'checkmate':
        return <Trophy className="w-6 h-6 text-emerald-400" />;
      case 'stalemate':
      case 'draw':
        return <Handshake className="w-6 h-6 text-amber-400" />;
      default:
        return currentTurn === 'white' ? (
          <span className="text-3xl">{PIECE_SYMBOLS.white.king}</span>
        ) : (
          <span className="text-3xl">{PIECE_SYMBOLS.black.king}</span>
        );
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700">
      <div className="flex items-center justify-center gap-3 mb-4">
        {getStatusIcon()}
        <div className={`text-2xl font-bold ${getStatusColor()} transition-colors duration-300`}>
          {getStatusText()}
        </div>
      </div>

      {gameStatus === 'check' && (
        <div className={`bg-red-900/50 border border-red-500/50 rounded-lg p-2 mb-4 text-center transition-opacity duration-300 ${checkFlash ? 'opacity-100' : 'opacity-50'}`}>
          <span className="text-red-300 text-sm">您的王正受到威胁！</span>
        </div>
      )}

      {(gameStatus === 'checkmate' || gameStatus === 'stalemate') && (
        <div className="bg-slate-700/50 rounded-lg p-3 text-center mb-4">
          <p className="text-slate-300 text-sm">游戏结束</p>
        </div>
      )}

      <div className="border-t border-slate-700 pt-3">
        <div className="text-xs text-slate-500 mb-2">被吃掉的棋子</div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">白方</div>
            <div className="flex flex-wrap gap-0.5 min-h-[24px]">
              {capturedPieces.black.map((piece, i) => (
                <span key={i} className="text-lg opacity-70">
                  {PIECE_SYMBOLS.black[piece.type]}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">黑方</div>
            <div className="flex flex-wrap gap-0.5 min-h-[24px]">
              {capturedPieces.white.map((piece, i) => (
                <span key={i} className="text-lg opacity-70">
                  {PIECE_SYMBOLS.white[piece.type]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isAIThinking && (
        <div className="mt-3 flex items-center justify-center gap-2 text-amber-400">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
};
