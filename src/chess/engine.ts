import type { Piece, PieceColor, PieceType, Position, Move, GameStatus } from './types';
import { COL_NOTATION, ROW_NOTATION, PIECE_SYMBOLS } from './types';

const isValidPosition = (row: number, col: number): boolean => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

export const cloneBoard = (board: (Piece | null)[][]): (Piece | null)[][] => {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
};

export const findKing = (board: (Piece | null)[][], color: PieceColor): Position | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

const getRawMoves = (
  board: (Piece | null)[][],
  position: Position,
  lastMove: Move | null
): Position[] => {
  const { row, col } = position;
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { type, color } = piece;
  const direction = color === 'white' ? -1 : 1;

  switch (type) {
    case 'pawn': {
      const startRow = color === 'white' ? 6 : 1;
      
      if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
        moves.push({ row: row + direction, col });
        
        if (row === startRow && !board[row + 2 * direction][col]) {
          moves.push({ row: row + 2 * direction, col });
        }
      }
      
      for (const dc of [-1, 1]) {
        const newRow = row + direction;
        const newCol = col + dc;
        if (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (target && target.color !== color) {
            moves.push({ row: newRow, col: newCol });
          }
          
          if (lastMove && lastMove.piece.type === 'pawn' && 
              Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
              lastMove.to.row === row && lastMove.to.col === newCol) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
      break;
    }
    
    case 'knight': {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightMoves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (!target || target.color !== color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
      break;
    }
    
    case 'bishop': {
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;
        while (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (!target) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (target.color !== color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dr;
          newCol += dc;
        }
      }
      break;
    }
    
    case 'rook': {
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;
        while (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (!target) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (target.color !== color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dr;
          newCol += dc;
        }
      }
      break;
    }
    
    case 'queen': {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;
        while (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (!target) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (target.color !== color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          newRow += dr;
          newCol += dc;
        }
      }
      break;
    }
    
    case 'king': {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidPosition(newRow, newCol)) {
          const target = board[newRow][newCol];
          if (!target || target.color !== color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
      
      if (!piece.hasMoved) {
        const baseRow = color === 'white' ? 7 : 0;
        if (row === baseRow && col === 4) {
          const kingsideRook = board[baseRow][7];
          if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
            if (!board[baseRow][5] && !board[baseRow][6]) {
              moves.push({ row: baseRow, col: 6 });
            }
          }
          
          const queensideRook = board[baseRow][0];
          if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
            if (!board[baseRow][1] && !board[baseRow][2] && !board[baseRow][3]) {
              moves.push({ row: baseRow, col: 2 });
            }
          }
        }
      }
      break;
    }
  }
  
  return moves;
};

export const isSquareAttacked = (
  board: (Piece | null)[][],
  position: Position,
  byColor: PieceColor,
  lastMove: Move | null
): boolean => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = getRawMoves(board, { row, col }, lastMove);
        if (piece.type === 'pawn') {
          const direction = byColor === 'white' ? -1 : 1;
          if (position.row === row + direction && (position.col === col - 1 || position.col === col + 1)) {
            return true;
          }
        } else if (piece.type === 'king') {
          if (Math.abs(position.row - row) <= 1 && Math.abs(position.col - col) <= 1) {
            return true;
          }
        } else {
          for (const move of moves) {
            if (move.row === position.row && move.col === position.col) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
};

export const isInCheck = (
  board: (Piece | null)[][],
  color: PieceColor,
  lastMove: Move | null
): boolean => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos, color === 'white' ? 'black' : 'white', lastMove);
};

