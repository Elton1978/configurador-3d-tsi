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
