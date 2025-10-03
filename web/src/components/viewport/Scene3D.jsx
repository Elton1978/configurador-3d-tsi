import React, { useEffect, useRef, useState } from 'react'
import { Box, Sphere, Cylinder } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../../lib/store'
import modelLoader from '../../lib/modelLoader'
import collisionDetection from '../../lib/collisionDetection'
import snappingSystem from '../../lib/snappingSystem'

const Block3D = ({ block, isSelected, onClick, onDrag }) => {
  const meshRef = useRef()
  const { variant } = block
  const { ui } = useStore()
  const dimensions = variant.dimensions || { length: 1, width: 1, height: 1 }
  
  // Cores baseadas na família do bloco
  const getFamilyColor = (familyName) => {
    const colors = {
      'Dosador Gravimétrico': '#3b82f6', // Azul
      'Misturador Industrial': '#10b981', // Verde
      'Elevador de Canecas': '#f59e0b', // Amarelo
      'Transportador Helicoidal': '#8b5cf6', // Roxo
      'Tanque de Armazenamento': '#06b6d4', // Ciano
      'Painel de Controle': '#ef4444', // Vermelho
      'Sistema de Tubulação': '#6b7280', // Cinza
      'Filtro Industrial': '#ec4899' // Rosa
    }
    return colors[familyName] || '#6b7280'
  }

  const color = getFamilyColor(variant.family_name)
  const selectedColor = '#ff6b6b'

  // Atualizar referência do mesh no bloco para detecção de colisões
  useEffect(() => {
    if (meshRef.current) {
      block.mesh = meshRef.current
    }
  }, [block])

  // Verificar colisões em tempo real
  useFrame(() => {
    if (meshRef.current && isSelected) {
      // Atualizar matriz do mundo
      meshRef.current.updateMatrixWorld(true)
    }
  })

  return (
    <group
      ref={meshRef}
      position={[block.position.x, block.position.y + dimensions.height / 2, block.position.z]}
      rotation={[block.rotation.x, block.rotation.y, block.rotation.z]}
      onClick={onClick}
      userData={{ blockId: block.id, variant }}
    >
      {/* Bloco Principal */}
      <Box
        args={[dimensions.length, dimensions.height, dimensions.width]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={isSelected ? selectedColor : color}
          transparent
          opacity={isSelected ? 0.8 : 0.7}
          wireframe={isSelected && ui.ghostMode}
          roughness={0.4}
          metalness={0.3}
        />
      </Box>

      {/* Conectores (se habilitados) */}
      {ui.showConnectors && variant.connectors && (
        <group>
          {variant.connectors.map((connector, index) => (
            <Sphere
              key={index}
              args={[0.15]}
              position={[
                connector.position.x,
                connector.position.y - dimensions.height / 2,
                connector.position.z
              ]}
            >
              <meshStandardMaterial
                color={
                  connector.type === 'electric' ? '#fbbf24' :
                  connector.type === 'mechanic' ? '#374151' :
                  connector.type === 'hydraulic' ? '#3b82f6' :
                  connector.type === 'pneumatic' ? '#10b981' :
                  '#6b7280'
                }
                emissive={
                  connector.type === 'electric' ? '#fbbf24' :
                  connector.type === 'hydraulic' ? '#3b82f6' :
                  '#000000'
                }
                emissiveIntensity={0.2}
              />
            </Sphere>
          ))}
        </group>
      )}

      {/* Bounding Box (Ghost Mode) */}
      {ui.ghostMode && (
        <Box
          args={[
            dimensions.length + collisionDetection.clearanceDistance,
            dimensions.height + collisionDetection.clearanceDistance,
            dimensions.width + collisionDetection.clearanceDistance
          ]}
        >
          <meshStandardMaterial
            color="#ff6b6b"
            transparent
            opacity={0.1}
            wireframe
          />
        </Box>
      )}

      {/* Outline para seleção */}
      {isSelected && (
        <Box
          args={[
            dimensions.length + 0.1,
            dimensions.height + 0.1,
            dimensions.width + 0.1
          ]}
        >
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.3}
            wireframe
          />
        </Box>
      )}

      {/* Label do Bloco */}
      <group position={[0, dimensions.height / 2 + 0.8, 0]}>
        <mesh>
          <planeGeometry args={[Math.max(3, variant.name?.length * 0.2 || 3), 0.6]} />
          <meshBasicMaterial 
            color="white" 
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Texto do nome seria renderizado aqui */}
      </group>

      {/* Indicador de status */}
      <group position={[dimensions.length / 2 + 0.3, dimensions.height / 2, 0]}>
        <Sphere args={[0.1]}>
          <meshBasicMaterial
            color={
              block.status === 'connected' ? '#10b981' :
              block.status === 'warning' ? '#f59e0b' :
              block.status === 'error' ? '#ef4444' :
              '#6b7280'
            }
          />
        </Sphere>
      </group>
    </group>
  )
}