export const getValidMoves = (
  board: (Piece | null)[][],
  position: Position,
  movesHistory: Move[]
): Position[] => {
  const piece = board[position.row][position.col];
  if (!piece) return [];

  const lastMove = movesHistory.length > 0 ? movesHistory[movesHistory.length - 1] : null;
  const rawMoves = getRawMoves(board, position, lastMove);
  
  const validMoves: Position[] = [];
  
  for (const move of rawMoves) {
    const newBoard = cloneBoard(board);
    const movingPiece = newBoard[position.row][position.col]!;
    
    if (piece.type === 'pawn' && lastMove && 
        lastMove.piece.type === 'pawn' && 
        Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
        lastMove.to.row === position.row && lastMove.to.col === move.col &&
        position.col !== move.col) {
      newBoard[position.row][move.col] = null;
    }
    
    newBoard[move.row][move.col] = { ...movingPiece, hasMoved: true };
    newBoard[position.row][position.col] = null;
    
    if (piece.type === 'king' && Math.abs(move.col - position.col) === 2) {
      const baseRow = piece.color === 'white' ? 7 : 0;
      if (move.col === 6) {
        newBoard[baseRow][5] = { ...newBoard[baseRow][7]!, hasMoved: true };
        newBoard[baseRow][7] = null;
      } else if (move.col === 2) {
        newBoard[baseRow][3] = { ...newBoard[baseRow][0]!, hasMoved: true };
        newBoard[baseRow][0] = null;
      }
      
      const opponentColor = piece.color === 'white' ? 'black' : 'white';
      const midCol = (position.col + move.col) / 2;
      if (isSquareAttacked(board, { row: position.row, col: midCol }, opponentColor, lastMove)) {
        continue;
      }
    }
    
    if (!isInCheck(newBoard, piece.color, { ...movesHistory[movesHistory.length - 1], from: position, to: move } as Move)) {
      validMoves.push(move);
    }
  }
  
  return validMoves;
};

export const getAllValidMoves = (
  board: (Piece | null)[][],
  color: PieceColor,
  movesHistory: Move[]
): { from: Position; to: Position }[] => {
  const allMoves: { from: Position; to: Position }[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, { row, col }, movesHistory);
        for (const move of validMoves) {
          allMoves.push({ from: { row, col }, to: move });
        }
      }
    }
  }
  
  return allMoves;
};

export const getGameStatus = (
  board: (Piece | null)[][],
  currentTurn: PieceColor,
  movesHistory: Move[]
): { status: GameStatus; kingPosition: Position | null } => {
  const inCheck = isInCheck(board, currentTurn, movesHistory.length > 0 ? movesHistory[movesHistory.length - 1] : null);
  const validMoves = getAllValidMoves(board, currentTurn, movesHistory);
  const kingPosition = findKing(board, currentTurn);
  
  if (validMoves.length === 0) {
    if (inCheck) {
      return { status: 'checkmate', kingPosition };
    } else {
      return { status: 'stalemate', kingPosition };
    }
  }
  
  if (inCheck) {
    return { status: 'check', kingPosition };
  }
  
  return { status: 'playing', kingPosition };
};

const getPositionNotation = (pos: Position): string => {
  return COL_NOTATION[pos.col] + ROW_NOTATION[pos.row];
};

export const generateNotation = (
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  piece: Piece,
  captured: Piece | null,
  isEnPassant: boolean,
  isCastling: 'kingside' | 'queenside' | undefined,
  isPromotion: boolean,
  promotionTo: PieceType | undefined,
  movesHistory: Move[]
): string => {
  if (isCastling === 'kingside') return 'O-O';
  if (isCastling === 'queenside') return 'O-O-O';
  
  let notation = '';
  
  if (piece.type !== 'pawn') {
    notation += piece.type === 'knight' ? 'N' : piece.type.charAt(0).toUpperCase();
    
    const sameTypePieces: Position[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const p = board[row][col];
        if (p && p.type === piece.type && p.color === piece.color && 
            !(row === from.row && col === from.col)) {
          const validMoves = getValidMoves(board, { row, col }, movesHistory);
          if (validMoves.some(m => m.row === to.row && m.col === to.col)) {
            sameTypePieces.push({ row, col });
          }
        }
      }
    }
    
    if (sameTypePieces.length > 0) {
      const sameRow = sameTypePieces.some(p => p.row === from.row);
      const sameCol = sameTypePieces.some(p => p.col === from.col);
      
      if (!sameCol) {
        notation += COL_NOTATION[from.col];
      } else if (!sameRow) {
        notation += ROW_NOTATION[from.row];
      } else {
        notation += getPositionNotation(from);
      }
    }
  }
  
  if (captured || isEnPassant) {
    if (piece.type === 'pawn') {
      notation += COL_NOTATION[from.col];
    }
    notation += 'x';
  }
  
  notation += getPositionNotation(to);
  
  if (isPromotion && promotionTo) {
    notation += '=' + (promotionTo === 'knight' ? 'N' : promotionTo.charAt(0).toUpperCase());
  }
  
  const newBoard = cloneBoard(board);
  newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  newBoard[from.row][from.col] = null;
  
  if (isEnPassant) {
    newBoard[from.row][to.col] = null;
  }
  
  if (isCastling) {
    const baseRow = piece.color === 'white' ? 7 : 0;
    if (isCastling === 'kingside') {
      newBoard[baseRow][5] = { ...newBoard[baseRow][7]!, hasMoved: true };
      newBoard[baseRow][7] = null;
    } else {
      newBoard[baseRow][3] = { ...newBoard[baseRow][0]!, hasMoved: true };
      newBoard[baseRow][0] = null;
    }
  }
  
  const opponentColor = piece.color === 'white' ? 'black' : 'white';
  const newMovesHistory = [...movesHistory, { from, to, piece, captured, isEnPassant, isCastling, isPromotion, promotionTo, notation } as Move];
  
  if (isInCheck(newBoard, opponentColor, newMovesHistory[newMovesHistory.length - 1])) {
    const opponentMoves = getAllValidMoves(newBoard, opponentColor, newMovesHistory);
    notation += opponentMoves.length === 0 ? '#' : '+';
  }
  
  return notation;
};

