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
  const startSpherical = useRef(new THREE.Spherical());
  const endSpherical = useRef(new THREE.Spherical());
  const startTarget = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const tempSpherical = useRef(new THREE.Spherical());
  const tempVector = useRef(new THREE.Vector3());

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

  const getPolarAngleLimits = () => {
    if (isAnimating.current || isRotating) {
      return { min: 0, max: Math.PI };
    }
    if (viewMode === 'top') {
      return { min: 0, max: Math.PI / 12 };
    }
    return { min: Math.PI / 6, max: Math.PI / 2.1 };
  };

  const getEnableRotate = () => {
    if (isAnimating.current || isRotating) {
      return true;
    }
    return viewMode === 'free';
  };

  const syncControlsState = () => {
    if (!controlsRef.current) return;
    const offset = tempVector.current.copy(camera.position).sub(controlsRef.current.target);
    tempSpherical.current.setFromVector3(offset);
    controlsRef.current.spherical.theta = tempSpherical.current.theta;
    controlsRef.current.spherical.phi = tempSpherical.current.phi;
    controlsRef.current.update();
  };

  useEffect(() => {
    const positions = getViewPositions(viewMode);
    if (!positions) return;

    if (isRotating && !isAnimating.current) {
      isAnimating.current = true;
      rotationProgress.current = 0;
      
      const startOffset = tempVector.current.copy(camera.position).sub(controlsRef.current?.target || new THREE.Vector3());
      startSpherical.current.setFromVector3(startOffset);
      startTarget.current.copy(controlsRef.current?.target || new THREE.Vector3());
      
      const endOffset = tempVector.current.copy(positions.pos).sub(positions.target);
      endSpherical.current.setFromVector3(endOffset);
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
      rotationProgress.current = Math.min(1, rotationProgress.current + delta * 1.2);
      const t = rotationProgress.current;
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      tempSpherical.current.theta = startSpherical.current.theta + (endSpherical.current.theta - startSpherical.current.theta) * easeT;
      tempSpherical.current.phi = startSpherical.current.phi + (endSpherical.current.phi - startSpherical.current.phi) * easeT;
      tempSpherical.current.radius = startSpherical.current.radius + (endSpherical.current.radius - startSpherical.current.radius) * easeT;

      tempVector.current.setFromSpherical(tempSpherical.current);
      controlsRef.current.target.lerpVectors(startTarget.current, endTarget.current, easeT);
      camera.position.copy(controlsRef.current.target).add(tempVector.current);
      
      controlsRef.current.update();

      if (rotationProgress.current >= 1) {
        isAnimating.current = false;
        const finalPositions = getViewPositions(viewMode);
        if (finalPositions) {
          targetPosition.current.copy(finalPositions.pos);
          targetTarget.current.copy(finalPositions.target);
        }
        syncControlsState();
      }
    } else if (controlsRef.current && !isAnimating.current) {
      camera.position.lerp(targetPosition.current, delta * 3);
      controlsRef.current.target.lerp(targetTarget.current, delta * 3);
      controlsRef.current.update();
    }
  });

  const polarLimits = getPolarAngleLimits();
  const enableRotate = getEnableRotate();

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={30}
      maxPolarAngle={polarLimits.max}
      minPolarAngle={polarLimits.min}
      enablePan={false}
      enableRotate={enableRotate}
    />
  );
};

const SceneContent: React.FC = () => {
  const { viewMode, currentTurn, gameStatus, isAIThinking, makeAIMove, gameMode, isRotating } = useGameStore();
  const boardGroupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);

  useEffect(() => {
    if (gameMode === 'single' && currentTurn === 'black' && gameStatus === 'playing' && !isAIThinking) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameStatus, isAIThinking, makeAIMove, gameMode]);

  useEffect(() => {
    targetRotation.current = viewMode === 'black' ? Math.PI : 0;
  }, [viewMode]);

  useFrame((_, delta) => {
    if (boardGroupRef.current) {
      const currentRot = boardGroupRef.current.rotation.y;
      const targetRot = targetRotation.current;
      const diff = targetRot - currentRot;
      boardGroupRef.current.rotation.y += diff * delta * 5;
    }
  });

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

      <group ref={boardGroupRef}>
        <ChessBoard />
        <ChessPieces />
        <HintArrow />
      </group>

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
