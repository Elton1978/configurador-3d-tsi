/**
 * Sistema de Cálculo de Preços em Tempo Real
 * Gerencia preços, descontos, impostos e condições comerciais
 */
class PricingEngine {
  constructor() {
    this.priceRules = new Map()
    this.discountRules = new Map()
    this.taxRules = new Map()
    this.currencyRates = new Map()
    
    // Cache para otimização
    this.priceCache = new Map()
    this.lastUpdate = null
    
    this.initializePricingRules()
  }

  /**
   * Inicializa regras de preço padrão
   */
  initializePricingRules() {
    // Regras de preço por família
    this.addPriceRule('family_base_prices', {
      'Dosador Gravimétrico': { min: 25000, max: 150000, base: 50000 },
      'Misturador Industrial': { min: 35000, max: 200000, base: 75000 },
      'Elevador de Canecas': { min: 20000, max: 120000, base: 45000 },
      'Transportador Helicoidal': { min: 15000, max: 80000, base: 35000 },
      'Tanque de Armazenamento': { min: 30000, max: 180000, base: 65000 },
      'Painel de Controle': { min: 10000, max: 50000, base: 25000 },
      'Sistema de Tubulação': { min: 5000, max: 30000, base: 15000 },
      'Filtro Industrial': { min: 12000, max: 60000, base: 28000 }
    })

    // Regras de desconto por volume
    this.addDiscountRule('volume_discount', {
      tiers: [
        { min: 0, max: 100000, discount: 0 },
        { min: 100000, max: 300000, discount: 0.05 },
        { min: 300000, max: 500000, discount: 0.08 },
        { min: 500000, max: 1000000, discount: 0.12 },
        { min: 1000000, max: Infinity, discount: 0.15 }
      ]
    })

    // Regras de desconto por quantidade
    this.addDiscountRule('quantity_discount', {
      tiers: [
        { min: 1, max: 2, discount: 0 },
        { min: 3, max: 5, discount: 0.03 },
        { min: 6, max: 10, discount: 0.05 },
        { min: 11, max: 20, discount: 0.08 },
        { min: 21, max: Infinity, discount: 0.10 }
      ]
    })

    // Regras de impostos
    this.addTaxRule('brazil_taxes', {
      icms: 0.18, // 18% ICMS
      ipi: 0.10,  // 10% IPI
      pis: 0.0165, // 1.65% PIS
      cofins: 0.076, // 7.6% COFINS
      iss: 0.05   // 5% ISS (para serviços)
    })

    // Taxas de câmbio (seria atualizado via API)
    this.currencyRates.set('USD', 5.20)
    this.currencyRates.set('EUR', 5.65)
    this.currencyRates.set('BRL', 1.00)
  }

  /**
   * Adiciona regra de preço
   * @param {string} ruleId - ID da regra
   * @param {Object} ruleData - Dados da regra
   */
  addPriceRule(ruleId, ruleData) {
    this.priceRules.set(ruleId, ruleData)
  }

  /**
   * Adiciona regra de desconto
   * @param {string} ruleId - ID da regra
   * @param {Object} ruleData - Dados da regra
   */
  addDiscountRule(ruleId, ruleData) {
    this.discountRules.set(ruleId, ruleData)
  }

  /**
   * Adiciona regra de imposto
   * @param {string} ruleId - ID da regra
   * @param {Object} ruleData - Dados da regra
   */
  addTaxRule(ruleId, ruleData) {
    this.taxRules.set(ruleId, ruleData)
  }

