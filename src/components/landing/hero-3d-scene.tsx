'use client'

import { useRef, useMemo, useEffect, useState, Component, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const NODE_COUNT = 80
const CONNECTION_DISTANCE = 3.5
const COLORS = [0x2563eb, 0x0ea5e9, 0x1d4ed8]

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

function HeroFallback() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
          top: '-100px',
          left: '20%',
          animation: 'hero-float1 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
          bottom: '-50px',
          right: '25%',
          animation: 'hero-float2 10s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes hero-float1 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes hero-float2 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
      `}</style>
    </div>
  )
}

type ErrorBoundaryProps = { fallback: ReactNode; children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

interface ParticleNetworkProps {
  mouseX: number
  mouseY: number
}

function ParticleNetwork({ mouseX, mouseY }: ParticleNetworkProps) {
  const groupRef = useRef<THREE.Group>(null)

  const nodes = useMemo(() => {
    return Array.from({ length: NODE_COUNT }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8
      ),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.3 + 0.25,
      size: Math.random() * 0.03 + 0.025,
    }))
  }, [])

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const maxLines = NODE_COUNT * NODE_COUNT
    const positions = new Float32Array(maxLines * 6)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setDrawRange(0, 0)
    return geometry
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return

    // Auto rotate
    groupRef.current.rotation.y += 0.0003

    // Mouse parallax — smooth lerp on camera
    state.camera.position.x += (mouseX * 2 - state.camera.position.x) * 0.05
    state.camera.position.y += (-mouseY * 1.5 - state.camera.position.y) * 0.05
    state.camera.lookAt(0, 0, 0)

    // Update connections
    const posAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    let lineIndex = 0

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position)
        if (dist < CONNECTION_DISTANCE) {
          const idx = lineIndex * 6
          posArray[idx] = nodes[i].position.x
          posArray[idx + 1] = nodes[i].position.y
          posArray[idx + 2] = nodes[i].position.z
          posArray[idx + 3] = nodes[j].position.x
          posArray[idx + 4] = nodes[j].position.y
          posArray[idx + 5] = nodes[j].position.z
          lineIndex++
        }
      }
    }

    lineGeometry.setDrawRange(0, lineIndex * 2)
    posAttr.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[node.size, 8, 8]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={node.opacity}
          />
        </mesh>
      ))}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={0x2563eb} transparent opacity={0.12} />
      </lineSegments>
    </group>
  )
}

interface HeroSceneProps {
  mouseX?: number
  mouseY?: number
}

function HeroScene({ mouseX = 0, mouseY = 0 }: HeroSceneProps) {
  const [webglAvailable, setWebglAvailable] = useState(true)

  useEffect(() => {
    setWebglAvailable(canUseWebGL())
  }, [])

  if (!webglAvailable) return <HeroFallback />

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <WebGLErrorBoundary fallback={<HeroFallback />}>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 75 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          gl={{
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: 'default',
            preserveDrawingBuffer: false,
          }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              'webglcontextlost',
              (e) => { e.preventDefault() },
              false
            )
          }}
        >
          <ParticleNetwork mouseX={mouseX} mouseY={mouseY} />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  )
}

export default HeroScene