/**
 * Engine de Configuração de Produtos TSI
 * Gerencia variantes, opções, regras de negócio e validações
 */
class ConfigurationEngine {
  constructor() {
    this.rules = new Map()
    this.constraints = new Map()
    this.dependencies = new Map()
    this.validators = new Map()
    
    // Cache para otimização
    this.configCache = new Map()
    this.priceCache = new Map()
    
    this.initializeRules()
  }

  /**
   * Inicializa regras de negócio padrão
   */
  initializeRules() {
    // Regras de compatibilidade entre famílias
    this.addRule('family_compatibility', {
      'Dosador Gravimétrico': ['Misturador Industrial', 'Elevador de Canecas'],
      'Misturador Industrial': ['Dosador Gravimétrico', 'Transportador Helicoidal'],
      'Elevador de Canecas': ['Dosador Gravimétrico', 'Tanque de Armazenamento'],
      'Transportador Helicoidal': ['Misturador Industrial', 'Tanque de Armazenamento'],
      'Tanque de Armazenamento': ['Elevador de Canecas', 'Transportador Helicoidal'],
      'Painel de Controle': ['*'], // Compatível com todos
      'Sistema de Tubulação': ['*'],
      'Filtro Industrial': ['Tanque de Armazenamento', 'Sistema de Tubulação']
    })

    // Regras de capacidade
    this.addRule('capacity_matching', {
      minRatio: 0.8, // Capacidade mínima deve ser 80% da máxima
      maxRatio: 1.2, // Capacidade máxima pode ser 120% da mínima
      tolerance: 0.1  // Tolerância de 10%
    })

    // Regras de potência
    this.addRule('power_requirements', {
      'Dosador Gravimétrico': { min: 1, max: 15, unit: 'kW' },
      'Misturador Industrial': { min: 5, max: 50, unit: 'kW' },
      'Elevador de Canecas': { min: 3, max: 25, unit: 'kW' },
      'Transportador Helicoidal': { min: 2, max: 20, unit: 'kW' },
      'Filtro Industrial': { min: 1, max: 10, unit: 'kW' }
    })

    // Regras de dimensões
    this.addRule('dimension_constraints', {
      maxHeight: 12, // Altura máxima do barracão
      minClearance: 1.5, // Clearance mínimo entre equipamentos
      accessWidth: 2.0, // Largura mínima para acesso
      maintenanceSpace: 1.0 // Espaço para manutenção
    })
  }

  /**
   * Adiciona uma regra de configuração
   * @param {string} ruleId - ID da regra
   * @param {Object} ruleData - Dados da regra
   */
  addRule(ruleId, ruleData) {
    this.rules.set(ruleId, ruleData)
  }

