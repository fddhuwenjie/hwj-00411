import React, { useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Position } from '../../chess/types';
import { useGameStore } from '../../store/gameStore';

interface SquareProps {
  row: number;
  col: number;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
  isReplayHighlight: boolean;
  onClick: () => void;
}

const Square: React.FC<SquareProps> = ({ row, col, isLight, isSelected, isValidMove, isCheck, isReplayHighlight, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const woodLight = new THREE.Color('#d4a574');
  const woodDark = new THREE.Color('#8b4513');
  const selectedColor = new THREE.Color('#ffd700');
  const validMoveColor = new THREE.Color('#00ff00');
  const checkColor = new THREE.Color('#ff0000');
  const replayHighlightColor = new THREE.Color('#6366f1');

  const color = useMemo(() => {
    if (isCheck) return checkColor;
    if (isSelected) return selectedColor;
    if (isReplayHighlight) return replayHighlightColor;
    return isLight ? woodLight : woodDark;
  }, [isCheck, isSelected, isLight, isReplayHighlight]);

  return (
    <group position={[col - 3.5, 0, 3.5 - row]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.1}
          emissive={isReplayHighlight ? replayHighlightColor : new THREE.Color('#000000')}
          emissiveIntensity={isReplayHighlight ? 0.3 : 0}
        />
      </mesh>

      {isValidMove && (
        <group position={[0, 0.2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.32, 0.04, 16, 32]} />
            <meshStandardMaterial
              color="#00ff66"
              transparent
              opacity={0.85}
              emissive="#00ff66"
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color="#00ff88"
              transparent
              opacity={0.4}
              emissive="#00ff88"
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.25, 32]} />
            <meshBasicMaterial
              color="#00ff66"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {isSelected && (
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[1.02, 0.02, 1.02]} />
          <meshStandardMaterial
            color="#ffd700"
            transparent
            opacity={0.8}
            emissive="#ffd700"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {isReplayHighlight && (
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[1.05, 0.03, 1.05]} />
          <meshStandardMaterial
            color="#6366f1"
            transparent
            opacity={0.6}
            emissive="#6366f1"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

const BoardLabel: React.FC<{ text: string; position: [number, number, number]; size?: number }> = ({ text, position, size = 0.3 }) => (
  <Text
    position={position}
    fontSize={size}
    color="#e8d4b8"
    anchorX="center"
    anchorY="middle"
  >
    {text}
  </Text>
);

export const ChessBoard: React.FC = () => {
  const { board, selectedPiece, validMoves, checkKingPosition, selectPiece, movePiece, currentTurn, gameStatus, isReplayMode, replayIndex, moves, gameMode, isRotating } = useGameStore();

  const handleSquareClick = (row: number, col: number) => {
    if (isReplayMode) return;
    if (isRotating) return;
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return;
    if (gameMode === 'single' && currentTurn === 'black') return;

    const position: Position = { row, col };

    if (selectedPiece) {
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);
      if (isValidMove) {
        movePiece(selectedPiece, position);
        return;
      }
    }

    const piece = board[row][col];
    if (piece && piece.color === currentTurn) {
      selectPiece(position);
    } else {
      selectPiece(null);
    }
  };

  const replayHighlightPositions = useMemo(() => {
    if (!isReplayMode || replayIndex < 0 || replayIndex >= moves.length) return [];
    const move = moves[replayIndex];
    return [move.from, move.to];
  }, [isReplayMode, replayIndex, moves]);

  const squares = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);
      const isCheck = checkKingPosition?.row === row && checkKingPosition?.col === col;
      const isReplayHighlight = replayHighlightPositions.some(p => p.row === row && p.col === col);

      squares.push(
        <Square
          key={`${row}-${col}`}
          row={row}
          col={col}
          isLight={isLight}
          isSelected={isSelected}
          isValidMove={isValidMove}
          isCheck={isCheck}
          isReplayHighlight={isReplayHighlight}
          onClick={() => handleSquareClick(row, col)}
        />
      );
    }
  }

  const colLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rowLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <group>
      {squares}

      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[9, 0.1, 9]} />
        <meshStandardMaterial
          color="#5c3d2e"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {colLabels.map((label, i) => (
        <React.Fragment key={`col-${label}`}>
          <BoardLabel text={label} position={[i - 3.5, 0.21, -4.2]} size={0.25} />
          <BoardLabel text={label} position={[i - 3.5, 0.21, 4.2]} size={0.25} />
        </React.Fragment>
      ))}

      {rowLabels.map((label, i) => (
        <React.Fragment key={`row-${label}`}>
          <BoardLabel text={label} position={[-4.2, 0.21, 3.5 - i]} size={0.25} />
          <BoardLabel text={label} position={[4.2, 0.21, 3.5 - i]} size={0.25} />
        </React.Fragment>
      ))}

      {isReplayMode && (
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[8.5, 0.01, 8.5]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.1}
          />
        </mesh>
      )}
    </group>
  );
};
