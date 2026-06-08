import { create } from 'zustand';
import type { GameState, Piece, Position, PieceType, ViewMode, Difficulty, Move, PieceColor, GameMode, TimerDuration, HintArrow } from '../chess/types';
import { createInitialGameState, createInitialBoard } from '../chess/types';
import { getValidMoves, makeMove, undoMove, getGameStatus, needsPromotion, cloneBoard } from '../chess/engine';
import { getBestMove } from '../chess/ai';
import { importFromPGN, exportToPGN } from '../chess/pgn';
import { detectOpening } from '../chess/openings';
import { evaluateMaterial } from '../chess/evaluation';

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
  enterReplayMode: () => void;
  exitReplayMode: () => void;
  replayNext: () => void;
  replayPrev: () => void;
  replayToIndex: (index: number) => void;
  setGameMode: (mode: GameMode) => void;
  setTimerEnabled: (enabled: boolean) => void;
  setTimerDuration: (duration: TimerDuration) => void;
  updateTimer: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  showHint: () => void;
  hideHint: () => void;
  exportPGN: () => string;
  importPGN: (pgn: string) => boolean;
  rotateBoardForHotseat: () => void;
  setIsRotating: (rotating: boolean) => void;
}

const getInitialState = (): GameState & { boardHistory: (Piece | null)[][][] } => ({
  ...createInitialGameState(),
  boardHistory: [createInitialBoard()],
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),

  setViewMode: (mode) => set({ viewMode: mode }),

  setDifficulty: (difficulty) => set({ difficulty }),

  selectPiece: (position) => {
    const state = get();
    if (state.isReplayMode) return;
    if (state.isRotating) return;
    if (state.gameMode === 'hotseat' && state.currentTurn === 'black') return;
    
    if (!position) {
      set({ selectedPiece: null, validMoves: [] });
      return;
    }

    const { board, currentTurn, moves } = state;
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
    if (state.isReplayMode) return;
    if (state.isRotating) return;
    if (state.gameMode === 'single' && state.currentTurn === 'black') return;
    
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

      const evalScore = evaluateMaterial(newBoard);
      const detectedOpening = detectOpening([...state.moves, move]);

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
        moveEvaluations: [...state.moveEvaluations, evalScore],
        detectedOpening,
        hintArrow: null,
      });

      if (state.gameMode === 'hotseat' && status === 'playing') {
        get().rotateBoardForHotseat();
      }
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

      const evalScore = evaluateMaterial(newBoard);
      const detectedOpening = detectOpening([...state.moves.slice(0, -1), move]);

      set({
        board: newBoard,
        currentTurn: nextTurn,
        gameStatus: status,
        moves: [...state.moves.slice(0, -1), move],
        boardHistory: [...state.boardHistory.slice(0, -1), newBoard],
        promotionPending: null,
        checkKingPosition: status === 'check' || status === 'checkmate' ? kingPosition : null,
        moveEvaluations: [...state.moveEvaluations.slice(0, -1), evalScore],
        detectedOpening,
      });
    } catch (e) {
      console.error('Promotion error:', e);
    }
  },

  undo: () => {
    const state = get();
    if (state.isReplayMode) return;
    if (state.moves.length === 0) return;

    const undoCount = state.gameMode === 'single' && state.currentTurn === 'white' ? 2 : 1;
    if (state.moves.length < undoCount) return;

    let newBoard = state.board;
    const newMoves = [...state.moves];
    const newHistory = [...state.boardHistory];
    const newEvaluations = [...state.moveEvaluations];

    for (let i = 0; i < undoCount; i++) {
      if (newMoves.length === 0) break;
      newMoves.pop();
      newBoard = undoMove(newBoard, newMoves[newMoves.length] || state.moves[state.moves.length - 1 - i]);
      newHistory.pop();
      newEvaluations.pop();
    }

    const nextTurn: PieceColor = newMoves.length % 2 === 0 ? 'white' : 'black';
    const { status, kingPosition } = getGameStatus(newBoard, nextTurn, newMoves);
    const detectedOpening = detectOpening(newMoves);

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
      moveEvaluations: newEvaluations,
      detectedOpening,
      hintArrow: null,
    });
  },

  resetGame: () => {
    const { timerDuration, timerEnabled, gameMode } = get();
    const initialMs = timerDuration * 60 * 1000;
    set({
      ...getInitialState(),
      timerDuration,
      timerEnabled,
      gameMode,
      whiteTime: initialMs,
      blackTime: initialMs,
      timerActive: false,
    });
  },

  setAIThinking: (thinking) => set({ isAIThinking: thinking }),

  makeAIMove: () => {
    const state = get();
    if (state.currentTurn !== 'black' || state.gameStatus !== 'playing') return;
    if (state.gameMode !== 'single') return;
    if (state.isReplayMode) return;

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

            const evalScore = evaluateMaterial(newBoard);
            const detectedOpening = detectOpening([...currentState.moves, move]);

            set({
              board: newBoard,
              currentTurn: nextTurn,
              gameStatus: status,
              moves: [...currentState.moves, move],
              boardHistory: [...currentState.boardHistory, newBoard],
              checkKingPosition: status === 'check' || status === 'checkmate' ? kingPosition : null,
              capturedPieces: newCapturedPieces,
              isAIThinking: false,
              moveEvaluations: [...currentState.moveEvaluations, evalScore],
              detectedOpening,
              hintArrow: null,
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

  enterReplayMode: () => {
    const state = get();
    if (state.moves.length === 0) return;
    
    set({
      isReplayMode: true,
      replayIndex: 0,
      board: state.boardHistory[0],
      selectedPiece: null,
      validMoves: [],
      timerActive: false,
    });
  },

  exitReplayMode: () => {
    const state = get();
    set({
      isReplayMode: false,
      replayIndex: -1,
      board: state.boardHistory[state.boardHistory.length - 1],
      currentTurn: state.moves.length % 2 === 0 ? 'white' : 'black',
    });
  },

  replayNext: () => {
    const state = get();
    if (!state.isReplayMode) return;
    if (state.replayIndex >= state.moves.length - 1) return;
    
    const nextIndex = state.replayIndex + 1;
    set({
      replayIndex: nextIndex,
      board: state.boardHistory[nextIndex + 1],
      currentTurn: (nextIndex + 1) % 2 === 0 ? 'white' : 'black',
    });
  },

  replayPrev: () => {
    const state = get();
    if (!state.isReplayMode) return;
    if (state.replayIndex < 0) return;
    
    const prevIndex = state.replayIndex - 1;
    set({
      replayIndex: prevIndex,
      board: prevIndex < 0 ? state.boardHistory[0] : state.boardHistory[prevIndex + 1],
      currentTurn: prevIndex < 0 ? 'white' : (prevIndex + 1) % 2 === 0 ? 'white' : 'black',
    });
  },

  replayToIndex: (index) => {
    const state = get();
    if (!state.isReplayMode) return;
    if (index < -1 || index >= state.moves.length) return;
    
    set({
      replayIndex: index,
      board: index < 0 ? state.boardHistory[0] : state.boardHistory[index + 1],
      currentTurn: index < 0 ? 'white' : (index + 1) % 2 === 0 ? 'white' : 'black',
    });
  },

  setGameMode: (mode) => {
    const state = get();
    if (state.moves.length > 0) return;
    
    set({ 
      gameMode: mode,
      viewMode: mode === 'hotseat' ? 'white' : state.viewMode,
    });
  },

  setTimerEnabled: (enabled) => {
    const state = get();
    if (state.moves.length > 0) return;
    
    const initialMs = state.timerDuration * 60 * 1000;
    set({ 
      timerEnabled: enabled,
      whiteTime: initialMs,
      blackTime: initialMs,
    });
  },

  setTimerDuration: (duration) => {
    const state = get();
    if (state.moves.length > 0) return;
    
    const initialMs = duration * 60 * 1000;
    set({ 
      timerDuration: duration,
      whiteTime: initialMs,
      blackTime: initialMs,
    });
  },

  updateTimer: () => {
    const state = get();
    if (!state.timerEnabled || !state.timerActive) return;
    if (state.gameStatus !== 'playing') return;
    if (state.isReplayMode) return;

    const decrement = 100;
    
    if (state.currentTurn === 'white') {
      const newTime = state.whiteTime - decrement;
      if (newTime <= 0) {
        set({
          whiteTime: 0,
          timerActive: false,
          gameStatus: 'checkmate',
          currentTurn: 'white',
        });
      } else {
        set({ whiteTime: newTime });
      }
    } else {
      const newTime = state.blackTime - decrement;
      if (newTime <= 0) {
        set({
          blackTime: 0,
          timerActive: false,
          gameStatus: 'checkmate',
          currentTurn: 'black',
        });
      } else {
        set({ blackTime: newTime });
      }
    }
  },

  startTimer: () => {
    const state = get();
    if (!state.timerEnabled) return;
    if (state.gameStatus !== 'playing') return;
    set({ timerActive: true });
  },

  stopTimer: () => set({ timerActive: false }),

  showHint: () => {
    const state = get();
    if (state.isReplayMode) return;
    if (state.gameStatus !== 'playing') return;
    if (state.isAIThinking) return;
    if (state.gameMode === 'single' && state.currentTurn === 'black') return;

    const bestMove = getBestMove(state.board, state.moves, state.difficulty);
    
    if (bestMove) {
      const hintArrow: HintArrow = {
        from: bestMove.from,
        to: bestMove.to,
        visible: true,
      };
      set({ hintArrow });

      setTimeout(() => {
        get().hideHint();
      }, 3000);
    }
  },

  hideHint: () => set({ hintArrow: null }),

  exportPGN: () => {
    const state = get();
    let result = '*';
    if (state.gameStatus === 'checkmate') {
      result = state.currentTurn === 'white' ? '0-1' : '1-0';
    } else if (state.gameStatus === 'stalemate' || state.gameStatus === 'draw') {
      result = '1/2-1/2';
    }
    
    return exportToPGN(state.moves, { Result: result });
  },

  importPGN: (pgn) => {
    const result = importFromPGN(pgn);
    if (!result) return false;

    const { moves, board } = result;
    
    const boardHistory: (Piece | null)[][][] = [createInitialBoard()];
    let tempBoard = createInitialBoard();
    const moveEvaluations: number[] = [];
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const moveResult = makeMove(tempBoard, move.from, move.to, moves.slice(0, i), move.promotionTo);
      tempBoard = moveResult.newBoard;
      boardHistory.push(cloneBoard(tempBoard));
      moveEvaluations.push(evaluateMaterial(tempBoard));
    }

    const detectedOpening = detectOpening(moves);
    const nextTurn: PieceColor = moves.length % 2 === 0 ? 'white' : 'black';
    const { status, kingPosition } = getGameStatus(board, nextTurn, moves);

    set({
      board,
      moves,
      boardHistory,
      moveEvaluations,
      detectedOpening,
      currentTurn: nextTurn,
      gameStatus: status,
      checkKingPosition: status === 'check' || status === 'checkmate' ? kingPosition : null,
      selectedPiece: null,
      validMoves: [],
      isReplayMode: false,
      replayIndex: -1,
      hintArrow: null,
      isAIThinking: false,
    });

    return true;
  },

  rotateBoardForHotseat: () => {
    const state = get();
    if (state.gameMode !== 'hotseat') return;
    if (state.isRotating) return;

    set({ isRotating: true });

    setTimeout(() => {
      const nextView: ViewMode = state.viewMode === 'white' ? 'black' : 'white';
      set({ 
        viewMode: nextView,
        isRotating: false,
      });
    }, 800);
  },

  setIsRotating: (rotating) => set({ isRotating: rotating }),
}));
