import React, { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Box, Text } from '@react-three/drei'
import useStore from '../lib/store'
import ViewportControls from './viewport/ViewportControls'
import Scene3D from './viewport/Scene3D'

const Viewport = () => {
  const canvasRef = useRef()
  const { barracao, ui, setUI } = useStore()

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
      >
        {/* Iluminação */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {/* Controles de Câmera */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.1}
        />

        {/* Grid do Chão */}
        {ui.showGrid && (
          <Grid
            position={[0, 0, 0]}
            args={[barracao.dimensions.length, barracao.dimensions.width]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#aaaaaa"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#666666"
            fadeDistance={50}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={false}
          />
        )}

        {/* Barracão (Wireframe) */}
        <group position={[0, barracao.dimensions.height / 2, 0]}>
          {/* Chão */}
          <Box
            args={[barracao.dimensions.length, 0.1, barracao.dimensions.width]}
            position={[0, -barracao.dimensions.height / 2, 0]}
          >
            <meshStandardMaterial color="#cccccc" transparent opacity={0.3} />
          </Box>

          {/* Paredes (Wireframe) */}
          <group>
            {/* Parede Frontal */}
            <Box
              args={[barracao.dimensions.length, barracao.dimensions.height, 0.1]}
              position={[0, 0, barracao.dimensions.width / 2]}
            >
              <meshStandardMaterial color="#e0e0e0" transparent opacity={0.2} wireframe />
            </Box>

            {/* Parede Traseira */}
            <Box
              args={[barracao.dimensions.length, barracao.dimensions.height, 0.1]}
              position={[0, 0, -barracao.dimensions.width / 2]}
            >
              <meshStandardMaterial color="#e0e0e0" transparent opacity={0.2} wireframe />
            </Box>

            {/* Parede Esquerda */}
            <Box
              args={[0.1, barracao.dimensions.height, barracao.dimensions.width]}
              position={[-barracao.dimensions.length / 2, 0, 0]}
            >
              <meshStandardMaterial color="#e0e0e0" transparent opacity={0.2} wireframe />
            </Box>

            {/* Parede Direita */}
            <Box
              args={[0.1, barracao.dimensions.height, barracao.dimensions.width]}
              position={[barracao.dimensions.length / 2, 0, 0]}
            >
              <meshStandardMaterial color="#e0e0e0" transparent opacity={0.2} wireframe />
            </Box>
          </group>
        </group>

        {/* Cena 3D com Blocos */}
        <Scene3D />

        {/* Texto de Dimensões */}
        <Text
          position={[0, barracao.dimensions.height + 1, barracao.dimensions.width / 2 + 2]}
          fontSize={0.8}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          {`${barracao.dimensions.length}m × ${barracao.dimensions.width}m × ${barracao.dimensions.height}m`}
        </Text>
      </Canvas>

      {/* Overlay com Controles */}
      <div className="viewport-overlay">
        <ViewportControls />
        
        {/* Loading Indicator */}
        {ui.loading && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 shadow-lg flex items-center space-x-3">
              <div className="loading-spinner w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-700">Processando...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {ui.error && (
          <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm">
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
