import * as THREE from 'three'

/**
 * Sistema de detecção de colisões usando AABB (Axis-Aligned Bounding Box)
 */
class CollisionDetection {
  constructor() {
    this.collisionPairs = new Set()
    this.clearanceDistance = 1.5 // Distância mínima entre equipamentos (metros)
  }

  /**
   * Verifica colisão entre dois objetos usando AABB
   * @param {THREE.Object3D} objectA - Primeiro objeto
   * @param {THREE.Object3D} objectB - Segundo objeto
   * @returns {boolean} - True se há colisão
   */
  checkAABBCollision(objectA, objectB) {
    const boxA = new THREE.Box3().setFromObject(objectA)
    const boxB = new THREE.Box3().setFromObject(objectB)
    
    return boxA.intersectsBox(boxB)
  }

  /**
   * Verifica colisão com clearance (distância mínima)
   * @param {THREE.Object3D} objectA - Primeiro objeto
   * @param {THREE.Object3D} objectB - Segundo objeto
   * @param {number} clearance - Distância mínima (padrão: 1.5m)
   * @returns {Object} - Resultado da verificação
   */
  checkClearanceCollision(objectA, objectB, clearance = this.clearanceDistance) {
    const boxA = new THREE.Box3().setFromObject(objectA)
    const boxB = new THREE.Box3().setFromObject(objectB)
    
    // Expandir as bounding boxes com o clearance
    const expandedBoxA = boxA.clone().expandByScalar(clearance / 2)
    const expandedBoxB = boxB.clone().expandByScalar(clearance / 2)
    
    const hasCollision = expandedBoxA.intersectsBox(expandedBoxB)
    
    if (hasCollision) {
      // Calcular distância real entre os objetos
      const centerA = boxA.getCenter(new THREE.Vector3())
      const centerB = boxB.getCenter(new THREE.Vector3())
      const distance = centerA.distanceTo(centerB)
      
      // Calcular sobreposição
      const sizeA = boxA.getSize(new THREE.Vector3())
      const sizeB = boxB.getSize(new THREE.Vector3())
      const minDistance = (Math.max(sizeA.x, sizeA.z) + Math.max(sizeB.x, sizeB.z)) / 2 + clearance
      
      return {
        hasCollision: true,
        distance,
        minDistance,
        overlap: minDistance - distance,
        severity: distance < clearance ? 'critical' : 'warning'
      }
    }
    
    return { hasCollision: false }
  }

  /**
   * Verifica colisões de um objeto com uma lista de outros objetos
   * @param {THREE.Object3D} targetObject - Objeto a ser verificado
   * @param {Array<THREE.Object3D>} objects - Lista de objetos para verificar
   * @returns {Array} - Lista de colisões detectadas
   */
  checkCollisionsWithObjects(targetObject, objects) {
    const collisions = []
    
    objects.forEach((object, index) => {
      if (object === targetObject) return
      
      const collision = this.checkClearanceCollision(targetObject, object)
      if (collision.hasCollision) {
        collisions.push({
          object,
          index,
          ...collision
        })
      }
    })
    
    return collisions
  }

