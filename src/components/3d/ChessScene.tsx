import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ChessBoard } from './ChessBoard';
import { ChessPieces } from './ChessPieces';
import { useGameStore } from '../../store/gameStore';
import type { ViewMode } from '../../chess/types';

interface CameraControllerProps {
  viewMode: ViewMode;
}

const CameraController: React.FC<CameraControllerProps> = ({ viewMode }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosition = useRef(new THREE.Vector3());
  const targetTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    switch (viewMode) {
      case 'white':
        targetPosition.current.set(0, 10, 12);
        targetTarget.current.set(0, 0, 0);
        break;
      case 'black':
        targetPosition.current.set(0, 10, -12);
        targetTarget.current.set(0, 0, 0);
        break;
      case 'top':
        targetPosition.current.set(0, 18, 0.01);
        targetTarget.current.set(0, 0, 0);
        break;
      case 'free':
        return;
    }
  }, [viewMode]);

  useFrame((_, delta) => {
    if (viewMode !== 'free' && controlsRef.current) {
      camera.position.lerp(targetPosition.current, delta * 3);
      controlsRef.current.target.lerp(targetTarget.current, delta * 3);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={30}
      maxPolarAngle={viewMode === 'top' ? Math.PI / 2 : Math.PI / 2.1}
      minPolarAngle={viewMode === 'top' ? Math.PI / 2 : Math.PI / 6}
      enablePan={false}
    />
  );
};

const SceneContent: React.FC = () => {
  const { viewMode, currentTurn, gameStatus, isAIThinking, makeAIMove } = useGameStore();

  useEffect(() => {
    if (currentTurn === 'black' && gameStatus === 'playing' && !isAIThinking) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameStatus, isAIThinking, makeAIMove]);

  return (
    <>
      <CameraController viewMode={viewMode} />

      <ambientLight intensity={0.4} />
      
      <spotLight
        position={[10, 15, 10]}
        angle={0.4}
        penumbra={0.5}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      
      <spotLight
        position={[-10, 15, -10]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      <directionalLight position={[0, 10, 0]} intensity={0.5} />

      <Environment preset="studio" />

      <ChessBoard />
      <ChessPieces />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.5}
        />
      </EffectComposer>
    </>
  );
};

export const ChessScene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 10, 12], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 20, 40]} />
      <SceneContent />
    </Canvas>
  );
};
