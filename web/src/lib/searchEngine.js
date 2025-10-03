/**
 * Sistema de Busca Avançada
 * Implementa busca inteligente com filtros, ordenação e sugestões
 */

import Fuse from 'fuse.js'

class SearchEngine {
  constructor() {
    this.indexes = new Map()
    this.searchHistory = []
    this.maxHistorySize = 50
    
    // Configurações padrão do Fuse.js
    this.defaultOptions = {
      threshold: 0.3, // Sensibilidade da busca (0 = exato, 1 = qualquer coisa)
      distance: 100,  // Distância máxima para correspondência
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      findAllMatches: true,
      ignoreLocation: true
    }
    
    this.initializeIndexes()
  }

  /**
   * Inicializar índices de busca
   */
  initializeIndexes() {
    // Índice para catálogo de produtos
    this.indexes.set('catalog', {
      fuse: null,
      options: {
        ...this.defaultOptions,
        keys: [
          { name: 'name', weight: 0.4 },
          { name: 'description', weight: 0.3 },
          { name: 'family_name', weight: 0.2 },
          { name: 'specifications.application', weight: 0.1 },
          { name: 'tags', weight: 0.1 }
        ]
      }
    })

    // Índice para projetos
    this.indexes.set('projects', {
      fuse: null,
      options: {
        ...this.defaultOptions,
        keys: [
          { name: 'name', weight: 0.5 },
          { name: 'description', weight: 0.3 },
          { name: 'application', weight: 0.2 },
          { name: 'customer.name', weight: 0.1 }
        ]
      }
    })

    // Índice para propostas
    this.indexes.set('proposals', {
      fuse: null,
      options: {
        ...this.defaultOptions,
        keys: [
          { name: 'number', weight: 0.4 },
          { name: 'project_name', weight: 0.3 },
          { name: 'customer.name', weight: 0.2 },
          { name: 'status', weight: 0.1 }
        ]
      }
    })

    // Índice para documentação/help
    this.indexes.set('help', {
      fuse: null,
      options: {
        ...this.defaultOptions,
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'content', weight: 0.3 },
          { name: 'tags', weight: 0.2 }
        ]
      }
    })
  }

  /**
   * Atualizar dados de um índice
   * @param {string} indexName - Nome do índice
   * @param {Array} data - Dados para indexar
   */
  updateIndex(indexName, data) {
    const indexConfig = this.indexes.get(indexName)
    if (!indexConfig) {
      console.warn(`Índice não encontrado: ${indexName}`)
      return
    }

    // Processar dados para busca
    const processedData = this.preprocessData(data, indexName)
    
    // Criar novo índice Fuse
    indexConfig.fuse = new Fuse(processedData, indexConfig.options)
    
    console.log(`Índice atualizado: ${indexName} (${processedData.length} itens)`)
  }

  /**
   * Pré-processar dados para otimizar busca
   * @param {Array} data - Dados originais
   * @param {string} indexName - Nome do índice
   * @returns {Array} - Dados processados
   */
  preprocessData(data, indexName) {
    return data.map(item => {
      const processed = { ...item }

      // Adicionar campos calculados para busca
      switch (indexName) {
        case 'catalog':
          processed.searchText = [
            item.name,
            item.description,
            item.family_name,
            ...(item.tags || [])
          ].filter(Boolean).join(' ').toLowerCase()
          
          // Extrair especificações para busca
          if (item.specifications) {
            processed.specText = Object.values(item.specifications)
              .filter(val => typeof val === 'string')
              .join(' ')
              .toLowerCase()
          }
          break

        case 'projects':
          processed.searchText = [
            item.name,
            item.description,
            item.application,
            item.customer?.name
          ].filter(Boolean).join(' ').toLowerCase()
          break

        case 'proposals':
          processed.searchText = [
            item.number,
            item.project_name,
            item.customer?.name,
            item.status
          ].filter(Boolean).join(' ').toLowerCase()
          break
      }

      return processed
    })
  }

  /**
   * Realizar busca em um índice específico
   * @param {string} indexName - Nome do índice
   * @param {string} query - Termo de busca
   * @param {Object} options - Opções de busca
   * @returns {Object} - Resultados da busca
   */
  search(indexName, query, options = {}) {
    const indexConfig = this.indexes.get(indexName)
    if (!indexConfig || !indexConfig.fuse) {
      return { results: [], suggestions: [], stats: {} }
    }

    const startTime = performance.now()

    // Limpar e normalizar query
    const cleanQuery = this.normalizeQuery(query)
    if (!cleanQuery || cleanQuery.length < 2) {
      return { results: [], suggestions: [], stats: {} }
    }

    // Adicionar à história de busca
    this.addToHistory(cleanQuery, indexName)

    // Realizar busca
    const fuseResults = indexConfig.fuse.search(cleanQuery)

    // Processar resultados
    const results = this.processSearchResults(fuseResults, options)

    // Gerar sugestões
    const suggestions = this.generateSuggestions(cleanQuery, indexName)

    // Estatísticas
    const stats = {
      query: cleanQuery,
      totalResults: results.length,
      searchTime: Math.round(performance.now() - startTime),
      index: indexName
    }

    return { results, suggestions, stats }
  }

  /**
   * Busca global em todos os índices
   * @param {string} query - Termo de busca
   * @param {Object} options - Opções de busca
   * @returns {Object} - Resultados agrupados por índice
   */
  globalSearch(query, options = {}) {
    const results = {}
    const startTime = performance.now()

    for (const [indexName] of this.indexes) {
      const searchResult = this.search(indexName, query, {
        ...options,
        maxResults: options.maxResults || 10
      })
      
      if (searchResult.results.length > 0) {
        results[indexName] = searchResult
      }
    }

    const stats = {
      query: this.normalizeQuery(query),
      totalIndexes: Object.keys(results).length,
      searchTime: Math.round(performance.now() - startTime)
    }

    return { results, stats }
  }

  /**
   * Busca com filtros avançados
   * @param {string} indexName - Nome do índice
   * @param {Object} searchParams - Parâmetros de busca
   * @returns {Object} - Resultados filtrados
   */
  advancedSearch(indexName, searchParams) {
    const {
      query = '',
      filters = {},
      sortBy = '',
      sortOrder = 'asc',
      page = 1,
      pageSize = 20
    } = searchParams

    // Busca básica
    let searchResult = this.search(indexName, query, { maxResults: 1000 })
    let results = searchResult.results

    // Aplicar filtros
    results = this.applyFilters(results, filters, indexName)

    // Ordenar resultados
    results = this.sortResults(results, sortBy, sortOrder)

    // Paginação
    const totalResults = results.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedResults = results.slice(startIndex, endIndex)

    return {
      results: paginatedResults,
      pagination: {
        page,
        pageSize,
        totalResults,
        totalPages: Math.ceil(totalResults / pageSize)
      },
      stats: {
        ...searchResult.stats,
        filteredResults: totalResults
      }
    }
  }

  /**
   * Aplicar filtros aos resultados
   * @param {Array} results - Resultados da busca
   * @param {Object} filters - Filtros a aplicar
   * @param {string} indexName - Nome do índice
   * @returns {Array} - Resultados filtrados
   */
  applyFilters(results, filters, indexName) {
    let filtered = [...results]

    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return
      }

      filtered = filtered.filter(result => {
        const item = result.item
        
        switch (filterKey) {
          case 'family':
            return Array.isArray(filterValue) 
              ? filterValue.includes(item.family_name)
              : item.family_name === filterValue

          case 'priceRange':
            const price = item.price || 0
            return price >= filterValue.min && price <= filterValue.max

          case 'capacity':
            const capacity = item.specifications?.capacity || 0
            return capacity >= filterValue.min && capacity <= filterValue.max

          case 'power':
            const power = item.specifications?.power || 0
            return power >= filterValue.min && power <= filterValue.max

          case 'status':
            return Array.isArray(filterValue)
              ? filterValue.includes(item.status)
              : item.status === filterValue

          case 'dateRange':
            const itemDate = new Date(item.created_at || item.updated_at)
            const startDate = new Date(filterValue.start)
            const endDate = new Date(filterValue.end)
            return itemDate >= startDate && itemDate <= endDate

          case 'tags':
            if (!item.tags) return false
            return Array.isArray(filterValue)
              ? filterValue.some(tag => item.tags.includes(tag))
              : item.tags.includes(filterValue)

          default:
            // Filtro genérico por propriedade
            const value = this.getNestedProperty(item, filterKey)
            return Array.isArray(filterValue)
              ? filterValue.includes(value)
              : value === filterValue
        }
      })
    })

    return filtered
  }

  /**
   * Ordenar resultados
   * @param {Array} results - Resultados a ordenar
   * @param {string} sortBy - Campo para ordenação
   * @param {string} sortOrder - Ordem (asc/desc)
   * @returns {Array} - Resultados ordenados
   */
  sortResults(results, sortBy, sortOrder = 'asc') {
    if (!sortBy) return results

    return [...results].sort((a, b) => {
      let valueA = this.getSortValue(a, sortBy)
      let valueB = this.getSortValue(b, sortBy)

      // Normalizar valores para comparação
      if (typeof valueA === 'string') valueA = valueA.toLowerCase()
      if (typeof valueB === 'string') valueB = valueB.toLowerCase()

      let comparison = 0
      if (valueA > valueB) comparison = 1
      if (valueA < valueB) comparison = -1

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  /**
   * Obter valor para ordenação
   * @param {Object} result - Resultado da busca
   * @param {string} sortBy - Campo de ordenação
   * @returns {*} - Valor para ordenação
   */
  getSortValue(result, sortBy) {
    const item = result.item

    switch (sortBy) {
      case 'relevance':
        return result.score || 0
      case 'name':
        return item.name || ''
      case 'price':
        return item.price || 0
      case 'created_at':
      case 'updated_at':
        return new Date(item[sortBy] || 0)
      case 'family':
        return item.family_name || ''
      default:
        return this.getNestedProperty(item, sortBy) || ''
    }
  }

  /**
   * Gerar sugestões de busca
   * @param {string} query - Query original
   * @param {string} indexName - Nome do índice
   * @returns {Array} - Sugestões
   */
  generateSuggestions(query, indexName) {
    const suggestions = []

    // Sugestões do histórico
    const historySuggestions = this.searchHistory
      .filter(h => h.query.includes(query.toLowerCase()) && h.query !== query.toLowerCase())
      .slice(0, 3)
      .map(h => ({ text: h.query, type: 'history' }))

    suggestions.push(...historySuggestions)

    // Sugestões baseadas em dados comuns
    const commonSuggestions = this.getCommonSuggestions(query, indexName)
    suggestions.push(...commonSuggestions)

    // Remover duplicatas e limitar
    return suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, 5)
  }

  /**
   * Obter sugestões comuns baseadas no índice
   * @param {string} query - Query
   * @param {string} indexName - Nome do índice
   * @returns {Array} - Sugestões comuns
   */
  getCommonSuggestions(query, indexName) {
    const suggestions = []

    // Sugestões específicas por índice
    const commonTerms = {
      catalog: [
        'dosador', 'misturador', 'elevador', 'transportador',
        'tanque', 'painel', 'filtro', 'sistema',
        'gravimétrico', 'industrial', 'canecas', 'helicoidal'
      ],
      projects: [
        'projeto', 'sistema', 'industrial', 'alimentício',
        'químico', 'farmacêutico', 'mineração'
      ],
      proposals: [
        'proposta', 'orçamento', 'aprovado', 'pendente',
        'rejeitado', 'draft'
      ]
    }

    const terms = commonTerms[indexName] || []
    const matchingTerms = terms.filter(term => 
      term.toLowerCase().includes(query.toLowerCase())
    )

    matchingTerms.forEach(term => {
      suggestions.push({ text: term, type: 'suggestion' })
    })

    return suggestions
  }

  /**
   * Processar resultados da busca
   * @param {Array} fuseResults - Resultados do Fuse.js
   * @param {Object} options - Opções de processamento
   * @returns {Array} - Resultados processados
   */
  processSearchResults(fuseResults, options = {}) {
    const { maxResults = 50, minScore = 0.8 } = options

    return fuseResults
      .filter(result => result.score <= minScore) // Fuse.js usa score invertido (menor = melhor)
      .slice(0, maxResults)
      .map(result => ({
        ...result,
        relevanceScore: Math.round((1 - result.score) * 100), // Converter para percentual
        highlights: this.extractHighlights(result.matches || [])
      }))
  }

  /**
   * Extrair destaques dos matches
   * @param {Array} matches - Matches do Fuse.js
   * @returns {Object} - Destaques organizados
   */
  extractHighlights(matches) {
    const highlights = {}

    matches.forEach(match => {
      const key = match.key
      const indices = match.indices || []
      
      if (indices.length > 0) {
        highlights[key] = indices.map(([start, end]) => ({
          start,
          end,
          text: match.value?.substring(start, end + 1) || ''
        }))
      }
    })

    return highlights
  }

  /**
   * Normalizar query de busca
   * @param {string} query - Query original
   * @returns {string} - Query normalizada
   */
  normalizeQuery(query) {
    if (!query || typeof query !== 'string') return ''

    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/gi, '') // Remover caracteres especiais
      .replace(/\s+/g, ' ') // Normalizar espaços
  }

  /**
   * Adicionar query ao histórico
   * @param {string} query - Query
   * @param {string} indexName - Nome do índice
   */
  addToHistory(query, indexName) {
    const historyItem = {
      query: query.toLowerCase(),
      index: indexName,
      timestamp: Date.now()
    }

    // Remover duplicatas
    this.searchHistory = this.searchHistory.filter(h => 
      h.query !== historyItem.query || h.index !== historyItem.index
    )

    // Adicionar no início
    this.searchHistory.unshift(historyItem)

    // Limitar tamanho do histórico
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize)
    }
  }

  /**
   * Obter histórico de busca
   * @param {number} limit - Limite de resultados
   * @returns {Array} - Histórico
   */
  getSearchHistory(limit = 10) {
    return this.searchHistory.slice(0, limit)
  }

  /**
   * Limpar histórico de busca
   */
  clearHistory() {
    this.searchHistory = []
  }

  /**
   * Obter propriedade aninhada de um objeto
   * @param {Object} obj - Objeto
   * @param {string} path - Caminho da propriedade
   * @returns {*} - Valor da propriedade
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Obter estatísticas dos índices
   * @returns {Object} - Estatísticas
   */
  getIndexStats() {
    const stats = {}

    for (const [indexName, indexConfig] of this.indexes) {
      stats[indexName] = {
        hasData: !!indexConfig.fuse,
        itemCount: indexConfig.fuse?.getIndex().docs?.length || 0,
        lastUpdated: indexConfig.lastUpdated || null
      }
    }

    return {
      indexes: stats,
      historySize: this.searchHistory.length,
      totalIndexes: this.indexes.size
    }
  }

  /**
   * Exportar configuração de busca
   * @returns {Object} - Configuração
   */
  exportConfig() {
    const config = {
      defaultOptions: this.defaultOptions,
      indexes: {}
    }

    for (const [indexName, indexConfig] of this.indexes) {
      config.indexes[indexName] = {
        options: indexConfig.options
      }
    }

    return config
  }

  /**
   * Importar configuração de busca
   * @param {Object} config - Configuração
   */
  importConfig(config) {
    if (config.defaultOptions) {
      this.defaultOptions = { ...config.defaultOptions }
    }

    if (config.indexes) {
      Object.entries(config.indexes).forEach(([indexName, indexConfig]) => {
        if (this.indexes.has(indexName)) {
          this.indexes.get(indexName).options = { ...indexConfig.options }
        }
      })
    }
  }
}

// Instância singleton
const searchEngine = new SearchEngine()

export default searchEngine

// Funções de conveniência
export const searchCatalog = (query, options) => searchEngine.search('catalog', query, options)
export const searchProjects = (query, options) => searchEngine.search('projects', query, options)
export const searchProposals = (query, options) => searchEngine.search('proposals', query, options)
export const globalSearch = (query, options) => searchEngine.globalSearch(query, options)
export const advancedSearch = (indexName, params) => searchEngine.advancedSearch(indexName, params)

// Hooks para React (se necessário)
export const useSearch = (indexName) => {
  return {
    search: (query, options) => searchEngine.search(indexName, query, options),
    updateIndex: (data) => searchEngine.updateIndex(indexName, data),
    getHistory: () => searchEngine.getSearchHistory(),
    clearHistory: () => searchEngine.clearHistory()
  }
}
