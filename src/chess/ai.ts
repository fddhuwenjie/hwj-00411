import type { Piece, PieceColor, PieceType, Position, Move, Difficulty } from './types';
import { PIECE_VALUES } from './types';
import { cloneBoard, getAllValidMoves, makeMove, isInCheck, needsPromotion } from './engine';

const PAWN_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE: number[][] = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE: number[][] = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE: number[][] = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE: number[][] = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const KING_ENDGAME_TABLE: number[][] = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

const getPositionTable = (type: PieceType, color: PieceColor, isEndgame: boolean): number[][] => {
  let table: number[][];
  
  switch (type) {
    case 'pawn': table = PAWN_TABLE; break;
    case 'knight': table = KNIGHT_TABLE; break;
    case 'bishop': table = BISHOP_TABLE; break;
    case 'rook': table = ROOK_TABLE; break;
    case 'queen': table = QUEEN_TABLE; break;
    case 'king': table = isEndgame ? KING_ENDGAME_TABLE : KING_TABLE; break;
  }
  
  return color === 'white' ? table : table.slice().reverse();
};

const isEndgame = (board: (Piece | null)[][]): boolean => {
  let pieceCount = 0;
  let hasQueen = false;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        pieceCount++;
        if (piece.type === 'queen') hasQueen = true;
      }
    }
  }
  
  return pieceCount <= 10 || !hasQueen;
};

export const evaluateBoard = (board: (Piece | null)[][], movesHistory: Move[]): number => {
  let score = 0;
  const endgame = isEndgame(board);
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        const positionTable = getPositionTable(piece.type, piece.color, endgame);
        const positionValue = positionTable[row][col];
        
        const totalValue = value + positionValue;
        
        if (piece.color === 'black') {
          score += totalValue;
        } else {
          score -= totalValue;
        }
      }
    }
  }
  
  const lastMove = movesHistory.length > 0 ? movesHistory[movesHistory.length - 1] : null;
  if (isInCheck(board, 'white', lastMove)) score += 50;
  if (isInCheck(board, 'black', lastMove)) score -= 50;
  
  return score;
};

interface MoveResult {
  from: Position;
  to: Position;
  promotionTo?: PieceType;
  score: number;
}

const minimax = (
  board: (Piece | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  movesHistory: Move[]
): number => {
  if (depth === 0) {
    return evaluateBoard(board, movesHistory);
  }
  
  const color = isMaximizing ? 'black' : 'white';
  const validMoves = getAllValidMoves(board, color, movesHistory);
  
  if (validMoves.length === 0) {
    const lastMove = movesHistory.length > 0 ? movesHistory[movesHistory.length - 1] : null;
    if (isInCheck(board, color, lastMove)) {
      return isMaximizing ? -100000 : 100000;
    }
    return 0;
  }
  
  const orderedMoves = validMoves.sort((a, b) => {
    const aCapture = board[a.to.row][a.to.col] ? PIECE_VALUES[board[a.to.row][a.to.col]!.type] : 0;
    const bCapture = board[b.to.row][b.to.col] ? PIECE_VALUES[board[b.to.row][b.to.col]!.type] : 0;
    return bCapture - aCapture;
  });
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of orderedMoves) {
      const piece = board[move.from.row][move.from.col]!;
      
      let promotionOptions: PieceType[] = ['queen'];
      if (needsPromotion(board, move.from, move.to)) {
        promotionOptions = ['queen', 'rook', 'bishop', 'knight'];
      }
      
      for (const promotionTo of promotionOptions) {
        const { newBoard, move: newMove } = makeMove(
          board, move.from, move.to, movesHistory, 
          needsPromotion(board, move.from, move.to) ? promotionTo : undefined
        );
        
        const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, [...movesHistory, newMove]);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        
        if (beta <= alpha) break;
      }
      
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of orderedMoves) {
      const piece = board[move.from.row][move.from.col]!;
      
      let promotionOptions: PieceType[] = ['queen'];
      if (needsPromotion(board, move.from, move.to)) {
        promotionOptions = ['queen', 'rook', 'bishop', 'knight'];
      }
      
      for (const promotionTo of promotionOptions) {
        const { newBoard, move: newMove } = makeMove(
          board, move.from, move.to, movesHistory,
          needsPromotion(board, move.from, move.to) ? promotionTo : undefined
        );
        
        const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, [...movesHistory, newMove]);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        
        if (beta <= alpha) break;
      }
      
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (
  board: (Piece | null)[][],
  movesHistory: Move[],
  difficulty: Difficulty
): MoveResult | null => {
  const validMoves = getAllValidMoves(board, 'black', movesHistory);
  
  if (validMoves.length === 0) return null;
  
  const depth = difficulty === 'easy' ? 2 : 3;
  
  let bestScore = -Infinity;
  let bestMove: MoveResult | null = null;
  
  const orderedMoves = validMoves.sort((a, b) => {
    const aCapture = board[a.to.row][a.to.col] ? PIECE_VALUES[board[a.to.row][a.to.col]!.type] : 0;
    const bCapture = board[b.to.row][b.to.col] ? PIECE_VALUES[board[b.to.row][b.to.col]!.type] : 0;
    return bCapture - aCapture;
  });
  
  for (const move of orderedMoves) {
    const promotionNeeded = needsPromotion(board, move.from, move.to);
    const promotionOptions: PieceType[] = promotionNeeded ? ['queen', 'rook', 'bishop', 'knight'] : [undefined as unknown as PieceType];
    
    for (const promotionTo of promotionOptions) {
      const { newBoard, move: newMove } = makeMove(
        board, move.from, move.to, movesHistory,
        promotionNeeded ? promotionTo : undefined
      );
      
      const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, [...movesHistory, newMove]);
      
      if (difficulty === 'easy' && Math.random() < 0.3) {
        if (!bestMove || Math.random() < 0.5) {
          bestMove = { from: move.from, to: move.to, promotionTo: promotionNeeded ? promotionTo : undefined, score };
        }
      } else if (score > bestScore) {
        bestScore = score;
        bestMove = { from: move.from, to: move.to, promotionTo: promotionNeeded ? promotionTo : undefined, score };
      }
    }
  }
  
  return bestMove;
};
