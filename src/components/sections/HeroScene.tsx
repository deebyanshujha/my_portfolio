import { Float, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

function CoreKnot() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.23 + state.pointer.y * 0.18;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.34 + state.pointer.x * 0.28;
  });

  return (
    <Float speed={1.6} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.12, 0.28, 140, 18]} />
        <meshStandardMaterial
          color="#93C5FD"
          emissive="#3B82F6"
          emissiveIntensity={0.38}
          metalness={0.46}
          roughness={0.18}
        />
      </mesh>
      <mesh scale={1.42}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#8B5CF6" wireframe transparent opacity={0.22} />
      </mesh>
    </Float>
  );
}

export function HeroScene() {
  return (
    <div className="pointer-events-none absolute left-[65%] top-20 z-0 h-[360px] w-[90%] opacity-[0.18] sm:left-[58%] sm:opacity-30 md:pointer-events-auto md:inset-y-0 md:left-auto md:right-0 md:h-[560px] md:w-[58%] md:opacity-80 lg:opacity-100">
      <Canvas
        aria-hidden
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[4, 3, 5]} intensity={2.1} color="#93C5FD" />
        <pointLight position={[-4, -2, 2]} intensity={1.6} color="#8B5CF6" />
        <Suspense fallback={null}>
          <CoreKnot />
          <Sparkles count={48} scale={5.4} size={1.8} speed={0.35} color="#C4B5FD" />
        </Suspense>
      </Canvas>
    </div>
  );
}