  /**
   * Calcula preço de um item individual
   * @param {Object} item - Item a ser precificado
   * @param {Object} context - Contexto da precificação
   * @returns {Object} - Resultado da precificação
   */
  calculateItemPrice(item, context = {}) {
    const cacheKey = this.generateItemCacheKey(item, context)
    
    // Verificar cache
    if (this.priceCache.has(cacheKey)) {
      return this.priceCache.get(cacheKey)
    }

    const pricing = {
      itemId: item.id,
      basePrice: 0,
      adjustments: [],
      discounts: [],
      taxes: [],
      finalPrice: 0,
      currency: context.currency || 'BRL',
      timestamp: new Date().toISOString()
    }

    try {
      // Calcular preço base
      pricing.basePrice = this.calculateBasePrice(item, context)
      
      // Aplicar ajustes de configuração
      this.applyConfigurationAdjustments(pricing, item, context)
      
      // Aplicar descontos
      this.applyDiscounts(pricing, item, context)
      
      // Calcular impostos
      this.calculateTaxes(pricing, item, context)
      
      // Calcular preço final
      pricing.finalPrice = this.calculateFinalItemPrice(pricing)
      
      // Armazenar no cache
      this.priceCache.set(cacheKey, pricing)
      
      return pricing
      
    } catch (error) {
      console.error('Erro ao calcular preço do item:', error)
      pricing.error = error.message
      return pricing
    }
  }

  /**
   * Calcula preço de um projeto completo
   * @param {Array} items - Lista de itens
   * @param {Object} context - Contexto da precificação
   * @returns {Object} - Resultado da precificação do projeto
   */
  calculateProjectPrice(items, context = {}) {
    const projectPricing = {
      projectId: context.projectId,
      items: [],
      subtotal: 0,
      discounts: [],
      taxes: [],
      services: [],
      totalPrice: 0,
      currency: context.currency || 'BRL',
      timestamp: new Date().toISOString(),
      breakdown: []
    }

    try {
      // Calcular preço de cada item
      items.forEach(item => {
        const itemPricing = this.calculateItemPrice(item, context)
        projectPricing.items.push(itemPricing)
        projectPricing.subtotal += itemPricing.finalPrice
      })

      // Aplicar descontos de projeto
      this.applyProjectDiscounts(projectPricing, items, context)
      
      // Calcular serviços adicionais
      this.calculateProjectServices(projectPricing, items, context)
      
      // Calcular impostos do projeto
      this.calculateProjectTaxes(projectPricing, items, context)
      
      // Calcular preço final do projeto
      projectPricing.totalPrice = this.calculateFinalProjectPrice(projectPricing)
      
      // Gerar breakdown detalhado
      projectPricing.breakdown = this.generateProjectBreakdown(projectPricing)
      
      return projectPricing
      
    } catch (error) {
      console.error('Erro ao calcular preço do projeto:', error)
      projectPricing.error = error.message
      return projectPricing
    }
  }

  /**
   * Calcula preço base de um item
   * @param {Object} item - Item
   * @param {Object} context - Contexto
   * @returns {number} - Preço base
   */
  calculateBasePrice(item, context) {
    const familyPrices = this.priceRules.get('family_base_prices')
    const familyPrice = familyPrices[item.family_name]
    
    if (!familyPrice) {
      throw new Error(`Preço não encontrado para família: ${item.family_name}`)
    }

    let basePrice = familyPrice.base

    // Ajustar baseado na capacidade/tamanho
    if (item.specifications?.capacity) {
      const capacityRatio = item.specifications.capacity / 100 // Capacidade base 100
      basePrice *= Math.pow(capacityRatio, 0.7) // Economia de escala
    }

    // Ajustar baseado na potência
    if (item.specifications?.power) {
      const powerRatio = item.specifications.power / 10 // Potência base 10kW
      basePrice *= Math.pow(powerRatio, 0.8)
    }

    // Ajustar baseado nas dimensões
    if (item.dimensions) {
      const volume = item.dimensions.length * item.dimensions.width * item.dimensions.height
      const volumeRatio = volume / 8 // Volume base 2x2x2m
      basePrice *= Math.pow(volumeRatio, 0.6)
    }

    return Math.round(basePrice)
  }

