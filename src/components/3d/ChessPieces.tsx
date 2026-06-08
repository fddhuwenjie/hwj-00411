import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Piece, PieceType, PieceColor, Position } from '../../chess/types';
import { useGameStore } from '../../store/gameStore';

interface PieceMaterialProps {
  color: PieceColor;
}

const PieceMaterial: React.FC<PieceMaterialProps> = ({ color }) => {
  return color === 'white' ? (
    <meshStandardMaterial
      color="#f5f5dc"
      roughness={0.3}
      metalness={0.1}
    />
  ) : (
    <meshStandardMaterial
      color="#1a1a1a"
      roughness={0.4}
      metalness={0.3}
    />
  );
};

const Pawn: React.FC<{ color: PieceColor }> = ({ color }) => (
  <group>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.25, 0.3, 0.7, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.22, 32, 32]} />
      <PieceMaterial color={color} />
    </mesh>
  </group>
);

const Rook: React.FC<{ color: PieceColor }> = ({ color }) => (
  <group>
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.3, 0.35, 1, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    {[-0.2, -0.07, 0.07, 0.2].map((x, i) => (
      <mesh key={i} position={[x, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <PieceMaterial color={color} />
      </mesh>
    ))}
    {[-0.2, -0.07, 0.07, 0.2].map((z, i) => (
      <mesh key={`z-${i}`} position={[0, 1.1, z]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <PieceMaterial color={color} />
      </mesh>
    ))}
  </group>
);

const Knight: React.FC<{ color: PieceColor }> = ({ color }) => (
  <group>
    <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.28, 0.35, 0.6, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 0.75, 0]} rotation={[0, 0, -0.3]} castShadow receiveShadow>
      <boxGeometry args={[0.25, 0.5, 0.35]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0.15, 0.95, 0]} rotation={[0, 0, 0.2]} castShadow receiveShadow>
      <boxGeometry args={[0.15, 0.25, 0.3]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0.22, 1.05, -0.08]} castShadow receiveShadow>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial color="#000" />
    </mesh>
    <mesh position={[0.22, 1.05, 0.08]} castShadow receiveShadow>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial color="#000" />
    </mesh>
  </group>
);

const Bishop: React.FC<{ color: PieceColor }> = ({ color }) => (
  <group>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.25, 0.32, 0.7, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
      <coneGeometry args={[0.22, 0.6, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.12, 32, 32]} />
      <PieceMaterial color={color} />
    </mesh>
  </group>
);

const Queen: React.FC<{ color: PieceColor }> = ({ color }) => (
  <group>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.28, 0.35, 0.9, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.25, 32, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => {
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.cos(angle) * 0.18;
      const z = Math.sin(angle) * 0.18;
      return (
        <mesh key={i} position={[x, 1.3, z]} castShadow receiveShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <PieceMaterial color={color} />
        </mesh>
      );
    })}
  </group>
);

const King: React.FC<{ color: PieceColor }> = ({ color }) => (
  <group>
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.3, 0.38, 1, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.1, 0.1, 0.15, 32]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.3, 0.08, 0.08]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.08, 0.3, 0.08]} />
      <PieceMaterial color={color} />
    </mesh>
    <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.3, 0.08, 0.08]} />
      <PieceMaterial color={color} />
    </mesh>
  </group>
);

interface ChessPieceProps {
  piece: Piece;
  position: Position;
  isSelected: boolean;
  isAnimating?: boolean;
}

const PieceComponent: React.FC<{ type: PieceType; color: PieceColor }> = ({ type, color }) => {
  switch (type) {
    case 'pawn': return <Pawn color={color} />;
    case 'rook': return <Rook color={color} />;
    case 'knight': return <Knight color={color} />;
    case 'bishop': return <Bishop color={color} />;
    case 'queen': return <Queen color={color} />;
    case 'king': return <King color={color} />;
  }
};

const ChessPiece: React.FC<ChessPieceProps> = ({ piece, position, isSelected }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(position.col - 3.5, 0.1, 3.5 - position.row));
  const currentPos = useRef(new THREE.Vector3(position.col - 3.5, 0.1, 3.5 - position.row));

  useEffect(() => {
    targetPos.current.set(position.col - 3.5, 0.1, 3.5 - position.row);
  }, [position]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      currentPos.current.lerp(targetPos.current, delta * 8);
      groupRef.current.position.copy(currentPos.current);
      
      if (isSelected) {
        groupRef.current.position.y = currentPos.current.y + Math.sin(Date.now() * 0.005) * 0.05;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <PieceComponent type={piece.type} color={piece.color} />
      {isSelected && (
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 32]} />
          <meshStandardMaterial
            color="#ffd700"
            transparent
            opacity={0.5}
            emissive="#ffd700"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

export const ChessPieces: React.FC = () => {
  const { board, selectedPiece, isAIThinking, currentTurn, gameStatus } = useGameStore();

  const pieces = useMemo(() => {
    const result: { piece: Piece; position: Position; isSelected: boolean }[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          result.push({
            piece,
            position: { row, col },
            isSelected: selectedPiece?.row === row && selectedPiece?.col === col,
          });
        }
      }
    }
    
    return result;
  }, [board, selectedPiece]);

  return (
    <group>
      {pieces.map(({ piece, position, isSelected }) => (
        <ChessPiece
          key={`${position.row}-${position.col}-${piece.type}-${piece.color}`}
          piece={piece}
          position={position}
          isSelected={isSelected}
          isAnimating={isAIThinking || currentTurn === 'black'}
        />
      ))}
    </group>
  );
};
