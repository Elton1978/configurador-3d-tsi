import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Box, Text } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../lib/store'
import ViewportControls from './viewport/ViewportControls'
import Scene3D from './viewport/Scene3D'
import modelLoader from '../lib/modelLoader'
import collisionDetection from '../lib/collisionDetection'
import snappingSystem from '../lib/snappingSystem'

const CameraController = () => {
  const { camera, gl } = useThree()
  const { ui } = useStore()

  useEffect(() => {
    // Configurar câmera inicial
    camera.position.set(15, 15, 15)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return null
}

const Viewport = () => {
  const canvasRef = useRef()
  const { 
    barracao, 
    ui, 
    setUI, 
    projectBlocks, 
    currentProject 
  } = useStore()
  
  const [collisionVisualizers, setCollisionVisualizers] = useState([])
  const [snapVisualizers, setSnapVisualizers] = useState([])

  // Verificar colisões quando os blocos mudarem
  useEffect(() => {
    if (projectBlocks.length > 1) {
      const meshes = projectBlocks
        .map(block => block.mesh)
        .filter(Boolean)
      
      if (meshes.length > 1) {
        const collisions = collisionDetection.checkAllCollisions(meshes)
        
        if (collisions.length > 0) {
          const visualizers = collisionDetection.createCollisionVisualizers(collisions)
          setCollisionVisualizers(visualizers)
        } else {
          setCollisionVisualizers([])
        }
      }
    } else {
      setCollisionVisualizers([])
    }
  }, [projectBlocks])

  // Configurar limites do barracão para detecção de colisões
  const barracaoBoundaries = {
    width: barracao.dimensions.width,
    length: barracao.dimensions.length,
    height: barracao.dimensions.height
  }

  return (
    <div className="viewport-container relative w-full h-full bg-gray-100">
      {/* Canvas Three.js */}
      <Canvas
        ref={canvasRef}
        camera={{ 
          position: [15, 15, 15], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        className="w-full h-full"
        onCreated={({ gl }) => {
          // Configurar renderer para melhor qualidade
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.2
        }}
      >
        {/* Controles de câmera */}
        <CameraController />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.1}
          dampingFactor={0.05}
          enableDamping={true}
        />

        {/* Iluminação aprimorada */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[20, 30, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={100}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-bias={-0.0001}
        />
        
        {/* Luz de preenchimento */}
        <directionalLight
          position={[-10, 20, -10]}
          intensity={0.4}
          color="#4f46e5"
        />
        
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {/* Grid do Chão */}
        {ui.showGrid && (
          <Grid
            position={[0, 0, 0]}
            args={[barracao.dimensions.length * 2, barracao.dimensions.width * 2]}
            cellSize={snappingSystem.gridSize}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#374151"
            fadeDistance={50}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={false}
          />
        )}

        {/* Barracão */}
        <group position={[0, barracao.dimensions.height / 2, 0]}>
          {/* Chão do barracão */}
          <Box
            args={[barracao.dimensions.length, 0.1, barracao.dimensions.width]}
            position={[0, -barracao.dimensions.height / 2, 0]}
            receiveShadow
          >
            <meshStandardMaterial 
              color="#e2e8f0" 
              roughness={0.8}
              metalness={0.1}
              transparent 
              opacity={0.5} 
            />
          </Box>

          {/* Paredes do barracão */}
          <group>
            {/* Parede Frontal */}
            <Box
              args={[barracao.dimensions.length, barracao.dimensions.height, 0.1]}
              position={[0, 0, barracao.dimensions.width / 2]}
            >
              <meshStandardMaterial 
                color="#cbd5e1" 
                transparent 
                opacity={0.2} 
                wireframe={true}
              />
            </Box>

            {/* Parede Traseira */}
            <Box
              args={[barracao.dimensions.length, barracao.dimensions.height, 0.1]}
              position={[0, 0, -barracao.dimensions.width / 2]}
            >
              <meshStandardMaterial 
                color="#cbd5e1" 
                transparent 
                opacity={0.2} 
                wireframe={true}
              />
            </Box>

            {/* Parede Esquerda */}
            <Box
              args={[0.1, barracao.dimensions.height, barracao.dimensions.width]}
              position={[-barracao.dimensions.length / 2, 0, 0]}
            >
              <meshStandardMaterial 
                color="#cbd5e1" 
                transparent 
                opacity={0.2} 
                wireframe={true}
              />
            </Box>

            {/* Parede Direita */}
            <Box
              args={[0.1, barracao.dimensions.height, barracao.dimensions.width]}
              position={[barracao.dimensions.length / 2, 0, 0]}
            >
              <meshStandardMaterial 
                color="#cbd5e1" 
                transparent 
                opacity={0.2} 
                wireframe={true}
              />
            </Box>
          </group>
        </group>

        {/* Cena 3D com Blocos */}
        <Scene3D />

        {/* Visualizadores de colisão */}
        {collisionVisualizers.map((visualizer, index) => (
          <primitive key={`collision-${index}`} object={visualizer} />
        ))}

        {/* Visualizadores de snapping */}
        {snapVisualizers.map((visualizer, index) => (
          <primitive key={`snap-${index}`} object={visualizer} />
        ))}

        {/* Placeholder para quando não há blocos */}
        {projectBlocks.length === 0 && (
          <group>
            <Box position={[0, 0.5, 0]} args={[2, 1, 2]}>
              <meshStandardMaterial 
                color="#e5e7eb" 
                transparent 
                opacity={0.3}
                wireframe={ui.ghostMode}
              />
            </Box>
            
            {/* Texto indicativo */}
            <Text
              position={[0, 2, 0]}
              fontSize={0.8}
              color="#6b7280"
              anchorX="center"
              anchorY="middle"
            >
              Arraste blocos aqui para começar
            </Text>
          </group>
        )}

        {/* Texto de Dimensões do Barracão */}
        <Text
          position={[0, barracao.dimensions.height + 1, barracao.dimensions.width / 2 + 2]}
          fontSize={0.8}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          {`${barracao.dimensions.length}m × ${barracao.dimensions.width}m × ${barracao.dimensions.height}m`}
        </Text>

        {/* Eixos de coordenadas (debug) */}
        {process.env.NODE_ENV === 'development' && (
          <axesHelper args={[5]} />
        )}
      </Canvas>

      {/* Overlay com Controles */}
      <div className="viewport-overlay">
        <ViewportControls />
        
        {/* Informações de debug */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs z-10">
            <div>Blocos: {projectBlocks.length}</div>
            <div>Colisões: {Math.floor(collisionVisualizers.length / 3)}</div>
            <div>Grid: {snappingSystem.gridSize}m</div>
            <div>Snap Distance: {snappingSystem.snapDistance}m</div>
          </div>
        )}
        
        {/* Loading Indicator */}
        {ui.loading && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-4 shadow-lg flex items-center space-x-3">
              <div className="loading-spinner w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-700">Processando...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {ui.error && (
          <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm z-20">
            <div className="flex items-center justify-between">
              <span className="text-sm">{ui.error}</span>
              <button
                onClick={() => setUI({ error: null })}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Viewport
