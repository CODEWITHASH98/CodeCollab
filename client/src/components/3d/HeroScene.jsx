import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";

function Cube(props) {
    const mesh = useRef();

    useFrame((state, delta) => {
        mesh.current.rotation.x += delta * 0.2;
        mesh.current.rotation.y += delta * 0.2;
    });

    return (
        <mesh {...props} ref={mesh}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={props.color} wireframe={props.wireframe} />
        </mesh>
    );
}

function SceneContent() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {/* Background Stars */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Floating Elements */}
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <Cube position={[0, 0, 0]} color="#FF5722" wireframe />
                <Cube position={[-2, 1, -2]} color="#666" wireframe />
                <Cube position={[2, -1, -3]} color="#333" wireframe />
            </Float>
        </>
    );
}

export default function HeroScene() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <Canvas camera={{ position: [0, 0, 5] }}>
                <SceneContent />
            </Canvas>
        </div>
    );
}
