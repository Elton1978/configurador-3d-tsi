import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

class ModelLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader()
    this.stlLoader = new STLLoader()
    this.objLoader = new OBJLoader()
    this.loadingManager = new THREE.LoadingManager()
    this.cache = new Map()
    
    // Configurar callbacks do loading manager
    this.loadingManager.onLoad = () => {
      console.log('Todos os modelos carregados')
    }
    
    this.loadingManager.onProgress = (url, loaded, total) => {
      console.log(`Carregando: ${url} (${loaded}/${total})`)
    }
    
    this.loadingManager.onError = (url) => {
      console.error(`Erro ao carregar: ${url}`)
    }
  }

  /**
   * Carrega um modelo 3D baseado na extensão do arquivo
   * @param {string} url - URL do modelo
   * @param {Object} options - Opções de carregamento
   * @returns {Promise<THREE.Object3D>}
   */
  async loadModel(url, options = {}) {
    // Verificar cache
    if (this.cache.has(url)) {
      return this.cache.get(url).clone()
    }

    const extension = url.split('.').pop().toLowerCase()
    let loader
    
    switch (extension) {
      case 'gltf':
      case 'glb':
        loader = this.gltfLoader
        break
      case 'stl':
        loader = this.stlLoader
        break
      case 'obj':
        loader = this.objLoader
        break
      default:
        throw new Error(`Formato não suportado: ${extension}`)
    }

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (result) => {
          let model
          
          if (extension === 'gltf' || extension === 'glb') {
            model = result.scene
            // Aplicar animações se existirem
            if (result.animations && result.animations.length > 0) {
              model.userData.animations = result.animations
            }
          } else if (extension === 'stl') {
            // STL retorna apenas geometria
            const geometry = result
            const material = new THREE.MeshStandardMaterial({
              color: options.color || 0x606060,
              metalness: 0.3,
              roughness: 0.4
            })
            model = new THREE.Mesh(geometry, material)
          } else if (extension === 'obj') {
            model = result
            // Aplicar material padrão se não tiver
            model.traverse((child) => {
              if (child.isMesh && !child.material) {
                child.material = new THREE.MeshStandardMaterial({
                  color: options.color || 0x606060,
                  metalness: 0.3,
                  roughness: 0.4
                })
              }
            })
          }

          // Aplicar transformações
          if (options.scale) {
            model.scale.setScalar(options.scale)
          }
          
          if (options.position) {
            model.position.copy(options.position)
          }
          
          if (options.rotation) {
            model.rotation.copy(options.rotation)
          }

          // Calcular bounding box
          const box = new THREE.Box3().setFromObject(model)
          model.userData.boundingBox = box
          model.userData.size = box.getSize(new THREE.Vector3())
          model.userData.center = box.getCenter(new THREE.Vector3())

          // Adicionar sombras
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })

          // Armazenar no cache
          this.cache.set(url, model)
          
          resolve(model.clone())
        },
        (progress) => {
          if (options.onProgress) {
            options.onProgress(progress)
          }
        },
        (error) => {
          console.error(`Erro ao carregar modelo ${url}:`, error)
          reject(error)
        }
      )
    })
  }

  /**
   * Carrega múltiplos modelos em paralelo
   * @param {Array} urls - Array de URLs dos modelos
   * @param {Object} options - Opções de carregamento
   * @returns {Promise<Array<THREE.Object3D>>}
   */
  async loadModels(urls, options = {}) {
    const promises = urls.map(url => this.loadModel(url, options))
    return Promise.all(promises)
  }

  /**
   * Cria um modelo primitivo (cubo, esfera, cilindro)
   * @param {string} type - Tipo de primitiva
   * @param {Object} params - Parâmetros da geometria
   * @param {Object} materialOptions - Opções do material
   * @returns {THREE.Mesh}
   */
  createPrimitive(type, params = {}, materialOptions = {}) {
    let geometry
    
    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          params.width || 1,
          params.height || 1,
          params.depth || 1
        )
        break
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          params.radius || 0.5,
          params.widthSegments || 32,
          params.heightSegments || 16
        )
        break
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          params.radiusTop || 0.5,
          params.radiusBottom || 0.5,
          params.height || 1,
          params.radialSegments || 32
        )
        break
      case 'plane':
        geometry = new THREE.PlaneGeometry(
          params.width || 1,
          params.height || 1
        )
        break
      default:
        throw new Error(`Tipo de primitiva não suportado: ${type}`)
    }

    const material = new THREE.MeshStandardMaterial({
      color: materialOptions.color || 0x606060,
      metalness: materialOptions.metalness || 0.3,
      roughness: materialOptions.roughness || 0.4,
      transparent: materialOptions.transparent || false,
      opacity: materialOptions.opacity || 1.0,
      wireframe: materialOptions.wireframe || false
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    return mesh
  }

  /**
   * Converte unidades do modelo (mm para metros, etc.)
   * @param {THREE.Object3D} model - Modelo a ser convertido
   * @param {string} fromUnit - Unidade original
   * @param {string} toUnit - Unidade de destino
   */
  convertUnits(model, fromUnit, toUnit) {
    const conversions = {
      'mm': 0.001,
      'cm': 0.01,
      'm': 1.0,
      'in': 0.0254,
      'ft': 0.3048
    }

    const fromScale = conversions[fromUnit]
    const toScale = conversions[toUnit]
    
    if (!fromScale || !toScale) {
      throw new Error(`Unidade não suportada: ${fromUnit} ou ${toUnit}`)
    }

    const scaleFactor = fromScale / toScale
    model.scale.multiplyScalar(scaleFactor)
  }

  /**
   * Otimiza um modelo para performance
   * @param {THREE.Object3D} model - Modelo a ser otimizado
   * @param {Object} options - Opções de otimização
   */
  optimizeModel(model, options = {}) {
    model.traverse((child) => {
      if (child.isMesh) {
        // Simplificar geometria se necessário
        if (options.simplify && child.geometry.attributes.position.count > 10000) {
          // Implementar simplificação de geometria aqui
          console.log(`Geometria complexa detectada: ${child.geometry.attributes.position.count} vértices`)
        }

        // Otimizar materiais
        if (child.material) {
          child.material.needsUpdate = false
        }

        // Configurar frustum culling
        child.frustumCulled = true
      }
    })

    // Computar bounding sphere para otimização de culling
    model.geometry?.computeBoundingSphere?.()
  }

  /**
   * Limpa o cache de modelos
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Remove um modelo específico do cache
   * @param {string} url - URL do modelo a ser removido
   */
  removeFromCache(url) {
    this.cache.delete(url)
  }
}

// Instância singleton
const modelLoader = new ModelLoader()

export default modelLoader
