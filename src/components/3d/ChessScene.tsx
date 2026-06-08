import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ChessBoard } from './ChessBoard';
import { ChessPieces } from './ChessPieces';
import { HintArrow } from './HintArrow';
import { useGameStore } from '../../store/gameStore';
import type { ViewMode } from '../../chess/types';

interface CameraControllerProps {
  viewMode: ViewMode;
  isRotating: boolean;
}

const CameraController: React.FC<CameraControllerProps> = ({ viewMode, isRotating }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosition = useRef(new THREE.Vector3(0, 10, 12));
  const targetTarget = useRef(new THREE.Vector3(0, 0, 0));
  const rotationProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPosition = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);

  const getViewPositions = (mode: ViewMode) => {
    switch (mode) {
      case 'white':
        return { pos: new THREE.Vector3(0, 10, 12), target: new THREE.Vector3(0, 0, 0) };
      case 'black':
        return { pos: new THREE.Vector3(0, 10, -12), target: new THREE.Vector3(0, 0, 0) };
      case 'top':
        return { pos: new THREE.Vector3(0, 18, 0.001), target: new THREE.Vector3(0, 0, 0) };
      case 'free':
        return null;
      default:
        return { pos: new THREE.Vector3(0, 10, 12), target: new THREE.Vector3(0, 0, 0) };
    }
  };

  useEffect(() => {
    const positions = getViewPositions(viewMode);
    if (!positions) return;

    if (isRotating && !isAnimating.current) {
      isAnimating.current = true;
      rotationProgress.current = 0;
      startPosition.current.copy(camera.position);
      startTarget.current.copy(controlsRef.current?.target || new THREE.Vector3());
      endPosition.current.copy(positions.pos);
      endTarget.current.copy(positions.target);
    } else if (!isRotating) {
      targetPosition.current.copy(positions.pos);
      targetTarget.current.copy(positions.target);
      isAnimating.current = false;
    }
  }, [viewMode, isRotating, camera.position]);

  useFrame((_, delta) => {
    if (viewMode === 'free') return;

    if (isAnimating.current && controlsRef.current) {
      rotationProgress.current = Math.min(1, rotationProgress.current + delta * 1.5);
      const t = rotationProgress.current;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      camera.position.lerpVectors(startPosition.current, endPosition.current, easeT);
      controlsRef.current.target.lerpVectors(startTarget.current, endTarget.current, easeT);
      controlsRef.current.update();

      if (rotationProgress.current >= 1) {
        isAnimating.current = false;
        targetPosition.current.copy(endPosition.current);
        targetTarget.current.copy(endTarget.current);
      }
    } else if (controlsRef.current && !isAnimating.current) {
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
      maxPolarAngle={viewMode === 'top' ? Math.PI / 12 : Math.PI / 2.1}
      minPolarAngle={viewMode === 'top' ? 0 : Math.PI / 6}
      enablePan={false}
      enableRotate={viewMode === 'free'}
    />
  );
};

const SceneContent: React.FC = () => {
  const { viewMode, currentTurn, gameStatus, isAIThinking, makeAIMove, gameMode, isRotating } = useGameStore();

  useEffect(() => {
    if (gameMode === 'single' && currentTurn === 'black' && gameStatus === 'playing' && !isAIThinking) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameStatus, isAIThinking, makeAIMove, gameMode]);

  return (
    <>
      <CameraController viewMode={viewMode} isRotating={isRotating} />

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
      <HintArrow />

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