export const makeMove = (
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  movesHistory: Move[],
  promotionTo?: PieceType
): { newBoard: (Piece | null)[][]; move: Move; capturedPiece: Piece | null } => {
  const piece = board[from.row][from.col];
  if (!piece) throw new Error('No piece at source position');
  
  const lastMove = movesHistory.length > 0 ? movesHistory[movesHistory.length - 1] : null;
  const validMoves = getValidMoves(board, from, movesHistory);
  
  const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);
  if (!isValid) throw new Error('Invalid move');
  
  const newBoard = cloneBoard(board);
  let capturedPiece: Piece | null = null;
  let isEnPassant = false;
  let isCastling: 'kingside' | 'queenside' | undefined;
  let isPromotion = false;
  
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    isCastling = to.col === 6 ? 'kingside' : 'queenside';
    const baseRow = piece.color === 'white' ? 7 : 0;
    
    if (isCastling === 'kingside') {
      newBoard[baseRow][5] = { ...newBoard[baseRow][7]!, hasMoved: true };
      newBoard[baseRow][7] = null;
    } else {
      newBoard[baseRow][3] = { ...newBoard[baseRow][0]!, hasMoved: true };
      newBoard[baseRow][0] = null;
    }
  }
  
  if (piece.type === 'pawn' && from.col !== to.col && !board[to.row][to.col]) {
    isEnPassant = true;
    capturedPiece = board[from.row][to.col];
    newBoard[from.row][to.col] = null;
  } else if (board[to.row][to.col]) {
    capturedPiece = board[to.row][to.col];
  }
  
  if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
    isPromotion = true;
    if (promotionTo) {
      newBoard[to.row][to.col] = { type: promotionTo, color: piece.color, hasMoved: true };
    } else {
      newBoard[to.row][to.col] = { ...piece, hasMoved: true };
    }
  } else {
    newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  }
  
  newBoard[from.row][from.col] = null;
  
  const notation = generateNotation(
    board, from, to, piece, capturedPiece,
    isEnPassant, isCastling, isPromotion, promotionTo, movesHistory
  );
  
  const move: Move = {
    from,
    to,
    piece: { ...piece },
    captured: capturedPiece || undefined,
    isEnPassant,
    isCastling,
    isPromotion,
    promotionTo,
    notation,
  };
  
  return { newBoard, move, capturedPiece };
};

export const undoMove = (
  board: (Piece | null)[][],
  move: Move
): (Piece | null)[][] => {
  const newBoard = cloneBoard(board);
  
  newBoard[move.from.row][move.from.col] = { ...move.piece };
  
  if (move.isPromotion) {
    newBoard[move.to.row][move.to.col] = move.captured ? { ...move.captured } : null;
  } else {
    newBoard[move.to.row][move.to.col] = move.captured ? { ...move.captured } : null;
  }
  
  if (move.isEnPassant) {
    newBoard[move.from.row][move.to.col] = { type: 'pawn', color: move.piece.color === 'white' ? 'black' : 'white', hasMoved: true };
  }
  
  if (move.isCastling) {
    const baseRow = move.piece.color === 'white' ? 7 : 0;
    if (move.isCastling === 'kingside') {
      newBoard[baseRow][7] = { ...newBoard[baseRow][5]!, hasMoved: false };
      newBoard[baseRow][5] = null;
    } else {
      newBoard[baseRow][0] = { ...newBoard[baseRow][3]!, hasMoved: false };
      newBoard[baseRow][3] = null;
    }
  }
  
  return newBoard;
};

export const needsPromotion = (
  board: (Piece | null)[][],
  from: Position,
  to: Position
): boolean => {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== 'pawn') return false;
  return to.row === 0 || to.row === 7;
};
