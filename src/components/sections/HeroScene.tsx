import { Environment, Float, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { AdditiveBlending, CatmullRomCurve3, Vector3 } from "three";
import type { Group } from "three";

function SoftwareMark() {
  const groupRef = useRef<Group>(null);
  const mainCurve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(-1.86, 0.04, -0.1),
          new Vector3(-1.54, 0.78, 0.34),
          new Vector3(-0.72, 0.98, 0.42),
          new Vector3(-0.06, 0.3, 0.08),
          new Vector3(0.44, -0.36, -0.36),
          new Vector3(1.18, -0.6, -0.18),
          new Vector3(1.76, 0.05, 0.28),
          new Vector3(1.42, 0.78, -0.18),
          new Vector3(0.62, 0.88, -0.42),
          new Vector3(0.04, 0.22, -0.08),
          new Vector3(-0.44, -0.54, 0.36),
          new Vector3(-1.18, -0.76, 0.18),
        ],
        true,
        "catmullrom",
        0.68,
      ),
    [],
  );
  const ascentCurve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(-0.74, -1.28, 0.14),
          new Vector3(-0.48, -0.66, 0.42),
          new Vector3(-0.08, 0.12, 0.6),
          new Vector3(0.44, 0.86, 0.28),
          new Vector3(1.02, 1.28, -0.08),
        ],
        false,
        "catmullrom",
        0.45,
      ),
    [],
  );
  const pipelineCurve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(-1.1, -0.1, -0.42),
          new Vector3(-0.34, 0.42, -0.54),
          new Vector3(0.48, 0.42, -0.34),
          new Vector3(1.16, -0.06, 0.22),
        ],
        false,
        "catmullrom",
        0.36,
      ),
    [],
  );
  const nodes = useMemo(
    () =>
      [0.02, 0.18, 0.36, 0.58, 0.78].map((value) =>
        mainCurve.getPointAt(value),
      ),
    [mainCurve],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.x =
      Math.sin(time * 0.28) * 0.07 + state.pointer.y * 0.1 + 0.24;
    groupRef.current.rotation.y =
      Math.sin(time * 0.18) * 0.18 + state.pointer.x * 0.16 - 0.38;
    groupRef.current.rotation.z = Math.sin(time * 0.22) * 0.035 - 0.22;
  });

  return (
    <Float speed={1.35} rotationIntensity={0.28} floatIntensity={0.58}>
      <group ref={groupRef} rotation={[0.24, -0.38, -0.22]} scale={1.12}>
        <mesh scale={1.035}>
          <tubeGeometry args={[mainCurve, 220, 0.2, 24, true]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#60A5FA"
            depthWrite={false}
            opacity={0.12}
            transparent
          />
        </mesh>

        <mesh>
          <tubeGeometry args={[mainCurve, 220, 0.135, 28, true]} />
          <meshPhysicalMaterial
            clearcoat={1}
            clearcoatRoughness={0.08}
            color="#7DD3FC"
            emissive="#2563EB"
            emissiveIntensity={0.28}
            envMapIntensity={1.45}
            metalness={0.36}
            opacity={0.92}
            roughness={0.12}
            transparent
            transmission={0.1}
            thickness={0.42}
          />
        </mesh>

        <mesh>
          <tubeGeometry args={[ascentCurve, 118, 0.105, 24, false]} />
          <meshPhysicalMaterial
            clearcoat={1}
            clearcoatRoughness={0.1}
            color="#A78BFA"
            emissive="#7C3AED"
            emissiveIntensity={0.35}
            envMapIntensity={1.35}
            metalness={0.3}
            opacity={0.9}
            roughness={0.14}
            transparent
            transmission={0.14}
            thickness={0.36}
          />
        </mesh>

        <mesh>
          <tubeGeometry args={[pipelineCurve, 96, 0.038, 16, false]} />
          <meshPhysicalMaterial
            clearcoat={1}
            color="#E0F2FE"
            emissive="#BFDBFE"
            emissiveIntensity={0.42}
            metalness={0.2}
            opacity={0.74}
            roughness={0.1}
            transparent
          />
        </mesh>

        {nodes.map((node, index) => (
          <group key={`${node.x}-${index}`} position={node}>
            <mesh>
              <sphereGeometry args={[index === 2 ? 0.105 : 0.085, 28, 18]} />
              <meshPhysicalMaterial
                clearcoat={1}
                color={index % 2 === 0 ? "#DBEAFE" : "#DDD6FE"}
                emissive={index % 2 === 0 ? "#3B82F6" : "#8B5CF6"}
                emissiveIntensity={0.36}
                metalness={0.24}
                roughness={0.1}
              />
            </mesh>
            <mesh scale={2.2}>
              <sphereGeometry args={[index === 2 ? 0.105 : 0.085, 20, 12]} />
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={index % 2 === 0 ? "#60A5FA" : "#A78BFA"}
                depthWrite={false}
                opacity={0.13}
                transparent
              />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
}

export function HeroScene() {
  return (
    <div className="pointer-events-none h-full w-full opacity-95">
      <Canvas
        aria-hidden
        className="h-full w-full"
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6.8], fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
      >
        <ambientLight intensity={0.62} />
        <directionalLight
          position={[3, 4, 5]}
          intensity={1.2}
          color="#EFF6FF"
        />
        <pointLight
          position={[3.4, 2.4, 4.2]}
          intensity={2.4}
          color="#93C5FD"
        />
        <pointLight
          position={[-3.8, -2.2, 2.4]}
          intensity={1.8}
          color="#A78BFA"
        />
        <pointLight position={[0, 0.2, 3.2]} intensity={0.9} color="#FFFFFF" />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <SoftwareMark />
          <Sparkles
            count={34}
            scale={4.8}
            size={1.4}
            speed={0.28}
            color="#C4B5FD"
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
