import * as THREE from 'three'

/**
 * Sistema de snapping automático para conectores
 */
class SnappingSystem {
  constructor() {
    this.snapDistance = 2.0 // Distância máxima para snapping (metros)
    this.snapTolerance = 0.1 // Tolerância para considerar alinhado
    this.gridSize = 1.0 // Tamanho da grade para snapping
    this.enableGridSnap = true
    this.enableConnectorSnap = true
    this.enableEdgeSnap = true
    
    // Materiais para visualização
    this.snapPointMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.8 
    })
    this.snapLineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff00, 
      linewidth: 2 
    })
  }

  /**
   * Encontra o ponto de snap mais próximo para um objeto
   * @param {THREE.Object3D} object - Objeto sendo movido
   * @param {THREE.Vector3} targetPosition - Posição desejada
   * @param {Array<THREE.Object3D>} otherObjects - Outros objetos na cena
   * @param {Object} options - Opções de snapping
   * @returns {Object} - Resultado do snapping
   */
  findSnapPoint(object, targetPosition, otherObjects, options = {}) {
    const snapResults = []
    
    // 1. Grid Snapping
    if (this.enableGridSnap && options.enableGrid !== false) {
      const gridSnap = this.snapToGrid(targetPosition)
      if (gridSnap.distance < this.snapDistance) {
        snapResults.push({
          type: 'grid',
          position: gridSnap.position,
          distance: gridSnap.distance,
          priority: 1
        })
      }
    }
    
    // 2. Connector Snapping
    if (this.enableConnectorSnap && options.enableConnectors !== false) {
      const connectorSnaps = this.snapToConnectors(object, targetPosition, otherObjects)
      snapResults.push(...connectorSnaps)
    }
    
    // 3. Edge/Surface Snapping
    if (this.enableEdgeSnap && options.enableEdges !== false) {
      const edgeSnaps = this.snapToEdges(object, targetPosition, otherObjects)
      snapResults.push(...edgeSnaps)
    }
    
    // 4. Alignment Snapping (alinhar com outros objetos)
    const alignmentSnaps = this.snapToAlignment(object, targetPosition, otherObjects)
    snapResults.push(...alignmentSnaps)
    
    // Encontrar o melhor snap point
    if (snapResults.length === 0) {
      return {
        hasSnap: false,
        position: targetPosition,
        originalPosition: targetPosition
      }
    }
    
    // Ordenar por prioridade e distância
    snapResults.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // Maior prioridade primeiro
      }
      return a.distance - b.distance // Menor distância primeiro
    })
    
    const bestSnap = snapResults[0]
    
    return {
      hasSnap: true,
      position: bestSnap.position,
      originalPosition: targetPosition,
      snapType: bestSnap.type,
      distance: bestSnap.distance,
      target: bestSnap.target,
      connector: bestSnap.connector
    }
  }

  /**
   * Snap para grade
   * @param {THREE.Vector3} position - Posição atual
   * @returns {Object} - Resultado do snap para grade
   */
  snapToGrid(position) {
    const snappedX = Math.round(position.x / this.gridSize) * this.gridSize
    const snappedZ = Math.round(position.z / this.gridSize) * this.gridSize
    const snappedPosition = new THREE.Vector3(snappedX, position.y, snappedZ)
    
    return {
      position: snappedPosition,
      distance: position.distanceTo(snappedPosition)
    }
  }

  /**
   * Snap para conectores de outros objetos
   * @param {THREE.Object3D} object - Objeto sendo movido
   * @param {THREE.Vector3} targetPosition - Posição desejada
   * @param {Array<THREE.Object3D>} otherObjects - Outros objetos
   * @returns {Array} - Pontos de snap encontrados
   */
  snapToConnectors(object, targetPosition, otherObjects) {
    const snapPoints = []
    const objectConnectors = this.getObjectConnectors(object)
    
    otherObjects.forEach(otherObject => {
      if (otherObject === object) return
      
      const otherConnectors = this.getObjectConnectors(otherObject)
      
      // Verificar cada conector do objeto com cada conector dos outros objetos
      objectConnectors.forEach(objConnector => {
        otherConnectors.forEach(otherConnector => {
          // Verificar compatibilidade de tipos
          if (this.areConnectorsCompatible(objConnector, otherConnector)) {
            // Calcular posição onde o objeto deveria estar para conectar
            const snapPosition = this.calculateConnectorSnapPosition(
              object, objConnector, otherObject, otherConnector, targetPosition
            )
            
            if (snapPosition) {
              const distance = targetPosition.distanceTo(snapPosition)
              
              if (distance < this.snapDistance) {
                snapPoints.push({
                  type: 'connector',
                  position: snapPosition,
                  distance,
                  priority: 5, // Alta prioridade para conectores
                  target: otherObject,
                  connector: {
                    source: objConnector,
                    target: otherConnector
                  }
                })
              }
            }
          }
        })
      })
    })
    
    return snapPoints
  }

  /**
   * Snap para bordas e superfícies
   * @param {THREE.Object3D} object - Objeto sendo movido
   * @param {THREE.Vector3} targetPosition - Posição desejada
   * @param {Array<THREE.Object3D>} otherObjects - Outros objetos
   * @returns {Array} - Pontos de snap encontrados
   */
  snapToEdges(object, targetPosition, otherObjects) {
    const snapPoints = []
    const objectBox = new THREE.Box3().setFromObject(object)
    const objectSize = objectBox.getSize(new THREE.Vector3())
    
    otherObjects.forEach(otherObject => {
      if (otherObject === object) return
      
      const otherBox = new THREE.Box3().setFromObject(otherObject)
      const otherSize = otherBox.getSize(new THREE.Vector3())
      const otherCenter = otherBox.getCenter(new THREE.Vector3())
      
      // Snap para faces adjacentes
      const faces = [
        // Face direita do outro objeto
        {
          position: new THREE.Vector3(
            otherCenter.x + otherSize.x / 2 + objectSize.x / 2 + this.snapTolerance,
            targetPosition.y,
            otherCenter.z
          ),
          type: 'edge-right'
        },
        // Face esquerda do outro objeto
        {
          position: new THREE.Vector3(
            otherCenter.x - otherSize.x / 2 - objectSize.x / 2 - this.snapTolerance,
            targetPosition.y,
            otherCenter.z
          ),
          type: 'edge-left'
        },
        // Face frontal do outro objeto
        {
          position: new THREE.Vector3(
            otherCenter.x,
            targetPosition.y,
            otherCenter.z + otherSize.z / 2 + objectSize.z / 2 + this.snapTolerance
          ),
          type: 'edge-front'
        },
        // Face traseira do outro objeto
        {
          position: new THREE.Vector3(
            otherCenter.x,
            targetPosition.y,
            otherCenter.z - otherSize.z / 2 - objectSize.z / 2 - this.snapTolerance
          ),
          type: 'edge-back'
        }
      ]
      
      faces.forEach(face => {
        const distance = targetPosition.distanceTo(face.position)
        if (distance < this.snapDistance) {
          snapPoints.push({
            type: face.type,
            position: face.position,
            distance,
            priority: 3,
            target: otherObject
          })
        }
      })
    })
    
    return snapPoints
  }

  /**
   * Snap para alinhamento com outros objetos
   * @param {THREE.Object3D} object - Objeto sendo movido
   * @param {THREE.Vector3} targetPosition - Posição desejada
   * @param {Array<THREE.Object3D>} otherObjects - Outros objetos
   * @returns {Array} - Pontos de snap encontrados
   */
  snapToAlignment(object, targetPosition, otherObjects) {
    const snapPoints = []
    
    otherObjects.forEach(otherObject => {
      if (otherObject === object) return
      
      const otherPosition = otherObject.position
      
      // Alinhamento no eixo X
      if (Math.abs(targetPosition.x - otherPosition.x) < this.snapTolerance) {
        snapPoints.push({
          type: 'align-x',
          position: new THREE.Vector3(otherPosition.x, targetPosition.y, targetPosition.z),
          distance: Math.abs(targetPosition.x - otherPosition.x),
          priority: 2,
          target: otherObject
        })
      }
      
      // Alinhamento no eixo Z
      if (Math.abs(targetPosition.z - otherPosition.z) < this.snapTolerance) {
        snapPoints.push({
          type: 'align-z',
          position: new THREE.Vector3(targetPosition.x, targetPosition.y, otherPosition.z),
          distance: Math.abs(targetPosition.z - otherPosition.z),
          priority: 2,
          target: otherObject
        })
      }
    })
    
    return snapPoints
  }

  /**
   * Obtém os conectores de um objeto
   * @param {THREE.Object3D} object - Objeto
   * @returns {Array} - Lista de conectores
   */
  getObjectConnectors(object) {
    // Verificar se o objeto tem dados de conectores
    if (object.userData && object.userData.connectors) {
      return object.userData.connectors.map(connector => ({
        ...connector,
        worldPosition: this.getConnectorWorldPosition(object, connector)
      }))
    }
    
    // Se não tem conectores definidos, criar conectores padrão baseados na geometria
    return this.generateDefaultConnectors(object)
  }

  /**
   * Gera conectores padrão baseados na geometria do objeto
   * @param {THREE.Object3D} object - Objeto
   * @returns {Array} - Conectores padrão
   */
  generateDefaultConnectors(object) {
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    return [
      // Conectores nas faces
      {
        id: 'front',
        type: 'generic',
        position: new THREE.Vector3(0, 0, size.z / 2),
        direction: new THREE.Vector3(0, 0, 1),
        worldPosition: new THREE.Vector3(center.x, center.y, center.z + size.z / 2)
      },
      {
        id: 'back',
        type: 'generic',
        position: new THREE.Vector3(0, 0, -size.z / 2),
        direction: new THREE.Vector3(0, 0, -1),
        worldPosition: new THREE.Vector3(center.x, center.y, center.z - size.z / 2)
      },
      {
        id: 'right',
        type: 'generic',
        position: new THREE.Vector3(size.x / 2, 0, 0),
        direction: new THREE.Vector3(1, 0, 0),
        worldPosition: new THREE.Vector3(center.x + size.x / 2, center.y, center.z)
      },
      {
        id: 'left',
        type: 'generic',
        position: new THREE.Vector3(-size.x / 2, 0, 0),
        direction: new THREE.Vector3(-1, 0, 0),
        worldPosition: new THREE.Vector3(center.x - size.x / 2, center.y, center.z)
      }
    ]
  }

  /**
   * Calcula a posição mundial de um conector
   * @param {THREE.Object3D} object - Objeto
   * @param {Object} connector - Dados do conector
   * @returns {THREE.Vector3} - Posição mundial
   */
  getConnectorWorldPosition(object, connector) {
    const localPosition = new THREE.Vector3().copy(connector.position)
    const worldPosition = localPosition.applyMatrix4(object.matrixWorld)
    return worldPosition
  }

  /**
   * Verifica se dois conectores são compatíveis
   * @param {Object} connectorA - Primeiro conector
   * @param {Object} connectorB - Segundo conector
   * @returns {boolean} - True se são compatíveis
   */
  areConnectorsCompatible(connectorA, connectorB) {
    // Regras de compatibilidade
    const compatibilityRules = {
      'electric': ['electric'],
      'hydraulic': ['hydraulic'],
      'pneumatic': ['pneumatic'],
      'mechanical': ['mechanical'],
      'generic': ['generic', 'electric', 'hydraulic', 'pneumatic', 'mechanical']
    }
    
    const typeA = connectorA.type || 'generic'
    const typeB = connectorB.type || 'generic'
    
    return compatibilityRules[typeA]?.includes(typeB) || 
           compatibilityRules[typeB]?.includes(typeA)
  }

  /**
   * Calcula a posição onde um objeto deve estar para conectar dois conectores
   * @param {THREE.Object3D} objectA - Objeto sendo movido
   * @param {Object} connectorA - Conector do objeto A
   * @param {THREE.Object3D} objectB - Objeto fixo
   * @param {Object} connectorB - Conector do objeto B
   * @param {THREE.Vector3} currentPosition - Posição atual do objeto A
   * @returns {THREE.Vector3} - Nova posição para o objeto A
   */
  calculateConnectorSnapPosition(objectA, connectorA, objectB, connectorB, currentPosition) {
    // Posição mundial do conector B
    const connectorBWorld = this.getConnectorWorldPosition(objectB, connectorB)
    
    // Offset do conector A em relação ao centro do objeto A
    const connectorAOffset = new THREE.Vector3().copy(connectorA.position)
    
    // Calcular nova posição do objeto A
    const newPosition = new THREE.Vector3()
      .copy(connectorBWorld)
      .sub(connectorAOffset)
    
    return newPosition
  }

  /**
   * Cria visualizadores para pontos de snap ativos
   * @param {Object} snapResult - Resultado do snapping
   * @returns {Array<THREE.Object3D>} - Objetos de visualização
   */
  createSnapVisualizers(snapResult) {
    const visualizers = []
    
    if (!snapResult.hasSnap) return visualizers
    
    // Criar esfera no ponto de snap
    const snapPointGeometry = new THREE.SphereGeometry(0.2, 8, 6)
    const snapPoint = new THREE.Mesh(snapPointGeometry, this.snapPointMaterial)
    snapPoint.position.copy(snapResult.position)
    visualizers.push(snapPoint)
    
    // Criar linha da posição original para o ponto de snap
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      snapResult.originalPosition,
      snapResult.position
    ])
    const snapLine = new THREE.Line(lineGeometry, this.snapLineMaterial)
    visualizers.push(snapLine)
    
    return visualizers
  }

  /**
   * Configura as opções de snapping
   * @param {Object} options - Novas opções
   */
  setOptions(options) {
    if (options.snapDistance !== undefined) this.snapDistance = options.snapDistance
    if (options.snapTolerance !== undefined) this.snapTolerance = options.snapTolerance
    if (options.gridSize !== undefined) this.gridSize = options.gridSize
    if (options.enableGridSnap !== undefined) this.enableGridSnap = options.enableGridSnap
    if (options.enableConnectorSnap !== undefined) this.enableConnectorSnap = options.enableConnectorSnap
    if (options.enableEdgeSnap !== undefined) this.enableEdgeSnap = options.enableEdgeSnap
  }
}

// Instância singleton
const snappingSystem = new SnappingSystem()

export default snappingSystem
