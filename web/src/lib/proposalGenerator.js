import configurationEngine from './configurationEngine'
import pricingEngine from './pricingEngine'

/**
 * Gerador Automático de Propostas Comerciais
 * Cria propostas detalhadas com especificações técnicas e comerciais
 */
class ProposalGenerator {
  constructor() {
    this.templates = new Map()
    this.proposalCounter = 1
    
    this.initializeTemplates()
  }

  /**
   * Inicializa templates de proposta
   */
  initializeTemplates() {
    // Template padrão de proposta
    this.templates.set('standard', {
      sections: [
        'header',
        'executive_summary',
        'technical_specifications',
        'equipment_list',
        'pricing',
        'terms_conditions',
        'timeline',
        'support',
        'appendices'
      ],
      format: 'detailed'
    })

    // Template resumido
    this.templates.set('summary', {
      sections: [
        'header',
        'equipment_list',
        'pricing',
        'timeline'
      ],
      format: 'summary'
    })

    // Template técnico
    this.templates.set('technical', {
      sections: [
        'header',
        'technical_specifications',
        'equipment_list',
        'installation_requirements',
        'maintenance',
        'appendices'
      ],
      format: 'technical'
    })
  }

  /**
   * Gera uma proposta completa
   * @param {Object} project - Dados do projeto
   * @param {Object} options - Opções de geração
   * @returns {Object} - Proposta gerada
   */
  generateProposal(project, options = {}) {
    const proposalId = this.generateProposalId()
    const template = this.templates.get(options.template || 'standard')
    
    const proposal = {
      id: proposalId,
      number: `PROP-${new Date().getFullYear()}-${String(this.proposalCounter++).padStart(4, '0')}`,
      projectId: project.id,
      projectName: project.name,
      customer: project.customer || {},
      createdAt: new Date().toISOString(),
      validUntil: this.calculateValidityDate(),
      status: 'draft',
      version: '1.0',
      template: options.template || 'standard',
      sections: {},
      metadata: {
        generatedBy: 'TSI Configurator',
        totalPages: 0,
        totalItems: project.blocks?.length || 0,
        estimatedValue: 0
      }
    }

    try {
      // Gerar cada seção da proposta
      template.sections.forEach(sectionName => {
        proposal.sections[sectionName] = this.generateSection(sectionName, project, proposal, options)
      })

      // Calcular metadados finais
      this.calculateProposalMetadata(proposal)

      return proposal

    } catch (error) {
      console.error('Erro ao gerar proposta:', error)
      proposal.error = error.message
      return proposal
    }
  }

  /**
   * Gera uma seção específica da proposta
   * @param {string} sectionName - Nome da seção
   * @param {Object} project - Dados do projeto
   * @param {Object} proposal - Proposta sendo gerada
   * @param {Object} options - Opções
   * @returns {Object} - Dados da seção
   */
  generateSection(sectionName, project, proposal, options) {
    const generators = {
      'header': () => this.generateHeader(project, proposal, options),
      'executive_summary': () => this.generateExecutiveSummary(project, proposal, options),
      'technical_specifications': () => this.generateTechnicalSpecifications(project, proposal, options),
      'equipment_list': () => this.generateEquipmentList(project, proposal, options),
      'pricing': () => this.generatePricing(project, proposal, options),
      'terms_conditions': () => this.generateTermsConditions(project, proposal, options),
      'timeline': () => this.generateTimeline(project, proposal, options),
      'support': () => this.generateSupport(project, proposal, options),
      'installation_requirements': () => this.generateInstallationRequirements(project, proposal, options),
      'maintenance': () => this.generateMaintenance(project, proposal, options),
      'appendices': () => this.generateAppendices(project, proposal, options)
    }

    const generator = generators[sectionName]
    if (!generator) {
      throw new Error(`Gerador não encontrado para seção: ${sectionName}`)
    }

    return generator()
  }

