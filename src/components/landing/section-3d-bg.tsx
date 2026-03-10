'use client'

import { useRef, useMemo, useEffect, useState, Component, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Section3DBgProps {
  nodeCount?: number
  nodeColor1?: string
  nodeColor2?: string
  opacity?: number
  mouseX?: number
  mouseY?: number
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

interface ParticleFieldProps {
  nodeCount: number
  color1: number
  color2: number
  nodeOpacity: number
  mouseX: number
  mouseY: number
}

function ParticleField({ nodeCount, color1, color2, nodeOpacity, mouseX, mouseY }: ParticleFieldProps) {
  const groupRef = useRef<THREE.Group>(null)
  const colors = useMemo(() => [color1, color2], [color1, color2])

  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 36,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 8
      ),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: (Math.random() * 0.3 + 0.2) * nodeOpacity,
      size: Math.random() * 0.02 + 0.02,
    }))
  }, [nodeCount, colors, nodeOpacity])

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const maxLines = nodeCount * nodeCount
    const positions = new Float32Array(maxLines * 6)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setDrawRange(0, 0)
    return geometry
  }, [nodeCount])

  useFrame((state) => {
    if (!groupRef.current) return

    // Slow auto rotate
    groupRef.current.rotation.y += 0.0002

    // Mouse parallax — subtle
    state.camera.position.x += (mouseX * 1.5 - state.camera.position.x) * 0.03
    state.camera.position.y += (-mouseY * 1.5 - state.camera.position.y) * 0.03
    state.camera.lookAt(0, 0, 0)

    // Update connections
    const posAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    let lineIndex = 0

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position)
        if (dist < 4) {
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
        <lineBasicMaterial color={colors[0]} transparent opacity={0.08} />
      </lineSegments>
    </group>
  )
}

function Section3DBg({
  nodeCount = 40,
  nodeColor1 = '#1D4ED8',
  nodeColor2 = '#0E7490',
  opacity = 0.6,
  mouseX = 0,
  mouseY = 0,
}: Section3DBgProps) {
  const [webglAvailable, setWebglAvailable] = useState(true)

  useEffect(() => {
    setWebglAvailable(canUseWebGL())
  }, [])

  const color1 = useMemo(() => new THREE.Color(nodeColor1).getHex(), [nodeColor1])
  const color2 = useMemo(() => new THREE.Color(nodeColor2).getHex(), [nodeColor2])

  if (!webglAvailable) return null

  return (
    <WebGLErrorBoundary fallback={<></>}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 75 }}
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
        <ParticleField
          nodeCount={nodeCount}
          color1={color1}
          color2={color2}
          nodeOpacity={opacity}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      </Canvas>
    </WebGLErrorBoundary>
  )
}

export default Section3DBg