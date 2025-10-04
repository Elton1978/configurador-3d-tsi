/**
 * Testes para componentes React
 * Testes unitários, integração e E2E
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Componentes a serem testados
import App from '../App'
import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import Viewport from '../components/Viewport'
import { useStore } from '../lib/store'

// Mocks
vi.mock('../lib/store', () => ({
  useStore: vi.fn()
}))

vi.mock('three', () => ({
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    render: vi.fn(),
    domElement: document.createElement('canvas')
  })),
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  Vector3: vi.fn(),
  BoxGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  Mesh: vi.fn()
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="three-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: {},
    scene: {},
    gl: {}
  }))
}))

// Wrapper para testes com roteamento
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Mock do store
const mockStore = {
  // Estado inicial
  user: null,
  projects: [],
  currentProject: null,
  catalog: {
    families: [],
    variants: [],
    connectors: []
  },
  ui: {
    sidebarCollapsed: false,
    activeTab: 'project',
    viewportSettings: {
      showGrid: true,
      showConnectors: true,
      ghostMode: false
    }
  },
  
  // Actions
  setUser: vi.fn(),
  addProject: vi.fn(),
  setCurrentProject: vi.fn(),
  updateProject: vi.fn(),
  setCatalog: vi.fn(),
  toggleSidebar: vi.fn(),
  setActiveTab: vi.fn(),
  updateViewportSettings: vi.fn(),
  addBlock: vi.fn(),
  removeBlock: vi.fn(),
  updateBlock: vi.fn()
}

describe('App Component', () => {
  beforeEach(() => {
    useStore.mockReturnValue(mockStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    expect(screen.getByTestId('app-container')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    const loadingStore = { ...mockStore, isLoading: true }
    useStore.mockReturnValue(loadingStore)
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows error message when there is an error', () => {
    const errorStore = { 
      ...mockStore, 
      error: 'Erro de conexão com o servidor' 
    }
    useStore.mockReturnValue(errorStore)
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    expect(screen.getByText(/Erro de conexão com o servidor/)).toBeInTheDocument()
  })
})

describe('Layout Component', () => {
  beforeEach(() => {
    useStore.mockReturnValue(mockStore)
  })

  it('renders header, sidebar and viewport', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    )
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('viewport')).toBeInTheDocument()
  })

  it('toggles sidebar when button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    )
    
    const toggleButton = screen.getByTestId('sidebar-toggle')
    await user.click(toggleButton)
    
    expect(mockStore.toggleSidebar).toHaveBeenCalled()
  })

  it('displays user info when logged in', () => {
    const loggedInStore = {
      ...mockStore,
      user: {
        id: 'user-1',
        username: 'testuser',
        full_name: 'Test User'
      }
    }
    useStore.mockReturnValue(loggedInStore)
    
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    )
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })
})

describe('Sidebar Component', () => {
  beforeEach(() => {
    useStore.mockReturnValue(mockStore)
  })

  it('renders all tabs', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Projeto')).toBeInTheDocument()
    expect(screen.getByText('Barracão')).toBeInTheDocument()
    expect(screen.getByText('Blocos')).toBeInTheDocument()
    expect(screen.getByText('Propostas')).toBeInTheDocument()
    expect(screen.getByText('BOM/Preço')).toBeInTheDocument()
  })

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    const blocksTab = screen.getByText('Blocos')
    await user.click(blocksTab)
    
    expect(mockStore.setActiveTab).toHaveBeenCalledWith('blocks')
  })

  it('shows active tab correctly', () => {
    const activeTabStore = {
      ...mockStore,
      ui: { ...mockStore.ui, activeTab: 'blocks' }
    }
    useStore.mockReturnValue(activeTabStore)
    
    render(<Sidebar />)
    
    const blocksTab = screen.getByText('Blocos').closest('button')
    expect(blocksTab).toHaveClass('active')
  })

  it('collapses when sidebar is collapsed', () => {
    const collapsedStore = {
      ...mockStore,
      ui: { ...mockStore.ui, sidebarCollapsed: true }
    }
    useStore.mockReturnValue(collapsedStore)
    
    render(<Sidebar />)
    
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveClass('collapsed')
  })
})

describe('Viewport Component', () => {
  beforeEach(() => {
    useStore.mockReturnValue(mockStore)
  })

  it('renders Three.js canvas', () => {
    render(<Viewport />)
    
    expect(screen.getByTestId('three-canvas')).toBeInTheDocument()
  })

  it('shows viewport controls', () => {
    render(<Viewport />)
    
    expect(screen.getByTestId('viewport-controls')).toBeInTheDocument()
    expect(screen.getByText('Grid')).toBeInTheDocument()
    expect(screen.getByText('Conectores')).toBeInTheDocument()
    expect(screen.getByText('Ghost Mode')).toBeInTheDocument()
  })

  it('toggles grid visibility', async () => {
    const user = userEvent.setup()
    
    render(<Viewport />)
    
    const gridToggle = screen.getByLabelText('Grid')
    await user.click(gridToggle)
    
    expect(mockStore.updateViewportSettings).toHaveBeenCalledWith({
      showGrid: false
    })
  })

  it('handles viewport resize', () => {
    render(<Viewport />)
    
    // Simular resize
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    
    // Verificar se o viewport foi redimensionado
    // (implementação específica dependeria do código real)
  })
})

describe('Project Tab', () => {
  beforeEach(() => {
    useStore.mockReturnValue(mockStore)
  })

  it('renders project form', () => {
    render(<Sidebar />)
    
    // Assumindo que o tab de projeto é o padrão
    expect(screen.getByLabelText('Nome do Projeto')).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
    expect(screen.getByLabelText('Aplicação')).toBeInTheDocument()
  })

  it('creates new project when form is submitted', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    // Preencher formulário
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Novo Projeto')
    await user.type(screen.getByLabelText('Descrição'), 'Descrição do projeto')
    await user.selectOptions(screen.getByLabelText('Aplicação'), 'industrial')
    
    // Submeter
    const submitButton = screen.getByText('Criar Projeto')
    await user.click(submitButton)
    
    expect(mockStore.addProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Novo Projeto',
        description: 'Descrição do projeto',
        application: 'industrial'
      })
    )
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    // Tentar submeter sem preencher campos obrigatórios
    const submitButton = screen.getByText('Criar Projeto')
    await user.click(submitButton)
    
    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
  })
})

describe('Blocks Tab', () => {
  beforeEach(() => {
    const storeWithCatalog = {
      ...mockStore,
      catalog: {
        families: [
          { id: 'family-1', name: 'Dosador Gravimétrico' },
          { id: 'family-2', name: 'Misturador Industrial' }
        ],
        variants: [
          {
            id: 'variant-1',
            name: 'Dosador DG-100',
            family_id: 'family-1',
            price: 50000
          }
        ]
      },
      ui: { ...mockStore.ui, activeTab: 'blocks' }
    }
    useStore.mockReturnValue(storeWithCatalog)
  })

  it('displays catalog families', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Dosador Gravimétrico')).toBeInTheDocument()
    expect(screen.getByText('Misturador Industrial')).toBeInTheDocument()
  })

  it('filters variants by family', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    // Selecionar família
    const familyButton = screen.getByText('Dosador Gravimétrico')
    await user.click(familyButton)
    
    // Verificar se variantes da família são mostradas
    expect(screen.getByText('Dosador DG-100')).toBeInTheDocument()
  })

  it('adds block to project when variant is selected', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    // Selecionar variante
    const variantButton = screen.getByText('Dosador DG-100')
    await user.click(variantButton)
    
    expect(mockStore.addBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant_id: 'variant-1'
      })
    )
  })

  it('searches variants by name', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    const searchInput = screen.getByPlaceholderText('Buscar equipamentos...')
    await user.type(searchInput, 'DG-100')
    
    // Verificar se apenas variantes correspondentes são mostradas
    expect(screen.getByText('Dosador DG-100')).toBeInTheDocument()
  })
})

describe('Proposals Tab', () => {
  beforeEach(() => {
    const storeWithProposals = {
      ...mockStore,
      proposals: [
        {
          id: 'proposal-1',
          number: 'PROP-001',
          project_name: 'Projeto Teste',
          status: 'draft',
          total_price: 150000
        }
      ],
      ui: { ...mockStore.ui, activeTab: 'proposals' }
    }
    useStore.mockReturnValue(storeWithProposals)
  })

  it('displays existing proposals', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('PROP-001')).toBeInTheDocument()
    expect(screen.getByText('Projeto Teste')).toBeInTheDocument()
    expect(screen.getByText('R$ 150.000,00')).toBeInTheDocument()
  })

  it('generates new proposal', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    const generateButton = screen.getByText('Gerar Nova Proposta')
    await user.click(generateButton)
    
    expect(mockStore.generateProposal).toHaveBeenCalled()
  })

  it('exports proposal to PDF', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    const exportButton = screen.getByText('Exportar PDF')
    await user.click(exportButton)
    
    expect(mockStore.exportProposal).toHaveBeenCalledWith('proposal-1', 'pdf')
  })
})

describe('Store Integration', () => {
  it('updates UI state correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Simular mudança no store
    const updatedStore = {
      ...mockStore,
      ui: { ...mockStore.ui, activeTab: 'blocks' }
    }
    useStore.mockReturnValue(updatedStore)
    
    rerender(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Verificar se a UI foi atualizada
    expect(screen.getByText('Blocos').closest('button')).toHaveClass('active')
  })

  it('handles async operations', async () => {
    const asyncStore = {
      ...mockStore,
      loadCatalog: vi.fn().mockResolvedValue(true),
      isLoading: false
    }
    useStore.mockReturnValue(asyncStore)
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      expect(asyncStore.loadCatalog).toHaveBeenCalled()
    })
  })
})

describe('Error Handling', () => {
  it('displays error boundary when component crashes', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }
    
    // Mock console.error para evitar logs desnecessários
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <TestWrapper>
        <ThrowError />
      </TestWrapper>
    )
    
    expect(screen.getByText(/Algo deu errado/)).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('handles API errors gracefully', async () => {
    const errorStore = {
      ...mockStore,
      loadCatalog: vi.fn().mockRejectedValue(new Error('API Error')),
      error: 'Falha ao carregar catálogo'
    }
    useStore.mockReturnValue(errorStore)
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    expect(screen.getByText('Falha ao carregar catálogo')).toBeInTheDocument()
  })
})

describe('Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    )
    
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(<Sidebar />)
    
    // Navegar com Tab
    await user.tab()
    expect(screen.getByText('Projeto').closest('button')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByText('Barracão').closest('button')).toHaveFocus()
  })

  it('has proper color contrast', () => {
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    )
    
    // Verificar se elementos têm contraste adequado
    // (implementação específica dependeria das ferramentas de teste)
  })
})

describe('Performance', () => {
  it('renders within acceptable time', () => {
    const startTime = performance.now()
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Deve renderizar em menos de 100ms
    expect(renderTime).toBeLessThan(100)
  })

  it('memoizes expensive components', () => {
    const { rerender } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Simular re-render com mesmo estado
    rerender(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Verificar se componentes não foram re-renderizados desnecessariamente
    // (implementação específica dependeria dos mocks)
  })
})

describe('Responsive Design', () => {
  it('adapts to mobile viewport', () => {
    // Simular viewport mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    )
    
    // Verificar se sidebar está colapsada em mobile
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toHaveClass('mobile-collapsed')
  })

  it('shows desktop layout on large screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    })
    
    render(
      <TestWrapper>
        <Layout />
      </TestWrapper>
    )
    
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).not.toHaveClass('mobile-collapsed')
  })
})