  /**
   * Gera cabeçalho da proposta
   */
  generateHeader(project, proposal, options) {
    return {
      title: 'Proposta Comercial - Sistema Industrial TSI',
      proposalNumber: proposal.number,
      date: new Date().toLocaleDateString('pt-BR'),
      validUntil: new Date(proposal.validUntil).toLocaleDateString('pt-BR'),
      customer: {
        name: project.customer?.name || 'Cliente',
        contact: project.customer?.contact || '',
        email: project.customer?.email || '',
        phone: project.customer?.phone || ''
      },
      supplier: {
        name: 'TSI - Tecnologia em Sistemas Industriais',
        address: 'Rua Industrial, 123 - Distrito Industrial',
        city: 'São Paulo - SP',
        phone: '(11) 3456-7890',
        email: 'comercial@tsi.com.br',
        website: 'www.tsi.com.br'
      },
      project: {
        name: project.name,
        description: project.description || '',
        location: project.location || '',
        application: project.application || 'Industrial'
      }
    }
  }

  /**
   * Gera sumário executivo
   */
  generateExecutiveSummary(project, proposal, options) {
    const totalItems = project.blocks?.length || 0
    const estimatedValue = this.calculateProjectValue(project)
    
    return {
      overview: `Esta proposta apresenta uma solução completa para ${project.application || 'aplicação industrial'}, 
                 composta por ${totalItems} equipamentos principais, projetada para atender às necessidades específicas 
                 de ${project.customer?.name || 'sua empresa'}.`,
      
      keyBenefits: [
        'Solução integrada e otimizada para sua aplicação',
        'Equipamentos de alta qualidade e durabilidade',
        'Suporte técnico especializado',
        'Garantia estendida e manutenção preventiva',
        'Instalação e comissionamento inclusos'
      ],
      
      investment: {
        totalValue: estimatedValue,
        paymentTerms: '30% antecipado, 40% na entrega, 30% após comissionamento',
        deliveryTime: this.calculateDeliveryTime(project),
        warranty: '24 meses'
      },
      
      nextSteps: [
        'Aprovação da proposta técnica e comercial',
        'Assinatura do contrato',
        'Início da fabricação',
        'Entrega e instalação',
        'Comissionamento e treinamento'
      ]
    }
  }

  /**
   * Gera especificações técnicas
   */
  generateTechnicalSpecifications(project, proposal, options) {
    const specifications = {
      generalRequirements: {
        capacity: project.barracao?.capacity || 'Conforme especificado',
        powerSupply: project.barracao?.powerSupply || '380V / 60Hz / 3F',
        environment: {
          temperature: project.barracao?.temperature || '10°C a 40°C',
          humidity: project.barracao?.humidity || '< 85% UR',
          altitude: project.barracao?.altitude || '< 1000m'
        },
        standards: [
          'NBR 17094 - Máquinas e equipamentos industriais',
          'NR-12 - Segurança no trabalho em máquinas',
          'IEC 60204-1 - Equipamentos elétricos de máquinas'
        ]
      },
      
      facilityRequirements: {
        dimensions: {
          length: project.barracao?.dimensions?.length || 0,
          width: project.barracao?.dimensions?.width || 0,
          height: project.barracao?.dimensions?.height || 0,
          area: (project.barracao?.dimensions?.length || 0) * (project.barracao?.dimensions?.width || 0)
        },
        foundation: 'Fundação em concreto armado conforme desenhos',
        utilities: {
          electrical: 'Quadro elétrico principal com proteções',
          compressed_air: 'Ar comprimido 6 bar, seco e filtrado',
          water: 'Água industrial para limpeza',
          drainage: 'Sistema de drenagem para efluentes'
        }
      },
      
      performanceParameters: this.calculatePerformanceParameters(project),
      
      safetyFeatures: [
        'Botões de emergência em pontos estratégicos',
        'Proteções físicas em partes móveis',
        'Sinalização luminosa de status',
        'Sistema de intertravamento de segurança',
        'Aterramento e proteção elétrica'
      ]
    }

    return specifications
  }