  /**
   * Aplica ajustes de configuração
   * @param {Object} pricing - Objeto de precificação
   * @param {Object} item - Item
   * @param {Object} context - Contexto
   */
  applyConfigurationAdjustments(pricing, item, context) {
    // Ajuste por material
    if (item.specifications?.material) {
      const materialMultipliers = {
        'carbon_steel': 1.0,
        'stainless_steel': 1.4,
        'aluminum': 1.2,
        'special_alloy': 1.8
      }
      
      const multiplier = materialMultipliers[item.specifications.material] || 1.0
      if (multiplier !== 1.0) {
        const adjustment = pricing.basePrice * (multiplier - 1.0)
        pricing.adjustments.push({
          type: 'material',
          description: `Material: ${item.specifications.material}`,
          multiplier,
          value: adjustment
        })
      }
    }

    // Ajuste por acabamento
    if (item.specifications?.finish) {
      const finishMultipliers = {
        'standard': 1.0,
        'premium': 1.15,
        'industrial': 1.25,
        'food_grade': 1.35
      }
      
      const multiplier = finishMultipliers[item.specifications.finish] || 1.0
      if (multiplier !== 1.0) {
        const adjustment = pricing.basePrice * (multiplier - 1.0)
        pricing.adjustments.push({
          type: 'finish',
          description: `Acabamento: ${item.specifications.finish}`,
          multiplier,
          value: adjustment
        })
      }
    }

    // Ajuste por certificações
    if (item.specifications?.certifications) {
      item.specifications.certifications.forEach(cert => {
        const certificationCosts = {
          'ISO9001': 2000,
          'CE': 5000,
          'ATEX': 8000,
          'FDA': 12000
        }
        
        const cost = certificationCosts[cert] || 0
        if (cost > 0) {
          pricing.adjustments.push({
            type: 'certification',
            description: `Certificação: ${cert}`,
            value: cost
          })
        }
      })
    }

    // Ajuste por customizações
    if (item.customizations && item.customizations.length > 0) {
      const customizationCost = pricing.basePrice * 0.15 // 15% do preço base
      pricing.adjustments.push({
        type: 'customization',
        description: `${item.customizations.length} customizações`,
        value: customizationCost
      })
    }
  }

  /**
   * Aplica descontos ao item
   * @param {Object} pricing - Objeto de precificação
   * @param {Object} item - Item
   * @param {Object} context - Contexto
   */
  applyDiscounts(pricing, item, context) {
    // Desconto promocional
    if (context.promotionalDiscount) {
      const discount = pricing.basePrice * context.promotionalDiscount
      pricing.discounts.push({
        type: 'promotional',
        description: 'Desconto promocional',
        percentage: context.promotionalDiscount,
        value: discount
      })
    }

    // Desconto por cliente especial
    if (context.customerTier === 'premium') {
      const discount = pricing.basePrice * 0.05 // 5% para clientes premium
      pricing.discounts.push({
        type: 'customer_tier',
        description: 'Desconto cliente premium',
        percentage: 0.05,
        value: discount
      })
    }

    // Desconto sazonal
    const currentMonth = new Date().getMonth()
    if ([0, 1, 11].includes(currentMonth)) { // Jan, Fev, Dez
      const discount = pricing.basePrice * 0.03 // 3% desconto sazonal
      pricing.discounts.push({
        type: 'seasonal',
        description: 'Desconto sazonal',
        percentage: 0.03,
        value: discount
      })
    }
  }