const Scene3D = () => {
  const { 
    projectBlocks, 
    selectedBlock, 
    setSelectedBlock,
    addProjectBlock,
    updateProjectBlock,
    ui
  } = useStore()
  
  const [draggedBlock, setDraggedBlock] = useState(null)
  const [snapPreview, setSnapPreview] = useState(null)

  const handleBlockClick = (event, block) => {
    event.stopPropagation()
    setSelectedBlock(selectedBlock?.id === block.id ? null : block)
  }

  const handleBlockDrag = (block, newPosition) => {
    // Encontrar ponto de snap
    const otherBlocks = projectBlocks
      .filter(b => b.id !== block.id)
      .map(b => b.mesh)
      .filter(Boolean)
    
    const snapResult = snappingSystem.findSnapPoint(
      block.mesh,
      newPosition,
      otherBlocks
    )

    // Atualizar posição do bloco
    const finalPosition = snapResult.hasSnap ? snapResult.position : newPosition
    
    updateProjectBlock(block.id, {
      position: {
        x: finalPosition.x,
        y: finalPosition.y,
        z: finalPosition.z
      }
    })

    // Atualizar preview de snap
    setSnapPreview(snapResult.hasSnap ? snapResult : null)
  }

  // Limpar preview de snap quando não há seleção
  useEffect(() => {
    if (!selectedBlock) {
      setSnapPreview(null)
    }
  }, [selectedBlock])

  return (
    <group>
      {/* Renderizar todos os blocos do projeto */}
      {projectBlocks.map(block => (
        <Block3D
          key={block.id}
          block={block}
          isSelected={selectedBlock?.id === block.id}
          onClick={(event) => handleBlockClick(event, block)}
          onDrag={(newPosition) => handleBlockDrag(block, newPosition)}
        />
      ))}

      {/* Preview de snap */}
      {snapPreview && (
        <group>
          {/* Ponto de snap */}
          <Sphere args={[0.2]} position={snapPreview.position}>
            <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
          </Sphere>
          
          {/* Linha de snap */}
          {snapPreview.originalPosition && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    snapPreview.originalPosition.x, snapPreview.originalPosition.y, snapPreview.originalPosition.z,
                    snapPreview.position.x, snapPreview.position.y, snapPreview.position.z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#00ff00" />
            </line>
          )}
        </group>
      )}

      {/* Grid de snap (se habilitado) */}
      {ui.showGrid && snappingSystem.enableGridSnap && (
        <group>
          {/* Pontos de snap da grade seriam renderizados aqui */}
        </group>
      )}

      {/* Placeholder para quando não há blocos */}
      {projectBlocks.length === 0 && (
        <group position={[0, 1, 0]}>
          <Box args={[2, 0.1, 2]}>
            <meshStandardMaterial color="#e5e7eb" transparent opacity={0.5} />
          </Box>
        </group>
      )}

      {/* Ferramentas de medição */}
      {ui.measurementMode && (
        <group>
          {/* Implementar ferramenta de medição aqui */}
        </group>
      )}

      {/* Indicadores de performance */}
      {process.env.NODE_ENV === 'development' && (
        <group position={[10, 10, 10]}>
          {/* Debug info seria renderizado aqui */}
        </group>
      )}
    </group>
  )
}

export default Scene3D
