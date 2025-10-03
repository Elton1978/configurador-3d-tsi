import React from 'react'
import { Box, Sphere, Cylinder } from '@react-three/drei'
import useStore from '../../lib/store'

const Block3D = ({ block, isSelected, onClick }) => {
  const { variant } = block
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

  return (
    <group
      position={[block.position.x, block.position.y + dimensions.height / 2, block.position.z]}
      rotation={[block.rotation.x, block.rotation.y, block.rotation.z]}
      onClick={onClick}
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
          wireframe={isSelected}
        />
      </Box>

      {/* Conectores (se habilitados) */}
      {useStore.getState().ui.showConnectors && variant.connectors && (
        <group>
          {variant.connectors.map((connector, index) => (
            <Sphere
              key={index}
              args={[0.1]}
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
                  '#6b7280'
                }
              />
            </Sphere>
          ))}
        </group>
      )}

      {/* Bounding Box (Ghost Mode) */}
      {useStore.getState().ui.ghostMode && (
        <Box
          args={[
            dimensions.length + 3, // Clearance de 1.5m de cada lado
            dimensions.height + 3,
            dimensions.width + 3
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

      {/* Label do Bloco */}
      <group position={[0, dimensions.height / 2 + 0.5, 0]}>
        <mesh>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="white" transparent opacity={0.8} />
        </mesh>
        {/* Texto seria renderizado aqui com Text component */}
      </group>
    </group>
  )
}

const Scene3D = () => {
  const { projectBlocks, selectedBlock, setSelectedBlock } = useStore()

  const handleBlockClick = (event, block) => {
    event.stopPropagation()
    setSelectedBlock(selectedBlock?.id === block.id ? null : block)
  }

  return (
    <group>
      {/* Renderizar todos os blocos do projeto */}
      {projectBlocks.map(block => (
        <Block3D
          key={block.id}
          block={block}
          isSelected={selectedBlock?.id === block.id}
          onClick={(event) => handleBlockClick(event, block)}
        />
      ))}

      {/* Placeholder para quando não há blocos */}
      {projectBlocks.length === 0 && (
        <group position={[0, 1, 0]}>
          <Box args={[2, 0.1, 2]}>
            <meshStandardMaterial color="#e5e7eb" transparent opacity={0.5} />
          </Box>
          {/* Texto indicativo seria renderizado aqui */}
        </group>
      )}

      {/* Indicadores de Colisão */}
      {/* Implementar detecção de colisão aqui */}
      
      {/* Linhas de Medição */}
      {/* Implementar ferramenta de medição aqui */}
    </group>
  )
}

export default Scene3D
