/**
 * Sistema de Otimizações de Performance
 * Implementa lazy loading, memoization, debouncing e outras otimizações
 */

import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react'

class PerformanceOptimizer {
  constructor() {
    this.memoCache = new Map()
    this.debounceTimers = new Map()
    this.throttleTimers = new Map()
    this.intersectionObserver = null
    this.performanceMetrics = {
      renderTimes: [],
      apiCalls: [],
      memoryUsage: [],
      cacheHits: 0,
      cacheMisses: 0
    }
    
    this.initializeObservers()
  }

  /**
   * Inicializar observadores de performance
   */
  initializeObservers() {
    // Intersection Observer para lazy loading
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target
              const callback = element._lazyCallback
              if (callback) {
                callback()
                this.intersectionObserver.unobserve(element)
                delete element._lazyCallback
              }
            }
          })
        },
        { threshold: 0.1, rootMargin: '50px' }
      )
    }

    // Performance Observer para métricas
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            this.recordMetric(entry.entryType, entry)
          })
        })
        
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
      } catch (e) {
        console.warn('Performance Observer not supported:', e)
      }
    }
  }

  /**
   * Memoização avançada com TTL
   * @param {Function} fn - Função a ser memoizada
   * @param {Object} options - Opções de memoização
   * @returns {Function} - Função memoizada
   */
  memoize(fn, options = {}) {
    const {
      ttl = 300000, // 5 minutos
      maxSize = 100,
      keyGenerator = (...args) => JSON.stringify(args)
    } = options

    const cache = new Map()
    const timestamps = new Map()

    return (...args) => {
      const key = keyGenerator(...args)
      const now = Date.now()

      // Verificar se existe no cache e não expirou
      if (cache.has(key)) {
        const timestamp = timestamps.get(key)
        if (now - timestamp < ttl) {
          this.performanceMetrics.cacheHits++
          return cache.get(key)
        } else {
          // Expirado, remover
          cache.delete(key)
          timestamps.delete(key)
        }
      }

      // Cache miss, calcular resultado
      this.performanceMetrics.cacheMisses++
      const result = fn(...args)

      // Limpar cache se muito grande
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value
        cache.delete(oldestKey)
        timestamps.delete(oldestKey)
      }

      // Armazenar no cache
      cache.set(key, result)
      timestamps.set(key, now)

      return result
    }
  }

  /**
   * Debounce com cancelamento
   * @param {Function} fn - Função a ser debounced
   * @param {number} delay - Delay em ms
   * @param {string} key - Chave única para o timer
   * @returns {Function} - Função debounced
   */
  debounce(fn, delay, key = 'default') {
    return (...args) => {
      // Cancelar timer anterior
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key))
      }

      // Criar novo timer
      const timer = setTimeout(() => {
        fn(...args)
        this.debounceTimers.delete(key)
      }, delay)

      this.debounceTimers.set(key, timer)
    }
  }

  /**
   * Throttle com controle de execução
   * @param {Function} fn - Função a ser throttled
   * @param {number} limit - Limite em ms
   * @param {string} key - Chave única
   * @returns {Function} - Função throttled
   */
  throttle(fn, limit, key = 'default') {
    let inThrottle = false

    return (...args) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        
        const timer = setTimeout(() => {
          inThrottle = false
          this.throttleTimers.delete(key)
        }, limit)

        this.throttleTimers.set(key, timer)
      }
    }
  }

  /**
   * Lazy loading de componentes
   * @param {Function} importFn - Função de import dinâmico
   * @param {Object} options - Opções de lazy loading
   * @returns {Object} - Componente lazy
   */
  lazyComponent(importFn, options = {}) {
    const {
      fallback = null,
      retryCount = 3,
      retryDelay = 1000
    } = options

    let retries = 0

    const loadComponent = async () => {
      try {
        const module = await importFn()
        return module
      } catch (error) {
        if (retries < retryCount) {
          retries++
          await new Promise(resolve => setTimeout(resolve, retryDelay * retries))
          return loadComponent()
        }
        throw error
      }
    }

    return {
      component: React.lazy(loadComponent),
      fallback
    }
  }

  /**
   * Lazy loading de elementos DOM
   * @param {HTMLElement} element - Elemento a ser observado
   * @param {Function} callback - Callback quando visível
   */
  lazyLoad(element, callback) {
    if (!this.intersectionObserver) {
      // Fallback se não suportar Intersection Observer
      callback()
      return
    }

    element._lazyCallback = callback
    this.intersectionObserver.observe(element)
  }

  /**
   * Otimização de imagens com lazy loading
   * @param {string} src - URL da imagem
   * @param {Object} options - Opções de otimização
   * @returns {Object} - Configuração da imagem
   */
  optimizeImage(src, options = {}) {
    const {
      placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
      quality = 80,
      format = 'webp',
      sizes = '(max-width: 768px) 100vw, 50vw'
    } = options

    // Gerar URLs otimizadas para diferentes tamanhos
    const generateSrcSet = (baseSrc) => {
      const widths = [320, 640, 768, 1024, 1280, 1920]
      return widths.map(width => 
        `${baseSrc}?w=${width}&q=${quality}&f=${format} ${width}w`
      ).join(', ')
    }

    return {
      src: `${src}?q=${quality}&f=${format}`,
      srcSet: generateSrcSet(src),
      sizes,
      placeholder,
      loading: 'lazy',
      decoding: 'async'
    }
  }

  /**
   * Chunking de dados grandes
   * @param {Array} data - Dados a serem processados
   * @param {number} chunkSize - Tamanho do chunk
   * @param {Function} processor - Função de processamento
   * @returns {Promise} - Promise com resultados
   */
  async processInChunks(data, chunkSize = 100, processor) {
    const results = []
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      
      // Processar chunk
      const chunkResults = await processor(chunk)
      results.push(...chunkResults)
      
      // Yield para não bloquear UI
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    return results
  }

  /**
   * Virtualização de listas grandes
   * @param {Array} items - Lista de itens
   * @param {Object} options - Opções de virtualização
   * @returns {Object} - Configuração da lista virtual
   */
  virtualizeList(items, options = {}) {
    const {
      itemHeight = 50,
      containerHeight = 400,
      overscan = 5
    } = options

    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const totalHeight = items.length * itemHeight

    return {
      totalHeight,
      visibleCount,
      overscan,
      getVisibleItems: (scrollTop) => {
        const startIndex = Math.floor(scrollTop / itemHeight)
        const endIndex = Math.min(
          startIndex + visibleCount + overscan,
          items.length
        )
        
        return {
          startIndex: Math.max(0, startIndex - overscan),
          endIndex,
          items: items.slice(
            Math.max(0, startIndex - overscan),
            endIndex
          )
        }
      }
    }
  }

  /**
   * Otimização de re-renders
   * @param {Object} props - Props do componente
   * @param {Array} dependencies - Dependências para comparação
   * @returns {boolean} - Se deve re-renderizar
   */
  shouldUpdate(props, dependencies = []) {
    const key = JSON.stringify({ props, dependencies })
    const cached = this.memoCache.get('shouldUpdate')
    
    if (cached && cached.key === key) {
      return false
    }
    
    this.memoCache.set('shouldUpdate', { key, timestamp: Date.now() })
    return true
  }

  /**
   * Pré-carregamento de recursos
   * @param {Array} resources - Lista de recursos
   * @param {Object} options - Opções de preload
   */
  preloadResources(resources, options = {}) {
    const { priority = 'low', crossOrigin = 'anonymous' } = options

    resources.forEach(resource => {
      const link = document.createElement('link')
      
      if (resource.type === 'image') {
        link.rel = 'preload'
        link.as = 'image'
        link.href = resource.url
      } else if (resource.type === 'script') {
        link.rel = 'preload'
        link.as = 'script'
        link.href = resource.url
      } else if (resource.type === 'style') {
        link.rel = 'preload'
        link.as = 'style'
        link.href = resource.url
      }
      
      link.crossOrigin = crossOrigin
      if (priority) link.fetchPriority = priority
      
      document.head.appendChild(link)
    })
  }

  /**
   * Monitoramento de performance
   * @param {string} name - Nome da métrica
   * @param {Function} fn - Função a ser medida
   * @returns {*} - Resultado da função
   */
  async measurePerformance(name, fn) {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    try {
      const result = await fn()
      
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      this.recordMetric('custom', {
        name,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      this.recordMetric('error', {
        name,
        error: error.message,
        timestamp: Date.now()
      })
      throw error
    }
  }

  /**
   * Obter uso de memória
   * @returns {number} - Uso de memória em MB
   */
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }

  /**
   * Registrar métrica de performance
   * @param {string} type - Tipo da métrica
   * @param {Object} data - Dados da métrica
   */
  recordMetric(type, data) {
    const metric = {
      type,
      timestamp: Date.now(),
      ...data
    }

    switch (type) {
      case 'render':
        this.performanceMetrics.renderTimes.push(metric)
        break
      case 'api':
        this.performanceMetrics.apiCalls.push(metric)
        break
      case 'memory':
        this.performanceMetrics.memoryUsage.push(metric)
        break
      default:
        if (!this.performanceMetrics[type]) {
          this.performanceMetrics[type] = []
        }
        this.performanceMetrics[type].push(metric)
    }

    // Limitar histórico de métricas
    Object.keys(this.performanceMetrics).forEach(key => {
      if (Array.isArray(this.performanceMetrics[key])) {
        if (this.performanceMetrics[key].length > 1000) {
          this.performanceMetrics[key] = this.performanceMetrics[key].slice(-500)
        }
      }
    })
  }

  /**
   * Obter relatório de performance
   * @returns {Object} - Relatório detalhado
   */
  getPerformanceReport() {
    const now = Date.now()
    const oneHourAgo = now - 3600000

    const recentMetrics = {}
    Object.keys(this.performanceMetrics).forEach(key => {
      if (Array.isArray(this.performanceMetrics[key])) {
        recentMetrics[key] = this.performanceMetrics[key]
          .filter(metric => metric.timestamp > oneHourAgo)
      } else {
        recentMetrics[key] = this.performanceMetrics[key]
      }
    })

    return {
      summary: {
        cacheHitRate: this.performanceMetrics.cacheHits / 
          (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100,
        averageRenderTime: this.calculateAverage(recentMetrics.renderTimes, 'duration'),
        averageApiTime: this.calculateAverage(recentMetrics.apiCalls, 'duration'),
        currentMemoryUsage: this.getMemoryUsage(),
        totalMetrics: Object.values(recentMetrics).reduce((sum, arr) => 
          sum + (Array.isArray(arr) ? arr.length : 0), 0
        )
      },
      details: recentMetrics,
      recommendations: this.generateRecommendations(recentMetrics)
    }
  }

  /**
   * Calcular média de uma métrica
   * @param {Array} metrics - Array de métricas
   * @param {string} field - Campo a calcular média
   * @returns {number} - Média
   */
  calculateAverage(metrics, field) {
    if (!metrics || metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0)
    return sum / metrics.length
  }

  /**
   * Gerar recomendações de otimização
   * @param {Object} metrics - Métricas recentes
   * @returns {Array} - Lista de recomendações
   */
  generateRecommendations(metrics) {
    const recommendations = []

    // Verificar cache hit rate
    const hitRate = this.performanceMetrics.cacheHits / 
      (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100

    if (hitRate < 70) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        message: 'Cache hit rate baixo. Considere aumentar TTL ou melhorar estratégia de cache.'
      })
    }

    // Verificar tempo de render
    const avgRenderTime = this.calculateAverage(metrics.renderTimes, 'duration')
    if (avgRenderTime > 16) { // 60 FPS = 16ms por frame
      recommendations.push({
        type: 'render',
        priority: 'medium',
        message: 'Tempo de render alto. Considere usar React.memo ou otimizar componentes.'
      })
    }

    // Verificar uso de memória
    const currentMemory = this.getMemoryUsage()
    if (currentMemory > 100) { // 100MB
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Alto uso de memória. Verifique vazamentos e otimize estruturas de dados.'
      })
    }

    return recommendations
  }

  /**
   * Limpar caches e timers
   */
  cleanup() {
    this.memoCache.clear()
    
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    
    this.throttleTimers.forEach(timer => clearTimeout(timer))
    this.throttleTimers.clear()
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
  }
}