  /**
   * Calcula impostos do item
   * @param {Object} pricing - Objeto de precificação
   * @param {Object} item - Item
   * @param {Object} context - Contexto
   */
  calculateTaxes(pricing, item, context) {
    const taxRules = this.taxRules.get('brazil_taxes')
    if (!taxRules) return

    const taxableAmount = pricing.basePrice + 
      pricing.adjustments.reduce((sum, adj) => sum + adj.value, 0) -
      pricing.discounts.reduce((sum, disc) => sum + disc.value, 0)

    // ICMS
    pricing.taxes.push({
      type: 'ICMS',
      description: 'Imposto sobre Circulação de Mercadorias',
      rate: taxRules.icms,
      base: taxableAmount,
      value: taxableAmount * taxRules.icms
    })

    // IPI
    pricing.taxes.push({
      type: 'IPI',
      description: 'Imposto sobre Produtos Industrializados',
      rate: taxRules.ipi,
      base: taxableAmount,
      value: taxableAmount * taxRules.ipi
    })

    // PIS
    pricing.taxes.push({
      type: 'PIS',
      description: 'Programa de Integração Social',
      rate: taxRules.pis,
      base: taxableAmount,
      value: taxableAmount * taxRules.pis
    })

    // COFINS
    pricing.taxes.push({
      type: 'COFINS',
      description: 'Contribuição para Financiamento da Seguridade Social',
      rate: taxRules.cofins,
      base: taxableAmount,
      value: taxableAmount * taxRules.cofins
    })
  }

  /**
   * Calcula preço final do item
   * @param {Object} pricing - Objeto de precificação
   * @returns {number} - Preço final
   */
  calculateFinalItemPrice(pricing) {
    let finalPrice = pricing.basePrice

    // Somar ajustes
    finalPrice += pricing.adjustments.reduce((sum, adj) => sum + adj.value, 0)

    // Subtrair descontos
    finalPrice -= pricing.discounts.reduce((sum, disc) => sum + disc.value, 0)

    // Somar impostos
    finalPrice += pricing.taxes.reduce((sum, tax) => sum + tax.value, 0)

    return Math.round(finalPrice * 100) / 100
  }

  /**
   * Aplica descontos de projeto
   * @param {Object} projectPricing - Precificação do projeto
   * @param {Array} items - Itens do projeto
   * @param {Object} context - Contexto
   */
  applyProjectDiscounts(projectPricing, items, context) {
    // Desconto por volume
    const volumeRule = this.discountRules.get('volume_discount')
    if (volumeRule) {
      const tier = volumeRule.tiers.find(t => 
        projectPricing.subtotal >= t.min && projectPricing.subtotal < t.max
      )
      
      if (tier && tier.discount > 0) {
        projectPricing.discounts.push({
          type: 'volume',
          description: `Desconto por volume (${(tier.discount * 100).toFixed(1)}%)`,
          percentage: tier.discount,
          value: projectPricing.subtotal * tier.discount
        })
      }
    }

    // Desconto por quantidade
    const quantityRule = this.discountRules.get('quantity_discount')
    if (quantityRule) {
      const tier = quantityRule.tiers.find(t => 
        items.length >= t.min && items.length < t.max
      )
      
      if (tier && tier.discount > 0) {
        projectPricing.discounts.push({
          type: 'quantity',
          description: `Desconto por quantidade (${items.length} itens)`,
          percentage: tier.discount,
          value: projectPricing.subtotal * tier.discount
        })
      }
    }
  }

  /**
   * Calcula serviços do projeto
   * @param {Object} projectPricing - Precificação do projeto
   * @param {Array} items - Itens do projeto
   * @param {Object} context - Contexto
   */
  calculateProjectServices(projectPricing, items, context) {
    // Serviço de instalação
    if (context.includeInstallation) {
      const installationCost = projectPricing.subtotal * 0.15 // 15% do subtotal
      projectPricing.services.push({
        type: 'installation',
        description: 'Instalação e comissionamento',
        value: installationCost
      })
    }

    // Serviço de treinamento
    if (context.includeTraining) {
      const trainingCost = items.length * 2000 // R$ 2.000 por equipamento
      projectPricing.services.push({
        type: 'training',
        description: 'Treinamento operacional',
        value: trainingCost
      })
    }

    // Garantia estendida
    if (context.extendedWarranty) {
      const warrantyCost = projectPricing.subtotal * 0.08 // 8% do subtotal
      projectPricing.services.push({
        type: 'warranty',
        description: 'Garantia estendida (3 anos)',
        value: warrantyCost
      })
    }
  }

