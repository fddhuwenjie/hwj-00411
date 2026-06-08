import { create } from 'zustand';
import type { GameState, Piece, Position, PieceType, ViewMode, Difficulty, Move, PieceColor } from '../chess/types';
import { createInitialBoard } from '../chess/types';
import { getValidMoves, makeMove, undoMove, getGameStatus, needsPromotion } from '../chess/engine';
import { getBestMove } from '../chess/ai';

interface GameStore extends GameState {
  boardHistory: (Piece | null)[][][];
  setViewMode: (mode: ViewMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  selectPiece: (position: Position | null) => void;
  movePiece: (from: Position, to: Position, promotionTo?: PieceType) => void;
  undo: () => void;
  resetGame: () => void;
  promotePawn: (to: PieceType) => void;
  makeAIMove: () => void;
  setAIThinking: (thinking: boolean) => void;
}

const initialState: GameState = {
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
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  boardHistory: [createInitialBoard()],

  setViewMode: (mode) => set({ viewMode: mode }),

  setDifficulty: (difficulty) => set({ difficulty }),

  selectPiece: (position) => {
    if (!position) {
      set({ selectedPiece: null, validMoves: [] });
      return;
    }

    const { board, currentTurn, moves } = get();
    const piece = board[position.row][position.col];

    if (!piece || piece.color !== currentTurn) {
      set({ selectedPiece: null, validMoves: [] });
      return;
    }

    const validMoves = getValidMoves(board, position, moves);
    set({ selectedPiece: position, validMoves });
  },

  movePiece: (from, to, promotionTo) => {
    const state = get();
    const piece = state.board[from.row][from.col];
    
    if (!piece) return;

    if (needsPromotion(state.board, from, to) && !promotionTo) {
      set({
        promotionPending: { position: to, color: piece.color },
        selectedPiece: null,
        validMoves: [],
      });
      return;
    }

    try {
      const { newBoard, move, capturedPiece } = makeMove(state.board, from, to, state.moves, promotionTo);
      
      const nextTurn: PieceColor = state.currentTurn === 'white' ? 'black' : 'white';
      const { status, kingPosition } = getGameStatus(newBoard, nextTurn, [...state.moves, move]);
      
      const newCapturedPieces = { ...state.capturedPieces };
      if (capturedPiece) {
        newCapturedPieces[state.currentTurn] = [...newCapturedPieces[state.currentTurn], capturedPiece];
      }

      set({
        board: newBoard,
        currentTurn: nextTurn,
        gameStatus: status,
        moves: [...state.moves, move],
        boardHistory: [...state.boardHistory, newBoard],
        selectedPiece: null,
        validMoves: [],
        checkKingPosition: status === 'check' || status === 'checkmate' ? kingPosition : null,
        capturedPieces: newCapturedPieces,
      });
    } catch (e) {
      console.error('Invalid move:', e);
    }
  },

  promotePawn: (to) => {
    const state = get();
    if (!state.promotionPending) return;

    const fromPosition = state.moves.length > 0 
      ? state.moves[state.moves.length - 1].to 
      : null;
    
    if (!fromPosition) return;

    const { position, color } = state.promotionPending;
    const prevBoard = state.boardHistory[state.boardHistory.length - 2] || state.board;
    
    try {
      const { newBoard, move, capturedPiece } = makeMove(prevBoard, fromPosition, position, state.moves.slice(0, -1), to);
      
      const nextTurn: PieceColor = color === 'white' ? 'black' : 'white';
      const { status, kingPosition } = getGameStatus(newBoard, nextTurn, [...state.moves.slice(0, -1), move]);

      set({
        board: newBoard,
        currentTurn: nextTurn,
        gameStatus: status,
        moves: [...state.moves.slice(0, -1), move],
        boardHistory: [...state.boardHistory.slice(0, -1), newBoard],
        promotionPending: null,
        checkKingPosition: status === 'check' || status === 'checkmate' ? kingPosition : null,
      });
    } catch (e) {
      console.error('Promotion error:', e);
    }
  },

  undo: () => {
    const state = get();
    if (state.moves.length === 0) return;

    const undoCount = state.currentTurn === 'white' ? 2 : 1;
    if (state.moves.length < undoCount) return;

    let newBoard = state.board;
    const newMoves = [...state.moves];
    const newHistory = [...state.boardHistory];

    for (let i = 0; i < undoCount; i++) {
      if (newMoves.length === 0) break;
      const lastMove = newMoves.pop()!;
      newBoard = undoMove(newBoard, lastMove);
      newHistory.pop();
    }

    const nextTurn: PieceColor = newMoves.length % 2 === 0 ? 'white' : 'black';
    const { status, kingPosition } = getGameStatus(newBoard, nextTurn, newMoves);

    set({
      board: newBoard,
      currentTurn: nextTurn,
      gameStatus: status,
      moves: newMoves,
      boardHistory: newHistory,
      selectedPiece: null,
      validMoves: [],
      promotionPending: null,
      checkKingPosition: status === 'check' || status === 'checkmate' ? kingPosition : null,
      isAIThinking: false,
    });
  },

  resetGame: () => {
    set({
      ...initialState,
      boardHistory: [createInitialBoard()],
    });
  },

  setAIThinking: (thinking) => set({ isAIThinking: thinking }),

  makeAIMove: () => {
    const state = get();
    if (state.currentTurn !== 'black' || state.gameStatus !== 'playing') return;

    set({ isAIThinking: true });

    setTimeout(() => {
      const currentState = get();
      const bestMove = getBestMove(currentState.board, currentState.moves, currentState.difficulty);

      if (bestMove) {
        const piece = currentState.board[bestMove.from.row][bestMove.from.col];
        if (piece) {
          try {
            const { newBoard, move, capturedPiece } = makeMove(
              currentState.board, 
              bestMove.from, 
              bestMove.to, 
              currentState.moves,
              bestMove.promotionTo
            );

            const nextTurn: PieceColor = 'white';
            const { status, kingPosition } = getGameStatus(newBoard, nextTurn, [...currentState.moves, move]);
            
            const newCapturedPieces = { ...currentState.capturedPieces };
            if (capturedPiece) {
              newCapturedPieces.black = [...newCapturedPieces.black, capturedPiece];
            }

            set({
              board: newBoard,
              currentTurn: nextTurn,
              gameStatus: status,
              moves: [...currentState.moves, move],
              boardHistory: [...currentState.boardHistory, newBoard],
              checkKingPosition: status === 'check' || status === 'checkmate' ? kingPosition : null,
              capturedPieces: newCapturedPieces,
              isAIThinking: false,
            });
          } catch (e) {
            console.error('AI move error:', e);
            set({ isAIThinking: false });
          }
        }
      } else {
        set({ isAIThinking: false });
      }
    }, 800);
  },
}));
