export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  isPromotion?: boolean;
  promotionTo?: PieceType;
  notation: string;
}

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export type Difficulty = 'easy' | 'medium';

export type ViewMode = 'white' | 'black' | 'top' | 'free';

export type GameMode = 'single' | 'hotseat';

export type TimerDuration = 5 | 10 | 15;

export interface HintArrow {
  from: Position;
  to: Position;
  visible: boolean;
}

export interface Opening {
  name: string;
  nameEn: string;
  moves: string[];
}

export interface GameState {
  board: (Piece | null)[][];
  currentTurn: PieceColor;
  gameStatus: GameStatus;
  moves: Move[];
  selectedPiece: Position | null;
  validMoves: Position[];
  viewMode: ViewMode;
  difficulty: Difficulty;
  isAIThinking: boolean;
  promotionPending: { position: Position; color: PieceColor } | null;
  checkKingPosition: Position | null;
  capturedPieces: { white: Piece[]; black: Piece[] };
  isReplayMode: boolean;
  replayIndex: number;
  gameMode: GameMode;
  timerEnabled: boolean;
  timerDuration: TimerDuration;
  whiteTime: number;
  blackTime: number;
  timerActive: boolean;
  hintArrow: HintArrow | null;
  detectedOpening: Opening | null;
  moveEvaluations: number[];
  isRotating: boolean;
}

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export const COL_NOTATION = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const ROW_NOTATION = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const createInitialBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
    board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
    board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
  }
  
  return board;
};

export const createInitialGameState = (): GameState => ({
  board: createInitialBoard(),
  currentTurn: 'white',
  gameStatus: 'playing',
  moves: [],
  selectedPiece: null,
  validMoves: [],
  viewMode: 'white',
  difficulty: 'medium',
  isAIThinking: false,
  promotionPending: null,
  checkKingPosition: null,
  capturedPieces: { white: [], black: [] },
  isReplayMode: false,
  replayIndex: -1,
  gameMode: 'single',
  timerEnabled: false,
  timerDuration: 10,
  whiteTime: 10 * 60 * 1000,
  blackTime: 10 * 60 * 1000,
  timerActive: false,
  hintArrow: null,
  detectedOpening: null,
  moveEvaluations: [],
  isRotating: false,
});