  /**
   * Calcula impostos do projeto
   * @param {Object} projectPricing - Precificação do projeto
   * @param {Array} items - Itens do projeto
   * @param {Object} context - Contexto
   */
  calculateProjectTaxes(projectPricing, items, context) {
    // Os impostos já foram calculados por item
    // Aqui podemos adicionar impostos específicos do projeto se necessário
  }

  /**
   * Calcula preço final do projeto
   * @param {Object} projectPricing - Precificação do projeto
   * @returns {number} - Preço final
   */
  calculateFinalProjectPrice(projectPricing) {
    let finalPrice = projectPricing.subtotal

    // Subtrair descontos do projeto
    finalPrice -= projectPricing.discounts.reduce((sum, disc) => sum + disc.value, 0)

    // Somar serviços
    finalPrice += projectPricing.services.reduce((sum, service) => sum + service.value, 0)

    return Math.round(finalPrice * 100) / 100
  }

  /**
   * Gera breakdown detalhado do projeto
   * @param {Object} projectPricing - Precificação do projeto
   * @returns {Array} - Breakdown detalhado
   */
  generateProjectBreakdown(projectPricing) {
    const breakdown = []

    // Subtotal dos itens
    breakdown.push({
      category: 'Equipamentos',
      items: projectPricing.items.map(item => ({
        description: item.itemId,
        value: item.finalPrice
      })),
      subtotal: projectPricing.subtotal
    })

    // Descontos
    if (projectPricing.discounts.length > 0) {
      breakdown.push({
        category: 'Descontos',
        items: projectPricing.discounts.map(disc => ({
          description: disc.description,
          value: -disc.value
        })),
        subtotal: -projectPricing.discounts.reduce((sum, disc) => sum + disc.value, 0)
      })
    }

    // Serviços
    if (projectPricing.services.length > 0) {
      breakdown.push({
        category: 'Serviços',
        items: projectPricing.services.map(service => ({
          description: service.description,
          value: service.value
        })),
        subtotal: projectPricing.services.reduce((sum, service) => sum + service.value, 0)
      })
    }

    return breakdown
  }

  /**
   * Gera chave de cache para item
   * @param {Object} item - Item
   * @param {Object} context - Contexto
   * @returns {string} - Chave de cache
   */
  generateItemCacheKey(item, context) {
    return `item_${item.id}_${JSON.stringify(context)}_${this.lastUpdate || Date.now()}`
  }

  /**
   * Converte preço para outra moeda
   * @param {number} amount - Valor
   * @param {string} fromCurrency - Moeda origem
   * @param {string} toCurrency - Moeda destino
   * @returns {number} - Valor convertido
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount

    const fromRate = this.currencyRates.get(fromCurrency) || 1
    const toRate = this.currencyRates.get(toCurrency) || 1

    return (amount / fromRate) * toRate
  }

  /**
   * Atualiza taxas de câmbio
   * @param {Object} rates - Novas taxas
   */
  updateCurrencyRates(rates) {
    Object.entries(rates).forEach(([currency, rate]) => {
      this.currencyRates.set(currency, rate)
    })
    this.lastUpdate = Date.now()
    this.clearCache()
  }

  /**
   * Limpa cache de preços
   */
  clearCache() {
    this.priceCache.clear()
  }

  /**
   * Formata valor monetário
   * @param {number} amount - Valor
   * @param {string} currency - Moeda
   * @returns {string} - Valor formatado
   */
  formatCurrency(amount, currency = 'BRL') {
    const formatters = {
      'BRL': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    }

    const formatter = formatters[currency] || formatters['BRL']
    return formatter.format(amount)
  }
}

// Instância singleton
const pricingEngine = new PricingEngine()

export default pricingEngine