  /**
   * Configura um produto com base nas opções selecionadas
   * @param {Object} baseVariant - Variante base
   * @param {Object} options - Opções de configuração
   * @returns {Object} - Configuração resultante
   */
  configureProduct(baseVariant, options = {}) {
    const cacheKey = this.generateCacheKey(baseVariant.id, options)
    
    // Verificar cache
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey)
    }

    // Criar configuração base
    const configuration = {
      id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      baseVariant: { ...baseVariant },
      options: { ...options },
      specifications: {},
      pricing: {},
      validations: [],
      warnings: [],
      errors: []
    }

    try {
      // Aplicar opções de configuração
      this.applyConfigurationOptions(configuration)
      
      // Calcular especificações técnicas
      this.calculateSpecifications(configuration)
      
      // Validar configuração
      this.validateConfiguration(configuration)
      
      // Calcular preços
      this.calculatePricing(configuration)
      
      // Armazenar no cache
      this.configCache.set(cacheKey, configuration)
      
      return configuration
      
    } catch (error) {
      configuration.errors.push({
        type: 'configuration_error',
        message: error.message,
        code: 'CONFIG_ERROR'
      })
      
      return configuration
    }
  }

  /**
   * Aplica opções de configuração à variante base
   * @param {Object} configuration - Configuração sendo processada
   */
  applyConfigurationOptions(configuration) {
    const { baseVariant, options } = configuration
    
    // Aplicar modificações de capacidade
    if (options.capacity) {
      configuration.specifications.capacity = this.calculateCapacity(
        baseVariant.specifications.capacity,
        options.capacity
      )
    }

    // Aplicar modificações de potência
    if (options.power) {
      configuration.specifications.power = this.calculatePower(
        baseVariant.specifications.power,
        options.power
      )
    }

    // Aplicar modificações de dimensões
    if (options.dimensions) {
      configuration.specifications.dimensions = this.calculateDimensions(
        baseVariant.dimensions,
        options.dimensions
      )
    }

    // Aplicar materiais especiais
    if (options.materials) {
      configuration.specifications.materials = this.applyMaterials(
        baseVariant.specifications.materials,
        options.materials
      )
    }

    // Aplicar acessórios
    if (options.accessories) {
      configuration.specifications.accessories = this.applyAccessories(
        baseVariant.specifications.accessories || [],
        options.accessories
      )
    }

    // Aplicar acabamentos
    if (options.finishes) {
      configuration.specifications.finishes = this.applyFinishes(
        baseVariant.specifications.finishes,
        options.finishes
      )
    }
  }

  /**
   * Calcula especificações técnicas da configuração
   * @param {Object} configuration - Configuração
   */
  calculateSpecifications(configuration) {
    const specs = configuration.specifications
    
    // Calcular peso total
    specs.totalWeight = this.calculateTotalWeight(configuration)
    
    // Calcular consumo de energia
    specs.powerConsumption = this.calculatePowerConsumption(configuration)
    
    // Calcular eficiência
    specs.efficiency = this.calculateEfficiency(configuration)
    
    // Calcular tempo de ciclo
    specs.cycleTime = this.calculateCycleTime(configuration)
    
    // Calcular requisitos de instalação
    specs.installation = this.calculateInstallationRequirements(configuration)
    
    // Calcular manutenção
    specs.maintenance = this.calculateMaintenanceRequirements(configuration)
  }

  /**
   * Valida a configuração contra regras de negócio
   * @param {Object} configuration - Configuração
   */
  validateConfiguration(configuration) {
    const { baseVariant, options, specifications } = configuration
    
    // Validar compatibilidade de família
    this.validateFamilyCompatibility(configuration)
    
    // Validar capacidade
    this.validateCapacity(configuration)
    
    // Validar potência
    this.validatePower(configuration)
    
    // Validar dimensões
    this.validateDimensions(configuration)
    
    // Validar materiais
    this.validateMaterials(configuration)
    
    // Validar requisitos especiais
    this.validateSpecialRequirements(configuration)
  }

  /**
   * Calcula preços da configuração
   * @param {Object} configuration - Configuração
   */
  calculatePricing(configuration) {
    const pricing = configuration.pricing
    const { baseVariant, options, specifications } = configuration
    
    // Preço base
    pricing.basePrice = baseVariant.price || 0
    
    // Multiplicadores por opções
    pricing.optionMultipliers = this.calculateOptionMultipliers(options)
    
    // Custos adicionais
    pricing.additionalCosts = this.calculateAdditionalCosts(configuration)
    
    // Descontos aplicáveis
    pricing.discounts = this.calculateDiscounts(configuration)
    
    // Margem de lucro
    pricing.margin = this.calculateMargin(configuration)
    
    // Preço final
    pricing.finalPrice = this.calculateFinalPrice(pricing)
    
    // Detalhamento de custos
    pricing.breakdown = this.generatePriceBreakdown(pricing)
  }

  /**
   * Calcula multiplicadores de preço por opções
   * @param {Object} options - Opções selecionadas
   * @returns {Object} - Multiplicadores
   */
  calculateOptionMultipliers(options) {
    const multipliers = {
      capacity: 1.0,
      power: 1.0,
      materials: 1.0,
      accessories: 1.0,
      finishes: 1.0
    }

    // Multiplicador por capacidade
    if (options.capacity) {
      const capacityRatio = options.capacity.value / options.capacity.base
      multipliers.capacity = Math.pow(capacityRatio, 0.7) // Economia de escala
    }

    // Multiplicador por potência
    if (options.power) {
      const powerRatio = options.power.value / options.power.base
      multipliers.power = Math.pow(powerRatio, 0.8)
    }

    // Multiplicador por materiais especiais
    if (options.materials) {
      const materialMultipliers = {
        'stainless_steel': 1.4,
        'carbon_steel': 1.0,
        'aluminum': 1.2,
        'special_alloy': 1.8
      }
      multipliers.materials = materialMultipliers[options.materials.type] || 1.0
    }

    // Multiplicador por acessórios
    if (options.accessories && options.accessories.length > 0) {
      multipliers.accessories = 1.0 + (options.accessories.length * 0.1)
    }

    // Multiplicador por acabamentos
    if (options.finishes) {
      const finishMultipliers = {
        'standard': 1.0,
        'premium': 1.15,
        'industrial': 1.25,
        'food_grade': 1.35
      }
      multipliers.finishes = finishMultipliers[options.finishes.type] || 1.0
    }

    return multipliers
  }

  /**
   * Calcula custos adicionais
   * @param {Object} configuration - Configuração
   * @returns {Object} - Custos adicionais
   */
  calculateAdditionalCosts(configuration) {
    const costs = {
      engineering: 0,
      certification: 0,
      shipping: 0,
      installation: 0,
      training: 0,
      warranty: 0
    }

    const basePrice = configuration.pricing.basePrice

    // Custos de engenharia (customizações)
    if (configuration.options.customizations) {
      costs.engineering = basePrice * 0.05 // 5% do preço base
    }

    // Certificações especiais
    if (configuration.options.certifications) {
      costs.certification = basePrice * 0.03 // 3% do preço base
    }

    // Frete (baseado no peso e dimensões)
    const weight = configuration.specifications.totalWeight || 1000
    const volume = this.calculateVolume(configuration.specifications.dimensions)
    costs.shipping = Math.max(weight * 2.5, volume * 150) // R$ 2,50/kg ou R$ 150/m³

    // Instalação
    if (configuration.options.installation) {
      costs.installation = basePrice * 0.15 // 15% do preço base
    }

    // Treinamento
    if (configuration.options.training) {
      costs.training = 5000 // Valor fixo
    }

    // Garantia estendida
    if (configuration.options.extendedWarranty) {
      costs.warranty = basePrice * 0.08 // 8% do preço base
    }

    return costs
  }

  /**
   * Calcula descontos aplicáveis
   * @param {Object} configuration - Configuração
   * @returns {Object} - Descontos
   */
  calculateDiscounts(configuration) {
    const discounts = {
      volume: 0,
      loyalty: 0,
      promotional: 0,
      seasonal: 0
    }

    const basePrice = configuration.pricing.basePrice

    // Desconto por volume (seria calculado no contexto do projeto completo)
    // Por enquanto, aplicamos um desconto básico
    if (basePrice > 100000) {
      discounts.volume = basePrice * 0.05 // 5% para pedidos grandes
    }

    // Desconto promocional (seria configurável)
    const currentMonth = new Date().getMonth()
    if ([0, 1, 11].includes(currentMonth)) { // Jan, Fev, Dez
      discounts.seasonal = basePrice * 0.03 // 3% desconto sazonal
    }

    return discounts
  }

  /**
   * Calcula margem de lucro
   * @param {Object} configuration - Configuração
   * @returns {number} - Margem
   */
  calculateMargin(configuration) {
    // Margem baseada na complexidade e customização
    let marginPercent = 0.25 // 25% base

    // Aumentar margem para customizações
    if (configuration.options.customizations) {
      marginPercent += 0.05
    }

    // Aumentar margem para materiais especiais
    if (configuration.options.materials?.type !== 'carbon_steel') {
      marginPercent += 0.03
    }

    return marginPercent
  }

  /**
   * Calcula preço final
   * @param {Object} pricing - Dados de preço
   * @returns {number} - Preço final
   */
  calculateFinalPrice(pricing) {
    let finalPrice = pricing.basePrice

    // Aplicar multiplicadores
    Object.values(pricing.optionMultipliers).forEach(multiplier => {
      finalPrice *= multiplier
    })

    // Adicionar custos adicionais
    Object.values(pricing.additionalCosts).forEach(cost => {
      finalPrice += cost
    })

    // Aplicar descontos
    Object.values(pricing.discounts).forEach(discount => {
      finalPrice -= discount
    })

    // Aplicar margem
    finalPrice *= (1 + pricing.margin)

    return Math.round(finalPrice * 100) / 100 // Arredondar para 2 casas decimais
  }

  /**
   * Gera detalhamento de preços
   * @param {Object} pricing - Dados de preço
   * @returns {Array} - Breakdown detalhado
   */
  generatePriceBreakdown(pricing) {
    const breakdown = []

    // Preço base
    breakdown.push({
      item: 'Equipamento Base',
      type: 'base',
      value: pricing.basePrice,
      description: 'Preço base do equipamento'
    })

    // Multiplicadores
    Object.entries(pricing.optionMultipliers).forEach(([key, multiplier]) => {
      if (multiplier !== 1.0) {
        const adjustment = (multiplier - 1.0) * pricing.basePrice
        breakdown.push({
          item: `Ajuste ${key}`,
          type: 'multiplier',
          value: adjustment,
          description: `Multiplicador: ${multiplier.toFixed(2)}x`
        })
      }
    })

    // Custos adicionais
    Object.entries(pricing.additionalCosts).forEach(([key, cost]) => {
      if (cost > 0) {
        breakdown.push({
          item: key.charAt(0).toUpperCase() + key.slice(1),
          type: 'additional',
          value: cost,
          description: `Custo adicional: ${key}`
        })
      }
    })

    // Descontos
    Object.entries(pricing.discounts).forEach(([key, discount]) => {
      if (discount > 0) {
        breakdown.push({
          item: `Desconto ${key}`,
          type: 'discount',
          value: -discount,
          description: `Desconto aplicado: ${key}`
        })
      }
    })

    // Margem
    const marginValue = pricing.finalPrice - breakdown.reduce((sum, item) => sum + item.value, 0)
    if (marginValue > 0) {
      breakdown.push({
        item: 'Margem',
        type: 'margin',
        value: marginValue,
        description: `Margem de lucro: ${(pricing.margin * 100).toFixed(1)}%`
      })
    }

    return breakdown
  }

  /**
   * Gera chave de cache
   * @param {string} variantId - ID da variante
   * @param {Object} options - Opções
   * @returns {string} - Chave de cache
   */
  generateCacheKey(variantId, options) {
    return `${variantId}_${JSON.stringify(options)}`
  }

  /**
   * Limpa cache de configurações
   */
  clearCache() {
    this.configCache.clear()
    this.priceCache.clear()
  }

  // Métodos auxiliares de validação
  validateFamilyCompatibility(configuration) {
    // Implementar validação de compatibilidade
  }

  validateCapacity(configuration) {
    // Implementar validação de capacidade
  }

  validatePower(configuration) {
    // Implementar validação de potência
  }

  validateDimensions(configuration) {
    // Implementar validação de dimensões
  }

  validateMaterials(configuration) {
    // Implementar validação de materiais
  }

  validateSpecialRequirements(configuration) {
    // Implementar validação de requisitos especiais
  }

  // Métodos auxiliares de cálculo
  calculateCapacity(baseCapacity, options) {
    return baseCapacity * (options.multiplier || 1.0)
  }

  calculatePower(basePower, options) {
    return basePower * (options.multiplier || 1.0)
  }

  calculateDimensions(baseDimensions, options) {
    return {
      length: baseDimensions.length * (options.lengthMultiplier || 1.0),
      width: baseDimensions.width * (options.widthMultiplier || 1.0),
      height: baseDimensions.height * (options.heightMultiplier || 1.0)
    }
  }

  calculateTotalWeight(configuration) {
    const baseWeight = configuration.baseVariant.weight || 1000
    let totalWeight = baseWeight

    // Ajustar peso baseado nas opções
    if (configuration.options.materials?.type === 'stainless_steel') {
      totalWeight *= 1.1
    }

    return totalWeight
  }

  calculateVolume(dimensions) {
    if (!dimensions) return 1
    return dimensions.length * dimensions.width * dimensions.height
  }

  calculatePowerConsumption(configuration) {
    return configuration.specifications.power * 0.8 // 80% de eficiência média
  }

  calculateEfficiency(configuration) {
    // Eficiência baseada nas especificações
    return 0.85 // 85% padrão
  }

  calculateCycleTime(configuration) {
    // Tempo de ciclo baseado na capacidade
    const capacity = configuration.specifications.capacity || 100
    return 3600 / capacity // segundos por unidade
  }

  calculateInstallationRequirements(configuration) {
    return {
      foundation: true,
      electrical: true,
      plumbing: false,
      ventilation: true
    }
  }

  calculateMaintenanceRequirements(configuration) {
    return {
      frequency: 'monthly',
      duration: 4, // horas
      specialTools: false
    }
  }

  applyMaterials(baseMaterials, options) {
    return { ...baseMaterials, ...options }
  }

  applyAccessories(baseAccessories, options) {
    return [...baseAccessories, ...options]
  }

  applyFinishes(baseFinishes, options) {
    return { ...baseFinishes, ...options }
  }
}

// Instância singleton
const configurationEngine = new ConfigurationEngine()

export default configurationEngine
