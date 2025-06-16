import React, { useRef, Suspense } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Plane, Box } from '@react-three/drei';
import * as THREE from 'three';
import { LandLoan } from './types';

interface CustomBillboardProps {
  children: React.ReactNode;
  position: [number, number, number];
  onClick: () => void;
}

const CustomBillboard: React.FC<CustomBillboardProps> = ({ children, position, onClick }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (ref.current) {
      ref.current.lookAt(camera.position);
    }
  });
  return (
    <mesh ref={ref} position={position} onClick={onClick}>
      {children}
    </mesh>
  );
};

interface PlotProps {
  loan: LandLoan;
  onClick: (loan: LandLoan) => void;
}

const Plot: React.FC<PlotProps> = ({ loan, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  // Unconditional useLoader call with fallback handling
  const leafTexture = useLoader(THREE.TextureLoader, '/assets/leaf.jpg');

  // Check if texture loaded successfully
  const isLeafTextureValid = leafTexture instanceof THREE.Texture && leafTexture.image;

  return (
    <>
      <Box
        position={[loan.coordinates.x, 0.5, loan.coordinates.z]}
        scale={[loan.size / 10, 1, loan.size / 10]}
        args={[10, 1, 10]}
        ref={meshRef}
      >
        <meshStandardMaterial color={loan.isLent ? 0xff0000 : 0x228b22} />
      </Box>
      <CustomBillboard
        position={[loan.coordinates.x, 5, loan.coordinates.z]}
        onClick={() => onClick(loan)}
      >
        <mesh>
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial
            map={isLeafTextureValid ? leafTexture : null}
            transparent
            opacity={0.8}
            color={isLeafTextureValid ? undefined : 0x228b22} // Fallback color
          />
        </mesh>
      </CustomBillboard>
    </>
  );
};

interface MetaverseProps {
  loans: LandLoan[];
  onSelectLoan: (loan: LandLoan) => void;
}

const Metaverse: React.FC<MetaverseProps> = ({ loans, onSelectLoan }) => {
  // Unconditional useLoader call with fallback handling
  const grassTexture = useLoader(THREE.TextureLoader, '/assets/grass.jpg');

  // Check if texture loaded successfully
  const isGrassTextureValid = grassTexture instanceof THREE.Texture && grassTexture.image;

  return (
    <Suspense fallback={<div role="status" aria-label="Loading 3D Metaverse">Loading Metaverse...</div>}>
      <Canvas camera={{ position: [0, 30, 50], fov: 75 }} className="metaverse" style={{ height: '50vh' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[50, 50, 50]} intensity={0.8} />
        <Plane args={[200, 200]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            map={isGrassTextureValid ? grassTexture : null}
            roughness={0.9}
            color={isGrassTextureValid ? undefined : 0x00ff00} // Fallback color
          />
        </Plane>
        {loans.map((loan) => (
          <Plot
            key={loan.id}
            loan={loan}
            onClick={() => onSelectLoan(loan)}
          />
        ))}
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={20}
          maxDistance={150}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </Suspense>
  );
};

export default Metaverse;