// Instância singleton
const performanceOptimizer = new PerformanceOptimizer()

// Hooks React para otimização
export const useOptimizedCallback = (callback, deps) => {
  return useCallback(
    performanceOptimizer.memoize(callback, { ttl: 60000 }),
    deps
  )
}

export const useOptimizedMemo = (factory, deps) => {
  return useMemo(
    performanceOptimizer.memoize(factory, { ttl: 60000 }),
    deps
  )
}

export const useDebounce = (callback, delay, deps = []) => {
  const debouncedCallback = useCallback(
    performanceOptimizer.debounce(callback, delay, 'hook'),
    deps
  )
  
  return debouncedCallback
}

export const useThrottle = (callback, limit, deps = []) => {
  const throttledCallback = useCallback(
    performanceOptimizer.throttle(callback, limit, 'hook'),
    deps
  )
  
  return throttledCallback
}

export const useLazyLoad = (callback, deps = []) => {
  const elementRef = useRef(null)
  
  useEffect(() => {
    const element = elementRef.current
    if (element) {
      performanceOptimizer.lazyLoad(element, callback)
    }
  }, deps)
  
  return elementRef
}

export const usePerformanceMonitor = (name) => {
  const [metrics, setMetrics] = useState(null)
  
  const measure = useCallback(async (fn) => {
    const result = await performanceOptimizer.measurePerformance(name, fn)
    setMetrics(performanceOptimizer.getPerformanceReport())
    return result
  }, [name])
  
  return { measure, metrics }
}

// HOC para otimização automática
export const withPerformanceOptimization = (Component, options = {}) => {
  const OptimizedComponent = memo(Component, (prevProps, nextProps) => {
    return !performanceOptimizer.shouldUpdate(nextProps, options.dependencies)
  })
  
  OptimizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`
  
  return OptimizedComponent
}

export default performanceOptimizer

// Funções de conveniência
export const memoize = (fn, options) => performanceOptimizer.memoize(fn, options)
export const debounce = (fn, delay, key) => performanceOptimizer.debounce(fn, delay, key)
export const throttle = (fn, limit, key) => performanceOptimizer.throttle(fn, limit, key)
export const measurePerformance = (name, fn) => performanceOptimizer.measurePerformance(name, fn)
export const getPerformanceReport = () => performanceOptimizer.getPerformanceReport()
export const preloadResources = (resources, options) => performanceOptimizer.preloadResources(resources, options)