  /**
   * Gera lista de equipamentos
   */
  generateEquipmentList(project, proposal, options) {
    const equipmentList = {
      summary: {
        totalItems: project.blocks?.length || 0,
        totalWeight: 0,
        totalPower: 0,
        families: {}
      },
      items: []
    }

    // Processar cada bloco/equipamento
    if (project.blocks) {
      project.blocks.forEach((block, index) => {
        const configuration = configurationEngine.configureProduct(block.variant, block.options || {})
        const pricing = pricingEngine.calculateItemPrice(block.variant, { projectId: project.id })

        const equipmentItem = {
          item: index + 1,
          tag: block.tag || `EQ-${String(index + 1).padStart(3, '0')}`,
          description: block.variant.name,
          family: block.variant.family_name,
          model: block.variant.model || 'Standard',
          quantity: 1,
          
          specifications: {
            dimensions: block.variant.dimensions,
            weight: configuration.specifications?.totalWeight || block.variant.weight || 0,
            power: configuration.specifications?.power || block.variant.specifications?.power || 0,
            capacity: configuration.specifications?.capacity || block.variant.specifications?.capacity || 0,
            material: configuration.specifications?.materials?.primary || 'Aço carbono',
            finish: configuration.specifications?.finishes?.type || 'Pintura industrial'
          },
          
          features: block.variant.features || [],
          accessories: configuration.specifications?.accessories || [],
          
          pricing: {
            unitPrice: pricing.finalPrice,
            totalPrice: pricing.finalPrice,
            currency: 'BRL'
          },
          
          delivery: {
            leadTime: this.calculateItemLeadTime(block.variant),
            weight: configuration.specifications?.totalWeight || 0,
            dimensions: this.calculatePackagingDimensions(block.variant.dimensions)
          }
        }

        equipmentList.items.push(equipmentItem)

        // Atualizar resumo
        equipmentList.summary.totalWeight += equipmentItem.specifications.weight
        equipmentList.summary.totalPower += equipmentItem.specifications.power
        
        const family = equipmentItem.family
        if (!equipmentList.summary.families[family]) {
          equipmentList.summary.families[family] = { count: 0, totalValue: 0 }
        }
        equipmentList.summary.families[family].count++
        equipmentList.summary.families[family].totalValue += equipmentItem.pricing.totalPrice
      })
    }

    return equipmentList
  }

  /**
   * Gera seção de preços
   */
  generatePricing(project, proposal, options) {
    const items = project.blocks?.map(block => block.variant) || []
    const projectPricing = pricingEngine.calculateProjectPrice(items, {
      projectId: project.id,
      includeInstallation: options.includeInstallation !== false,
      includeTraining: options.includeTraining !== false,
      extendedWarranty: options.extendedWarranty !== false
    })

    return {
      summary: {
        subtotal: projectPricing.subtotal,
        discounts: projectPricing.discounts.reduce((sum, d) => sum + d.value, 0),
        services: projectPricing.services.reduce((sum, s) => sum + s.value, 0),
        totalPrice: projectPricing.totalPrice,
        currency: projectPricing.currency
      },
      
      breakdown: projectPricing.breakdown,
      
      paymentTerms: {
        conditions: [
          '30% na assinatura do contrato',
          '40% na entrega dos equipamentos',
          '30% após comissionamento e aceite final'
        ],
        methods: ['Transferência bancária', 'Boleto bancário'],
        currency: 'BRL',
        validity: '30 dias'
      },
      
      financing: {
        available: true,
        options: [
          'Financiamento BNDES para equipamentos industriais',
          'Leasing operacional',
          'Parcelamento direto (até 12x)'
        ]
      },
      
      taxes: {
        included: true,
        details: 'Todos os impostos federais, estaduais e municipais inclusos'
      }
    }
  }

  /**
   * Gera termos e condições
   */
  generateTermsConditions(project, proposal, options) {
    return {
      general: [
        'Esta proposta é válida por 30 dias a partir da data de emissão',
        'Preços em Reais (BRL) e sujeitos a reajuste conforme índices oficiais',
        'Frete e seguro por conta do comprador, salvo acordo em contrário',
        'Garantia de 24 meses contra defeitos de fabricação'
      ],
      
      delivery: [
        'Prazo de entrega conforme cronograma apresentado',
        'Entrega CIF (Cost, Insurance and Freight) no local indicado',
        'Agendamento de entrega com 48h de antecedência',
        'Descarregamento por conta do comprador'
      ],
      
      installation: [
        'Instalação e comissionamento inclusos no escopo',
        'Local de instalação preparado conforme especificações',
        'Utilities (energia, ar comprimido, água) disponíveis',
        'Aceite final mediante teste de performance'
      ],
      
      warranty: [
        'Garantia de 24 meses contra defeitos de fabricação',
        'Suporte técnico remoto incluído',
        'Peças de reposição disponíveis por 10 anos',
        'Manutenção preventiva opcional'
      ],
      
      legal: [
        'Foro da comarca de São Paulo para dirimir questões',
        'Legislação brasileira aplicável',
        'Confidencialidade das informações técnicas',
        'Propriedade intelectual protegida'
      ]
    }
  }

