import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import type { Position } from '../../chess/types';

const positionToWorld = (pos: Position): THREE.Vector3 => {
  return new THREE.Vector3(pos.col - 3.5, 0.5, 3.5 - pos.row);
};

export const HintArrow: React.FC = () => {
  const { hintArrow } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.ArrowHelper>(null);
  const opacityRef = useRef(0);

  const arrowData = useMemo(() => {
    if (!hintArrow || !hintArrow.visible) return null;

    const from = positionToWorld(hintArrow.from);
    const to = positionToWorld(hintArrow.to);
    
    const direction = new THREE.Vector3()
      .subVectors(to, from)
      .normalize();
    
    const length = from.distanceTo(to);
    const midPoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

    return {
      direction,
      length,
      position: midPoint,
      from,
      to,
    };
  }, [hintArrow]);

  useFrame((_, delta) => {
    if (!groupRef.current || !arrowRef.current) return;

    if (arrowData && hintArrow?.visible) {
      opacityRef.current = Math.min(1, opacityRef.current + delta * 3);
    } else {
      opacityRef.current = Math.max(0, opacityRef.current - delta * 3);
    }

    const arrow = arrowRef.current;
    const line = arrow.children[0] as THREE.Line;
    const cone = arrow.children[1] as THREE.Mesh;
    (line.material as THREE.MeshBasicMaterial).opacity = opacityRef.current;
    (cone.material as THREE.MeshBasicMaterial).opacity = opacityRef.current;

    if (opacityRef.current > 0) {
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  if (!arrowData || !hintArrow?.visible) {
    return <group ref={groupRef} visible={false} />;
  }

  const arrowLength = arrowData.length * 0.6;
  const headLength = 0.3;
  const headWidth = 0.15;

  return (
    <group ref={groupRef}>
      <mesh position={arrowData.from}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh position={arrowData.to}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.9}
        />
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[0.15, 0.3, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </mesh>

      <primitive
        object={new THREE.ArrowHelper(
          arrowData.direction,
          arrowData.from,
          arrowLength,
          0x3b82f6,
          headLength,
          headWidth
        )}
        ref={arrowRef as React.RefObject<THREE.ArrowHelper>}
      />

      <mesh
        ref={(mesh) => {
          if (mesh && arrowData) {
            const curve = new THREE.QuadraticBezierCurve3(
              arrowData.from.clone().add(new THREE.Vector3(0, 0.2, 0)),
              new THREE.Vector3().addVectors(arrowData.from, arrowData.to).multiplyScalar(0.5).add(new THREE.Vector3(0, 1, 0)),
              arrowData.to.clone().add(new THREE.Vector3(0, 0.2, 0))
            );
            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            mesh.geometry = geometry;
          }
        }}
      >
        <lineBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.6}
          linewidth={2}
        />
      </mesh>

      <pointLight
        position={arrowData.position}
        color="#3b82f6"
        intensity={2}
        distance={3}
      />
    </group>
  );
};
