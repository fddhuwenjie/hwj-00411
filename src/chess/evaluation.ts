import type { Piece, PieceColor } from './types';
import { PIECE_VALUES } from './types';

export const evaluateMaterial = (board: (Piece | null)[][]): number => {
  let whiteValue = 0;
  let blackValue = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        if (piece.color === 'white') {
          whiteValue += value;
        } else {
          blackValue += value;
        }
      }
    }
  }

  return whiteValue - blackValue;
};

export const formatEvaluation = (evalScore: number): string => {
  const pawns = Math.abs(evalScore) / 100;
  const sign = evalScore > 0 ? '+' : evalScore < 0 ? '-' : '';
  return `${sign}${pawns.toFixed(1)}`;
};

export const getEvaluationColor = (evalScore: number): string => {
  if (evalScore > 50) return 'text-emerald-400';
  if (evalScore < -50) return 'text-rose-400';
  return 'text-slate-400';
};