  /**
   * Verifica todas as colisões em uma cena
   * @param {Array<THREE.Object3D>} objects - Lista de objetos na cena
   * @returns {Array} - Lista de todas as colisões
   */
  checkAllCollisions(objects) {
    const allCollisions = []
    
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const collision = this.checkClearanceCollision(objects[i], objects[j])
        if (collision.hasCollision) {
          allCollisions.push({
            objectA: objects[i],
            objectB: objects[j],
            indexA: i,
            indexB: j,
            ...collision
          })
        }
      }
    }
    
    return allCollisions
  }

  /**
   * Verifica se um objeto pode ser posicionado em uma localização específica
   * @param {THREE.Object3D} object - Objeto a ser posicionado
   * @param {THREE.Vector3} position - Posição desejada
   * @param {Array<THREE.Object3D>} existingObjects - Objetos já posicionados
   * @returns {Object} - Resultado da verificação
   */
  canPlaceObjectAt(object, position, existingObjects) {
    // Criar uma cópia temporária do objeto na nova posição
    const tempObject = object.clone()
    tempObject.position.copy(position)
    tempObject.updateMatrixWorld(true)
    
    const collisions = this.checkCollisionsWithObjects(tempObject, existingObjects)
    
    return {
      canPlace: collisions.length === 0,
      collisions,
      position: position.clone()
    }
  }

  /**
   * Encontra a posição mais próxima válida para um objeto
   * @param {THREE.Object3D} object - Objeto a ser posicionado
   * @param {THREE.Vector3} desiredPosition - Posição desejada
   * @param {Array<THREE.Object3D>} existingObjects - Objetos já posicionados
   * @param {number} searchRadius - Raio de busca (metros)
   * @returns {Object} - Melhor posição encontrada
   */
  findNearestValidPosition(object, desiredPosition, existingObjects, searchRadius = 10) {
    // Primeiro, verificar se a posição desejada é válida
    const desiredCheck = this.canPlaceObjectAt(object, desiredPosition, existingObjects)
    if (desiredCheck.canPlace) {
      return {
        position: desiredPosition,
        distance: 0,
        found: true
      }
    }

    // Buscar em círculos concêntricos
    const step = 0.5 // Passo de busca em metros
    const maxSteps = Math.floor(searchRadius / step)
    
    for (let radius = step; radius <= searchRadius; radius += step) {
      const angleStep = Math.PI / 8 // 22.5 graus
      const numAngles = Math.floor((2 * Math.PI) / angleStep)
      
      for (let i = 0; i < numAngles; i++) {
        const angle = i * angleStep
        const testPosition = new THREE.Vector3(
          desiredPosition.x + Math.cos(angle) * radius,
          desiredPosition.y,
          desiredPosition.z + Math.sin(angle) * radius
        )
        
        const check = this.canPlaceObjectAt(object, testPosition, existingObjects)
        if (check.canPlace) {
          return {
            position: testPosition,
            distance: radius,
            found: true
          }
        }
      }
    }
    
    return {
      position: desiredPosition,
      distance: searchRadius,
      found: false
    }
  }

  /**
   * Verifica colisões com limites do barracão
   * @param {THREE.Object3D} object - Objeto a ser verificado
   * @param {Object} boundaries - Limites do barracão {width, length, height}
   * @returns {Object} - Resultado da verificação
   */
  checkBoundaryCollision(object, boundaries) {
    const box = new THREE.Box3().setFromObject(object)
    const min = box.min
    const max = box.max
    
    const violations = []
    
    // Verificar limites X (largura)
    if (min.x < -boundaries.width / 2) {
      violations.push({ axis: 'x', side: 'min', value: min.x, limit: -boundaries.width / 2 })
    }
    if (max.x > boundaries.width / 2) {
      violations.push({ axis: 'x', side: 'max', value: max.x, limit: boundaries.width / 2 })
    }
    
    // Verificar limites Z (comprimento)
    if (min.z < -boundaries.length / 2) {
      violations.push({ axis: 'z', side: 'min', value: min.z, limit: -boundaries.length / 2 })
    }
    if (max.z > boundaries.length / 2) {
      violations.push({ axis: 'z', side: 'max', value: max.z, limit: boundaries.length / 2 })
    }
    
    // Verificar limite Y (altura)
    if (max.y > boundaries.height) {
      violations.push({ axis: 'y', side: 'max', value: max.y, limit: boundaries.height })
    }
    if (min.y < 0) {
      violations.push({ axis: 'y', side: 'min', value: min.y, limit: 0 })
    }
    
    return {
      hasViolation: violations.length > 0,
      violations
    }
  }

  /**
   * Cria visualizadores de colisão (wireframes vermelhos)
   * @param {Array} collisions - Lista de colisões
   * @returns {Array<THREE.Object3D>} - Objetos de visualização
   */
  createCollisionVisualizers(collisions) {
    const visualizers = []
    
    collisions.forEach(collision => {
      const { objectA, objectB } = collision
      
      // Criar wireframe para objectA
      const boxA = new THREE.Box3().setFromObject(objectA)
      const helperA = new THREE.Box3Helper(boxA, 0xff0000)
      visualizers.push(helperA)
      
      // Criar wireframe para objectB
      const boxB = new THREE.Box3().setFromObject(objectB)
      const helperB = new THREE.Box3Helper(boxB, 0xff0000)
      visualizers.push(helperB)
      
      // Criar linha conectando os centros
      const centerA = boxA.getCenter(new THREE.Vector3())
      const centerB = boxB.getCenter(new THREE.Vector3())
      
      const geometry = new THREE.BufferGeometry().setFromPoints([centerA, centerB])
      const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
      const line = new THREE.Line(geometry, material)
      visualizers.push(line)
    })
    
    return visualizers
  }

  /**
   * Calcula estatísticas de colisão
   * @param {Array} collisions - Lista de colisões
   * @returns {Object} - Estatísticas
   */
  getCollisionStats(collisions) {
    if (collisions.length === 0) {
      return {
        total: 0,
        critical: 0,
        warnings: 0,
        averageOverlap: 0
      }
    }
    
    const critical = collisions.filter(c => c.severity === 'critical').length
    const warnings = collisions.filter(c => c.severity === 'warning').length
    const totalOverlap = collisions.reduce((sum, c) => sum + (c.overlap || 0), 0)
    
    return {
      total: collisions.length,
      critical,
      warnings,
      averageOverlap: totalOverlap / collisions.length
    }
  }
}

// Instância singleton
const collisionDetection = new CollisionDetection()

export default collisionDetection
