import React from 'react';
import { useGameStore } from '../../store/gameStore';
import type { PieceType } from '../../chess/types';
import { PIECE_SYMBOLS } from '../../chess/types';

const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

const pieceNames: Partial<Record<PieceType, string>> = {
  queen: '皇后',
  rook: '城堡',
  bishop: '主教',
  knight: '骑士',
};

export const PromotionModal: React.FC = () => {
  const { promotionPending, promotePawn } = useGameStore();

  if (!promotionPending) return null;

  const { color } = promotionPending;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-amber-400 text-center mb-2">
          兵升变
        </h2>
        <p className="text-slate-400 text-center mb-6">
          选择要升变的棋子
        </p>

        <div className="grid grid-cols-4 gap-3">
          {promotionPieces.map((piece) => (
            <button
              key={piece}
              onClick={() => promotePawn(piece)}
              className="flex flex-col items-center justify-center p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 border-2 border-transparent hover:border-amber-500/50"
            >
              <span className="text-5xl mb-2">
                {PIECE_SYMBOLS[color][piece]}
              </span>
              <span className="text-sm text-slate-300">
                {pieceNames[piece]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
