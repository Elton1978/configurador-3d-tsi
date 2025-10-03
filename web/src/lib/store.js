import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    (set, get) => ({
      // Estado do projeto atual
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      // Estado do barracão
      barracao: {
        dimensions: { length: 40, width: 20, height: 8 },
        pillars: [],
        doors: []
      },
      setBarracao: (barracao) => set({ barracao }),

      // Blocos no projeto
      projectBlocks: [],
      setProjectBlocks: (blocks) => set({ projectBlocks: blocks }),
      addProjectBlock: (block) => set((state) => ({
        projectBlocks: [...state.projectBlocks, block]
      })),
      updateProjectBlock: (id, updates) => set((state) => ({
        projectBlocks: state.projectBlocks.map(block =>
          block.id === id ? { ...block, ...updates } : block
        )
      })),
      removeProjectBlock: (id) => set((state) => ({
        projectBlocks: state.projectBlocks.filter(block => block.id !== id)
      })),

      // Bloco selecionado
      selectedBlock: null,
      setSelectedBlock: (block) => set({ selectedBlock: block }),

      // Catálogo de blocos
      blockCatalog: {
        families: [],
        variants: [],
        connectors: []
      },
      setBlockCatalog: (catalog) => set({ blockCatalog: catalog }),

      // Propostas geradas
      proposals: [],
      setProposals: (proposals) => set({ proposals }),
      selectedProposal: null,
      setSelectedProposal: (proposal) => set({ selectedProposal: proposal }),

      // Configurações de produtos
      configurations: {},
      setConfigurations: (configurations) => set({ configurations }),

      // Preços calculados
      pricing: {},
      setPricing: (pricing) => set({ pricing }),

      // BOM (Bill of Materials)
      bom: {},
      setBOM: (bom) => set({ bom }),

      // Estado da UI
      ui: {
        sidebarOpen: true,
        activeTab: 'projeto', // 'projeto', 'barracao', 'blocos', 'propostas', 'bom'
        loading: false,
        error: null,
        showGrid: true,
        showConnectors: false,
        ghostMode: false
      },
      setUI: (updates) => set((state) => ({
        ui: { ...state.ui, ...updates }
      })),

      // Viewport 3D
      viewport: {
        camera: { position: [10, 10, 10], target: [0, 0, 0] },
        controls: { enabled: true },
        scene: { background: '#f0f0f0' }
      },
      setViewport: (updates) => set((state) => ({
        viewport: { ...state.viewport, ...updates }
      })),

      // Ações assíncronas
      loadProject: async (projectId) => {
        set((state) => ({ ui: { ...state.ui, loading: true } }))
        try {
          // Implementar chamada à API
          const response = await fetch(`/api/projects/${projectId}`)
          const project = await response.json()
          set({ currentProject: project })
        } catch (error) {
          set((state) => ({ ui: { ...state.ui, error: error.message } }))
        } finally {
          set((state) => ({ ui: { ...state.ui, loading: false } }))
        }
      },

      generateProposals: async () => {
        set((state) => ({ ui: { ...state.ui, loading: true } }))
        try {
          const { currentProject, barracao, projectBlocks } = get()
          const response = await fetch('/api/proposals/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: currentProject?.id,
              barracao,
              blocks: projectBlocks
            })
          })
          const proposals = await response.json()
          set({ proposals })
        } catch (error) {
          set((state) => ({ ui: { ...state.ui, error: error.message } }))
        } finally {
          set((state) => ({ ui: { ...state.ui, loading: false } }))
        }
      },

      // Ações para configuração de produtos
      configureProduct: async (variantId, options = {}) => {
        const variant = get().blockCatalog.variants.find(v => v.id === variantId)
        if (!variant) return

        try {
          const { default: configurationEngine } = await import('./configurationEngine')
          const configuration = configurationEngine.configureProduct(variant, options)
          
          set((state) => ({
            configurations: {
              ...state.configurations,
              [variantId]: configuration
            }
          }))

          return configuration
        } catch (error) {
          console.error('Erro ao configurar produto:', error)
          set((state) => ({ ui: { ...state.ui, error: error.message } }))
        }
      },

      // Ações para cálculo de preços
      calculatePrice: async (items, context = {}) => {
        try {
          const { default: pricingEngine } = await import('./pricingEngine')
          const pricing = Array.isArray(items) 
            ? pricingEngine.calculateProjectPrice(items, context)
            : pricingEngine.calculateItemPrice(items, context)
          
          set((state) => ({
            pricing: {
              ...state.pricing,
              [context.projectId || 'current']: pricing
            }
          }))

          return pricing
        } catch (error) {
          console.error('Erro ao calcular preço:', error)
          set((state) => ({ ui: { ...state.ui, error: error.message } }))
        }
      },

      // Gerar proposta usando o sistema interno
      generateProposal: async (projectId, options = {}) => {
        const project = get().currentProject
        if (!project) return

        try {
          const { default: proposalGenerator } = await import('./proposalGenerator')
          const proposal = proposalGenerator.generateProposal(project, options)
          
          set((state) => ({
            proposals: [...state.proposals, proposal]
          }))

          return proposal
        } catch (error) {
          console.error('Erro ao gerar proposta:', error)
          set((state) => ({ ui: { ...state.ui, error: error.message } }))
        }
      },

      // Gerar BOM (Bill of Materials)
      generateBOM: (projectId) => {
        const project = get().currentProject
        if (!project || !project.blocks) return

        const bom = {
          projectId,
          generatedAt: new Date().toISOString(),
          items: [],
          summary: {
            totalItems: 0,
            totalWeight: 0,
            totalValue: 0,
            families: {}
          }
        }

        project.blocks.forEach((block, index) => {
          const item = {
            position: index + 1,
            tag: block.tag || `EQ-${String(index + 1).padStart(3, '0')}`,
            description: block.variant.name,
            family: block.variant.family_name,
            model: block.variant.model || 'Standard',
            quantity: 1,
            unitPrice: block.variant.price || 0,
            totalPrice: block.variant.price || 0,
            weight: block.variant.weight || 0,
            leadTime: 30, // dias
            supplier: 'TSI',
            specifications: block.variant.specifications || {}
          }

          bom.items.push(item)
          bom.summary.totalItems++
          bom.summary.totalWeight += item.weight
          bom.summary.totalValue += item.totalPrice

          // Agrupar por família
          if (!bom.summary.families[item.family]) {
            bom.summary.families[item.family] = { count: 0, value: 0 }
          }
          bom.summary.families[item.family].count++
          bom.summary.families[item.family].value += item.totalPrice
        })

        set((state) => ({
          bom: {
            ...state.bom,
            [projectId]: bom
          }
        }))

        return bom
      },

      // Reset do estado
      reset: () => set({
        currentProject: null,
        projectBlocks: [],
        selectedBlock: null,
        proposals: [],
        selectedProposal: null,
        ui: {
          sidebarOpen: true,
          activeTab: 'projeto',
          loading: false,
          error: null,
          showGrid: true,
          showConnectors: false,
          ghostMode: false
        }
      })
    }),
    {
      name: 'configurador-store'
    }
  )
)

export default useStore
