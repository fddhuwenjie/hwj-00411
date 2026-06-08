import type { Move, PieceColor, Position, PieceType, Piece } from './types';
import { COL_NOTATION, ROW_NOTATION, createInitialBoard, PIECE_SYMBOLS } from './types';
import { cloneBoard, makeMove, getGameStatus, getAllValidMoves, getValidMoves } from './engine';

interface PGNTag {
  name: string;
  value: string;
}

interface ParsedPGN {
  tags: PGNTag[];
  moves: string[];
}

export const exportToPGN = (
  moves: Move[],
  tags: Record<string, string> = {}
): string => {
  const defaultTags: Record<string, string> = {
    Event: 'Casual Game',
    Site: '3D Chess',
    Date: new Date().toISOString().split('T')[0],
    Round: '1',
    White: 'Player 1',
    Black: 'Player 2',
    Result: '*',
    ...tags,
  };

  let pgn = '';
  for (const [key, value] of Object.entries(defaultTags)) {
    pgn += `[${key} "${value}"]\n`;
  }
  pgn += '\n';

  for (let i = 0; i < moves.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = moves[i]?.notation || '';
    const blackMove = moves[i + 1]?.notation || '';
    
    if (i === 0) {
      pgn += `${moveNum}. ${whiteMove}`;
    } else {
      pgn += ` ${moveNum}. ${whiteMove}`;
    }
    
    if (blackMove) {
      pgn += ` ${blackMove}`;
    }
  }

  return pgn + '\n';
};

export const parsePGN = (pgn: string): ParsedPGN => {
  const lines = pgn.trim().split('\n');
  const tags: PGNTag[] = [];
  const moveTexts: string[] = [];
  let inMoves = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (tags.length > 0) inMoves = true;
      continue;
    }

    if (trimmed.startsWith('[')) {
      const match = trimmed.match(/\[(\w+)\s+"([^"]*)"\]/);
      if (match) {
        tags.push({ name: match[1], value: match[2] });
      }
    } else if (inMoves || tags.length === 0) {
      moveTexts.push(trimmed);
    }
  }

  const movesText = moveTexts.join(' ');
  const moves = parseMovesText(movesText);

  return { tags, moves };
};

const parseMovesText = (text: string): string[] => {
  const cleaned = text
    .replace(/\d+\./g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\*|1-0|0-1|1\/2-1\/2/g, '')
    .trim();
  
  return cleaned.split(/\s+/).filter(m => m.length > 0);
};

const parsePosition = (colChar: string, rowChar: string): Position | null => {
  const col = COL_NOTATION.indexOf(colChar.toLowerCase());
  const row = ROW_NOTATION.indexOf(rowChar);
  
  if (col === -1 || row === -1) return null;
  return { row, col };
};

const getPieceTypeFromNotation = (char: string): PieceType | null => {
  switch (char.toUpperCase()) {
    case 'K': return 'king';
    case 'Q': return 'queen';
    case 'R': return 'rook';
    case 'B': return 'bishop';
    case 'N': return 'knight';
    default: return null;
  }
};

export const importFromPGN = (
  pgn: string
): { moves: Move[]; board: (Piece | null)[][] } | null => {
  try {
    const parsed = parsePGN(pgn);
    if (parsed.moves.length === 0) return null;

    let board = createInitialBoard();
    const moves: Move[] = [];
    let currentTurn: PieceColor = 'white';

    for (const notation of parsed.moves) {
      const move = findMoveFromNotation(board, notation, currentTurn, moves);
      if (!move) return null;

      const result = makeMove(board, move.from, move.to, moves, move.promotionTo);
      board = result.newBoard;
      moves.push(result.move);
      currentTurn = currentTurn === 'white' ? 'black' : 'white';
    }

    return { moves, board };
  } catch (e) {
    console.error('PGN import error:', e);
    return null;
  }
};

const findMoveFromNotation = (
  board: (Piece | null)[][],
  notation: string,
  color: PieceColor,
  movesHistory: Move[]
): { from: Position; to: Position; promotionTo?: PieceType } | null => {
  const cleanNotation = notation.replace(/[+#]/g, '');

  if (cleanNotation === 'O-O') {
    const baseRow = color === 'white' ? 7 : 0;
    return { from: { row: baseRow, col: 4 }, to: { row: baseRow, col: 6 } };
  }
  if (cleanNotation === 'O-O-O') {
    const baseRow = color === 'white' ? 7 : 0;
    return { from: { row: baseRow, col: 4 }, to: { row: baseRow, col: 2 } };
  }

  let promotionTo: PieceType | undefined;
  const promotionMatch = cleanNotation.match(/=([QRBN])/);
  if (promotionMatch) {
    promotionTo = getPieceTypeFromNotation(promotionMatch[1]) || undefined;
  }

  const mainNotation = cleanNotation.replace(/=[QRBN]/, '');
  
  let pieceType: PieceType = 'pawn';
  let disambiguation = '';
  let targetPosition: Position | null = null;
  let isCapture = false;

  if (/^[KQRBN]/.test(mainNotation)) {
    pieceType = getPieceTypeFromNotation(mainNotation[0]) || 'pawn';
    const rest = mainNotation.slice(1);
    
    const posMatch = rest.match(/([a-h][1-8])$/);
    if (posMatch) {
      targetPosition = parsePosition(posMatch[1][0], posMatch[1][1]);
      disambiguation = rest.slice(0, rest.length - 2);
    }
    
    isCapture = rest.includes('x');
  } else {
    const posMatch = mainNotation.match(/([a-h][1-8])$/);
    if (posMatch) {
      targetPosition = parsePosition(posMatch[1][0], posMatch[1][1]);
      disambiguation = mainNotation.slice(0, mainNotation.length - 2);
    }
    isCapture = mainNotation.includes('x');
    
    if (isCapture && disambiguation.length > 0) {
      disambiguation = disambiguation.replace('x', '');
    }
  }

  if (!targetPosition) return null;

  const validMoves = getAllValidMoves(board, color, movesHistory);
  
  const candidates = validMoves.filter(m => {
    const piece = board[m.from.row][m.from.col];
    if (!piece || piece.type !== pieceType) return false;
    if (m.to.row !== targetPosition!.row || m.to.col !== targetPosition!.col) return false;
    
    if (disambiguation.length > 0) {
      if (/[a-h]/.test(disambiguation)) {
        const disambigCol = COL_NOTATION.indexOf(disambiguation.match(/[a-h]/)![0]);
        if (m.from.col !== disambigCol) return false;
      }
      if (/[1-8]/.test(disambiguation)) {
        const disambigRow = ROW_NOTATION.indexOf(disambiguation.match(/[1-8]/)![0]);
        if (m.from.row !== disambigRow) return false;
      }
    }
    
    return true;
  });

  if (candidates.length === 1) {
    return { from: candidates[0].from, to: candidates[0].to, promotionTo };
  }

  if (candidates.length > 1 && pieceType === 'pawn' && isCapture) {
    const fileMatch = cleanNotation.match(/^([a-h])/);
    if (fileMatch) {
      const disambigCol = COL_NOTATION.indexOf(fileMatch[1]);
      const match = candidates.find(c => c.from.col === disambigCol);
      if (match) {
        return { from: match.from, to: match.to, promotionTo };
      }
    }
  }

  return null;
};
