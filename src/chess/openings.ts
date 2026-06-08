import type { Opening, Move } from './types';

export const OPENINGS: Opening[] = [
  {
    name: '意大利开局',
    nameEn: 'Italian Game',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6'],
  },
  {
    name: '西西里防御',
    nameEn: 'Sicilian Defense',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'],
  },
  {
    name: '法兰西防御',
    nameEn: 'French Defense',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7'],
  },
  {
    name: '卡罗-卡恩防御',
    nameEn: 'Caro-Kann Defense',
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nf6'],
  },
  {
    name: '后翼弃兵',
    nameEn: "Queen's Gambit",
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7'],
  },
  {
    name: '印度防御',
    nameEn: "King's Indian Defense",
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'],
  },
  {
    name: '尼姆佐维奇防御',
    nameEn: 'Nimzo-Indian Defense',
    moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O'],
  },
  {
    name: '西班牙开局',
    nameEn: 'Spanish Opening (Ruy Lopez)',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6'],
  },
  {
    name: '斯堪的纳维亚防御',
    nameEn: 'Scandinavian Defense',
    moves: ['e4', 'd5', 'exd5', 'Nf6', 'd4', 'Nxd5', 'Nf3', 'Bf5'],
  },
  {
    name: '英格兰开局',
    nameEn: 'English Opening',
    moves: ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6', 'e3', 'Bb4'],
  },
];

export const detectOpening = (moves: Move[]): Opening | null => {
  const moveNotations = moves.map(m => m.notation.replace(/[+#]/g, ''));
  
  let bestMatch: Opening | null = null;
  let maxMatchLength = 0;

  for (const opening of OPENINGS) {
    let matchLength = 0;
    for (let i = 0; i < opening.moves.length && i < moveNotations.length; i++) {
      if (opening.moves[i] === moveNotations[i]) {
        matchLength++;
      } else {
        break;
      }
    }
    
    if (matchLength >= 2 && matchLength > maxMatchLength) {
      maxMatchLength = matchLength;
      bestMatch = opening;
    }
  }

  return bestMatch;
};