  /**
   * Gera cronograma do projeto
   */
  generateTimeline(project, proposal, options) {
    const startDate = new Date()
    const milestones = []
    let currentDate = new Date(startDate)

    // Marco 1: Assinatura do contrato
    milestones.push({
      id: 1,
      name: 'Assinatura do Contrato',
      description: 'Aprovação da proposta e assinatura do contrato',
      startDate: new Date(currentDate),
      duration: 5, // dias
      dependencies: [],
      deliverables: ['Contrato assinado', 'Ordem de compra']
    })

    // Marco 2: Engenharia detalhada
    currentDate.setDate(currentDate.getDate() + 5)
    milestones.push({
      id: 2,
      name: 'Engenharia Detalhada',
      description: 'Desenvolvimento dos projetos executivos',
      startDate: new Date(currentDate),
      duration: 15,
      dependencies: [1],
      deliverables: ['Desenhos executivos', 'Lista de materiais', 'Especificações técnicas']
    })

    // Marco 3: Fabricação
    currentDate.setDate(currentDate.getDate() + 15)
    const fabricationDuration = this.calculateFabricationTime(project)
    milestones.push({
      id: 3,
      name: 'Fabricação',
      description: 'Fabricação dos equipamentos',
      startDate: new Date(currentDate),
      duration: fabricationDuration,
      dependencies: [2],
      deliverables: ['Equipamentos fabricados', 'Certificados de qualidade', 'Manuais técnicos']
    })

    // Marco 4: Entrega
    currentDate.setDate(currentDate.getDate() + fabricationDuration)
    milestones.push({
      id: 4,
      name: 'Entrega',
      description: 'Transporte e entrega no local',
      startDate: new Date(currentDate),
      duration: 3,
      dependencies: [3],
      deliverables: ['Equipamentos entregues', 'Nota fiscal', 'Certificado de entrega']
    })

    // Marco 5: Instalação
    currentDate.setDate(currentDate.getDate() + 3)
    milestones.push({
      id: 5,
      name: 'Instalação',
      description: 'Instalação e montagem dos equipamentos',
      startDate: new Date(currentDate),
      duration: 10,
      dependencies: [4],
      deliverables: ['Equipamentos instalados', 'Testes preliminares']
    })

    // Marco 6: Comissionamento
    currentDate.setDate(currentDate.getDate() + 10)
    milestones.push({
      id: 6,
      name: 'Comissionamento',
      description: 'Testes finais e aceite',
      startDate: new Date(currentDate),
      duration: 5,
      dependencies: [5],
      deliverables: ['Testes de performance', 'Treinamento operacional', 'Aceite final']
    })

    const totalDuration = milestones.reduce((sum, m) => sum + m.duration, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + totalDuration)

    return {
      summary: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalDuration,
        totalMilestones: milestones.length
      },
      milestones,
      criticalPath: [1, 2, 3, 4, 5, 6],
      risks: [
        'Atraso na aprovação de desenhos pelo cliente',
        'Disponibilidade de matéria-prima',
        'Condições climáticas para transporte',
        'Preparação do local de instalação'
      ]
    }
  }

  /**
   * Gera seção de suporte
   */
  generateSupport(project, proposal, options) {
    return {
      technical: {
        hotline: '0800-123-4567',
        email: 'suporte@tsi.com.br',
        hours: '24/7 para emergências, 8h-18h para suporte geral',
        response: 'Até 4 horas para chamados críticos'
      },
      
      maintenance: {
        preventive: {
          frequency: 'Trimestral',
          duration: '4 horas por equipamento',
          included: 'Primeiros 12 meses inclusos'
        },
        corrective: {
          response: '24 horas',
          parts: 'Estoque local de peças críticas',
          technicians: 'Técnicos certificados'
        }
      },
      
      training: {
        operational: {
          duration: '16 horas',
          participants: 'Até 6 pessoas',
          location: 'No local da instalação',
          certification: 'Certificado de participação'
        },
        maintenance: {
          duration: '24 horas',
          participants: 'Até 4 pessoas',
          location: 'Centro de treinamento TSI',
          certification: 'Certificado técnico'
        }
      },
      
      documentation: {
        manuals: [
          'Manual de operação',
          'Manual de manutenção',
          'Manual de peças de reposição',
          'Desenhos as-built'
        ],
        languages: ['Português', 'Inglês'],
        format: 'Impresso e digital'
      }
    }
  }

  /**
   * Gera requisitos de instalação
   */
  generateInstallationRequirements(project, proposal, options) {
    return {
      civil: {
        foundation: 'Fundação em concreto armado conforme desenhos',
        floor: 'Piso industrial nivelado e resistente',
        drainage: 'Sistema de drenagem para limpeza',
        access: 'Acesso para equipamentos de grande porte'
      },
      
      electrical: {
        power: `${this.calculateTotalPower(project)}kW instalados`,
        voltage: '380V / 60Hz / 3F + N + T',
        protection: 'Quadro elétrico com proteções adequadas',
        grounding: 'Sistema de aterramento conforme NBR 5410'
      },
      
      utilities: {
        compressedAir: '6 bar, seco e filtrado',
        water: 'Água industrial para limpeza',
        lighting: 'Iluminação mínima 300 lux',
        ventilation: 'Ventilação natural ou forçada'
      },
      
      safety: {
        emergency: 'Saídas de emergência sinalizadas',
        firefighting: 'Sistema de combate a incêndio',
        firstAid: 'Kit de primeiros socorros',
        signage: 'Sinalização de segurança'
      }
    }
  }

  /**
   * Gera seção de manutenção
   */
  generateMaintenance(project, proposal, options) {
    return {
      preventive: {
        schedule: this.generateMaintenanceSchedule(project),
        procedures: [
          'Inspeção visual geral',
          'Verificação de fixações',
          'Lubrificação de componentes',
          'Teste de funcionamento',
          'Limpeza geral'
        ],
        tools: [
          'Ferramentas básicas',
          'Multímetro',
          'Torquímetro',
          'Equipamentos de lubrificação'
        ]
      },
      
      corrective: {
        diagnosis: 'Sistema de diagnóstico remoto',
        parts: 'Estoque recomendado de peças críticas',
        procedures: 'Procedimentos detalhados de reparo',
        training: 'Treinamento para equipe de manutenção'
      },
      
      spare_parts: this.generateSparePartsList(project),
      
      costs: {
        preventive: 'R$ 500,00 por visita',
        corrective: 'Conforme necessidade',
        parts: 'Preço de tabela vigente',
        emergency: 'Taxa adicional de 50%'
      }
    }
  }

  /**
   * Gera apêndices
   */
  generateAppendices(project, proposal, options) {
    return {
      technical_drawings: {
        available: true,
        types: [
          'Layout geral',
          'Desenhos de fabricação',
          'Diagramas elétricos',
          'Fluxogramas de processo'
        ],
        format: 'PDF e DWG'
      },
      
      certifications: [
        'ISO 9001:2015 - Sistema de Gestão da Qualidade',
        'ISO 14001:2015 - Sistema de Gestão Ambiental',
        'OHSAS 18001 - Segurança e Saúde Ocupacional'
      ],
      
      references: [
        'Cliente A - Sistema similar instalado em 2023',
        'Cliente B - Expansão de linha em 2022',
        'Cliente C - Modernização completa em 2021'
      ],
      
      company_profile: {
        founded: 1995,
        employees: 150,
        projects: 500,
        markets: ['Alimentício', 'Químico', 'Farmacêutico', 'Mineração']
      }
    }
  }

  // Métodos auxiliares de cálculo

  calculateProjectValue(project) {
    if (!project.blocks) return 0
    
    return project.blocks.reduce((total, block) => {
      const pricing = pricingEngine.calculateItemPrice(block.variant, { projectId: project.id })
      return total + pricing.finalPrice
    }, 0)
  }

  calculateDeliveryTime(project) {
    const baseTime = 45 // dias base
    const itemCount = project.blocks?.length || 0
    const additionalTime = Math.ceil(itemCount / 3) * 5 // 5 dias a cada 3 itens
    
    return baseTime + additionalTime
  }

  calculateFabricationTime(project) {
    const itemCount = project.blocks?.length || 0
    return Math.max(30, itemCount * 3) // Mínimo 30 dias, 3 dias por item
  }

  calculateTotalPower(project) {
    if (!project.blocks) return 0
    
    return project.blocks.reduce((total, block) => {
      return total + (block.variant.specifications?.power || 0)
    }, 0)
  }

  calculatePerformanceParameters(project) {
    return {
      capacity: 'Conforme especificação de cada equipamento',
      efficiency: '> 85% para todos os equipamentos',
      availability: '> 95% com manutenção preventiva',
      reliability: 'MTBF > 8760 horas'
    }
  }

  calculateItemLeadTime(variant) {
    const baseTimes = {
      'Dosador Gravimétrico': 25,
      'Misturador Industrial': 35,
      'Elevador de Canecas': 30,
      'Transportador Helicoidal': 20,
      'Tanque de Armazenamento': 40,
      'Painel de Controle': 15,
      'Sistema de Tubulação': 10,
      'Filtro Industrial': 25
    }
    
    return baseTimes[variant.family_name] || 30
  }

  calculatePackagingDimensions(dimensions) {
    if (!dimensions) return { length: 0, width: 0, height: 0 }
    
    return {
      length: dimensions.length + 0.5,
      width: dimensions.width + 0.5,
      height: dimensions.height + 0.5
    }
  }

  generateMaintenanceSchedule(project) {
    return {
      daily: ['Inspeção visual', 'Verificação de ruídos anormais'],
      weekly: ['Limpeza geral', 'Verificação de fixações'],
      monthly: ['Lubrificação', 'Teste de segurança'],
      quarterly: ['Manutenção preventiva completa'],
      annually: ['Revisão geral', 'Calibração de instrumentos']
    }
  }

  generateSparePartsList(project) {
    return {
      critical: [
        'Rolamentos principais',
        'Correias de transmissão',
        'Vedações e gaxetas',
        'Fusíveis e contatores'
      ],
      recommended: [
        'Filtros de ar',
        'Óleos lubrificantes',
        'Parafusos e porcas',
        'Sensores de proximidade'
      ],
      consumables: [
        'Graxa para lubrificação',
        'Produtos de limpeza',
        'Materiais de vedação',
        'Etiquetas de identificação'
      ]
    }
  }

  generateProposalId() {
    return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  calculateValidityDate() {
    const date = new Date()
    date.setDate(date.getDate() + 30) // 30 dias de validade
    return date.toISOString()
  }

  calculateProposalMetadata(proposal) {
    // Estimar número de páginas baseado no conteúdo
    let estimatedPages = 5 // Páginas base
    
    Object.keys(proposal.sections).forEach(section => {
      const sectionData = proposal.sections[section]
      if (section === 'equipment_list') {
        estimatedPages += Math.ceil((sectionData.items?.length || 0) / 3) // 3 itens por página
      } else if (section === 'technical_specifications') {
        estimatedPages += 2
      } else {
        estimatedPages += 1
      }
    })

    proposal.metadata.totalPages = estimatedPages
    
    // Calcular valor total estimado
    if (proposal.sections.pricing) {
      proposal.metadata.estimatedValue = proposal.sections.pricing.summary.totalPrice
    }
  }

  /**
   * Exporta proposta para diferentes formatos
   * @param {Object} proposal - Proposta
   * @param {string} format - Formato (json, pdf, docx)
   * @returns {Object} - Dados exportados
   */
  exportProposal(proposal, format = 'json') {
    switch (format) {
      case 'json':
        return proposal
      case 'pdf':
        return this.exportToPDF(proposal)
      case 'docx':
        return this.exportToDocx(proposal)
      default:
        throw new Error(`Formato não suportado: ${format}`)
    }
  }

  exportToPDF(proposal) {
    // Implementar exportação para PDF
    return {
      format: 'pdf',
      filename: `${proposal.number}.pdf`,
      data: 'PDF data would be here'
    }
  }

  exportToDocx(proposal) {
    // Implementar exportação para DOCX
    return {
      format: 'docx',
      filename: `${proposal.number}.docx`,
      data: 'DOCX data would be here'
    }
  }
}

// Instância singleton
const proposalGenerator = new ProposalGenerator()

export default proposalGenerator
