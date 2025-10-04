/**
 * Testes End-to-End com Playwright
 * Testes de fluxos completos do usuário
 */

const { test, expect } = require('@playwright/test')

// Configurações
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const API_URL = process.env.API_URL || 'http://localhost:8000'

// Dados de teste
const testUser = {
  username: 'testuser_e2e',
  email: 'testuser@e2e.com',
  password: 'TestPassword123!',
  fullName: 'Test User E2E'
}

const testProject = {
  name: 'Projeto E2E Test',
  description: 'Projeto criado durante testes E2E',
  application: 'industrial',
  barracao: {
    length: 40,
    width: 20,
    height: 8,
    location: 'São Paulo, SP'
  }
}

test.describe('Configurador 3D TSI - Fluxos Principais', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar para a aplicação
    await page.goto(BASE_URL)
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle')
  })

  test('Fluxo completo: Registro, Login e Criação de Projeto', async ({ page }) => {
    // 1. Registro de usuário
    await page.click('[data-testid="register-button"]')
    
    await page.fill('[data-testid="username-input"]', testUser.username)
    await page.fill('[data-testid="email-input"]', testUser.email)
    await page.fill('[data-testid="password-input"]', testUser.password)
    await page.fill('[data-testid="fullname-input"]', testUser.fullName)
    
    await page.click('[data-testid="submit-register"]')
    
    // Verificar sucesso do registro
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // 2. Login
    await page.click('[data-testid="login-button"]')
    
    await page.fill('[data-testid="login-username"]', testUser.username)
    await page.fill('[data-testid="login-password"]', testUser.password)
    
    await page.click('[data-testid="submit-login"]')
    
    // Verificar login bem-sucedido
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    await expect(page.locator('text=' + testUser.fullName)).toBeVisible()
    
    // 3. Criar novo projeto
    await page.click('[data-testid="new-project-button"]')
    
    await page.fill('[data-testid="project-name"]', testProject.name)
    await page.fill('[data-testid="project-description"]', testProject.description)
    await page.selectOption('[data-testid="project-application"]', testProject.application)
    
    // Configurar barracão
    await page.fill('[data-testid="barracao-length"]', testProject.barracao.length.toString())
    await page.fill('[data-testid="barracao-width"]', testProject.barracao.width.toString())
    await page.fill('[data-testid="barracao-height"]', testProject.barracao.height.toString())
    await page.fill('[data-testid="barracao-location"]', testProject.barracao.location)
    
    await page.click('[data-testid="create-project"]')
    
    // Verificar criação do projeto
    await expect(page.locator('[data-testid="project-created-message"]')).toBeVisible()
    await expect(page.locator('text=' + testProject.name)).toBeVisible()
  })

  test('Configuração de equipamentos no viewport 3D', async ({ page }) => {
    // Assumir que usuário já está logado
    await loginUser(page, testUser)
    
    // Criar projeto de teste
    await createTestProject(page, testProject)
    
    // 1. Navegar para aba de blocos
    await page.click('[data-testid="blocks-tab"]')
    
    // Aguardar carregamento do catálogo
    await page.waitForSelector('[data-testid="catalog-families"]')
    
    // 2. Selecionar família de equipamentos
    await page.click('[data-testid="family-dosador-gravimetrico"]')
    
    // Aguardar carregamento das variantes
    await page.waitForSelector('[data-testid="variants-list"]')
    
    // 3. Adicionar equipamento ao projeto
    await page.click('[data-testid="variant-dg-100"]')
    
    // Verificar se equipamento apareceu no viewport
    await expect(page.locator('[data-testid="block-in-viewport"]')).toBeVisible()
    
    // 4. Posicionar equipamento no viewport
    const viewport = page.locator('[data-testid="three-canvas"]')
    
    // Drag and drop para posicionar
    await viewport.dragTo(viewport, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 200, y: 150 }
    })
    
    // 5. Verificar snapping automático
    await expect(page.locator('[data-testid="snap-indicator"]')).toBeVisible()
    
    // 6. Configurar opções do equipamento
    await page.click('[data-testid="block-options"]')
    
    await page.selectOption('[data-testid="material-option"]', 'stainless_steel')
    await page.fill('[data-testid="capacity-option"]', '150')
    
    await page.click('[data-testid="apply-options"]')
    
    // Verificar atualização do preço
    await expect(page.locator('[data-testid="updated-price"]')).toBeVisible()
  })

  test('Geração e exportação de proposta', async ({ page }) => {
    // Setup: usuário logado com projeto configurado
    await loginUser(page, testUser)
    await createProjectWithBlocks(page, testProject)
    
    // 1. Navegar para aba de propostas
    await page.click('[data-testid="proposals-tab"]')
    
    // 2. Gerar nova proposta
    await page.click('[data-testid="generate-proposal"]')
    
    // Configurar template da proposta
    await page.selectOption('[data-testid="proposal-template"]', 'standard')
    await page.fill('[data-testid="proposal-notes"]', 'Proposta gerada durante teste E2E')
    
    await page.click('[data-testid="confirm-generate"]')
    
    // Aguardar geração
    await page.waitForSelector('[data-testid="proposal-generated"]', { timeout: 10000 })
    
    // 3. Verificar conteúdo da proposta
    await expect(page.locator('[data-testid="proposal-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="proposal-total-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="proposal-items-list"]')).toBeVisible()
    
    // 4. Exportar para PDF
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-pdf"]')
    const download = await downloadPromise
    
    // Verificar download
    expect(download.suggestedFilename()).toMatch(/proposta.*\.pdf/)
    
    // 5. Enviar proposta por email (se implementado)
    await page.click('[data-testid="send-email"]')
    
    await page.fill('[data-testid="recipient-email"]', 'cliente@teste.com')
    await page.fill('[data-testid="email-subject"]', 'Proposta Configurador 3D TSI')
    
    await page.click('[data-testid="send-proposal"]')
    
    await expect(page.locator('[data-testid="email-sent-confirmation"]')).toBeVisible()
  })

  test('Colaboração em tempo real', async ({ page, context }) => {
    // Criar segunda aba para simular segundo usuário
    const page2 = await context.newPage()
    
    // Usuário 1: Login e criação de projeto
    await loginUser(page, testUser)
    await createTestProject(page, testProject)
    
    // Usuário 2: Login e acesso ao mesmo projeto
    const testUser2 = { ...testUser, username: 'testuser2_e2e' }
    await page2.goto(BASE_URL)
    await loginUser(page2, testUser2)
    await page2.goto(`${BASE_URL}/projects/${testProject.id}`)
    
    // 1. Verificar presença de usuários ativos
    await expect(page.locator('[data-testid="active-users"]')).toContainText('2 usuários')
    await expect(page2.locator('[data-testid="active-users"]')).toContainText('2 usuários')
    
    // 2. Testar cursors colaborativos
    await page.mouse.move(300, 200)
    
    // Verificar cursor do usuário 1 visível para usuário 2
    await expect(page2.locator('[data-testid="collaborative-cursor-user1"]')).toBeVisible()
    
    // 3. Testar mudanças sincronizadas
    await page.click('[data-testid="blocks-tab"]')
    await page.click('[data-testid="variant-dg-100"]')
    
    // Verificar se bloco aparece para usuário 2
    await expect(page2.locator('[data-testid="block-in-viewport"]')).toBeVisible()
    
    // 4. Testar comentários colaborativos
    await page.click('[data-testid="add-comment"]')
    await page.fill('[data-testid="comment-text"]', 'Comentário de teste do usuário 1')
    await page.click('[data-testid="submit-comment"]')
    
    // Verificar comentário visível para usuário 2
    await expect(page2.locator('text=Comentário de teste do usuário 1')).toBeVisible()
    
    await page2.close()
  })

  test('Performance e responsividade', async ({ page }) => {
    // 1. Testar carregamento inicial
    const startTime = Date.now()
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Carregamento deve ser menor que 3 segundos
    expect(loadTime).toBeLessThan(3000)
    
    // 2. Testar responsividade mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verificar se sidebar colapsa em mobile
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/mobile-collapsed/)
    
    // Verificar se viewport se adapta
    const viewport = page.locator('[data-testid="viewport"]')
    const viewportBox = await viewport.boundingBox()
    expect(viewportBox.width).toBeLessThan(400)
    
    // 3. Testar com projeto grande (muitos blocos)
    await loginUser(page, testUser)
    await createLargeProject(page)
    
    // Verificar se viewport mantém performance
    const renderStart = Date.now()
    await page.click('[data-testid="render-all-blocks"]')
    await page.waitForSelector('[data-testid="all-blocks-rendered"]')
    const renderTime = Date.now() - renderStart
    
    // Renderização deve ser menor que 2 segundos
    expect(renderTime).toBeLessThan(2000)
    
    // 4. Testar scroll performance
    await page.mouse.wheel(0, 1000)
    await page.waitForTimeout(100)
    
    // Verificar se não há lag visual
    await expect(page.locator('[data-testid="viewport"]')).toBeVisible()
  })

  test('Busca avançada e filtros', async ({ page }) => {
    await loginUser(page, testUser)
    
    // 1. Testar busca global
    await page.click('[data-testid="global-search"]')
    await page.fill('[data-testid="search-input"]', 'dosador')
    
    // Aguardar resultados
    await page.waitForSelector('[data-testid="search-results"]')
    
    // Verificar resultados
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Dosador')
    
    // 2. Testar filtros avançados
    await page.click('[data-testid="advanced-filters"]')
    
    await page.selectOption('[data-testid="family-filter"]', 'dosador-gravimetrico')
    await page.fill('[data-testid="price-min"]', '10000')
    await page.fill('[data-testid="price-max"]', '100000')
    
    await page.click('[data-testid="apply-filters"]')
    
    // Verificar resultados filtrados
    const results = page.locator('[data-testid="filtered-results"] .result-item')
    const count = await results.count()
    expect(count).toBeGreaterThan(0)
    
    // 3. Testar sugestões de busca
    await page.fill('[data-testid="search-input"]', 'mix')
    
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-suggestions"]')).toContainText('Misturador')
    
    // Clicar em sugestão
    await page.click('[data-testid="suggestion-misturador"]')
    
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Misturador')
  })

  test('Validação de dados e tratamento de erros', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // 1. Testar validação de formulário de registro
    await page.click('[data-testid="register-button"]')
    
    // Tentar submeter sem dados
    await page.click('[data-testid="submit-register"]')
    
    // Verificar mensagens de erro
    await expect(page.locator('[data-testid="username-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
    
    // 2. Testar validação de email
    await page.fill('[data-testid="email-input"]', 'email-invalido')
    await page.blur('[data-testid="email-input"]')
    
    await expect(page.locator('[data-testid="email-format-error"]')).toBeVisible()
    
    // 3. Testar validação de senha
    await page.fill('[data-testid="password-input"]', '123')
    await page.blur('[data-testid="password-input"]')
    
    await expect(page.locator('[data-testid="password-weak-error"]')).toBeVisible()
    
    // 4. Testar tratamento de erro de rede
    // Simular falha de rede
    await page.route('**/api/**', route => route.abort())
    
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="email-input"]', 'test@test.com')
    await page.fill('[data-testid="password-input"]', 'ValidPassword123!')
    
    await page.click('[data-testid="submit-register"]')
    
    // Verificar mensagem de erro de conexão
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
  })

  test('Acessibilidade', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // 1. Testar navegação por teclado
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="register-button"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused()
    
    // 2. Testar ARIA labels
    const loginButton = page.locator('[data-testid="login-button"]')
    await expect(loginButton).toHaveAttribute('aria-label')
    
    // 3. Testar contraste de cores
    const backgroundColor = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="main-content"]')
      return window.getComputedStyle(element).backgroundColor
    })
    
    const textColor = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="main-content"]')
      return window.getComputedStyle(element).color
    })
    
    // Verificar se há contraste adequado (implementação específica)
    expect(backgroundColor).toBeTruthy()
    expect(textColor).toBeTruthy()
    
    // 4. Testar leitores de tela
    const pageTitle = await page.title()
    expect(pageTitle).toContain('Configurador 3D TSI')
    
    // Verificar headings hierárquicos
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })
})

// Funções auxiliares
async function loginUser(page, user) {
  await page.click('[data-testid="login-button"]')
  await page.fill('[data-testid="login-username"]', user.username)
  await page.fill('[data-testid="login-password"]', user.password)
  await page.click('[data-testid="submit-login"]')
  await page.waitForSelector('[data-testid="user-menu"]')
}

async function createTestProject(page, project) {
  await page.click('[data-testid="new-project-button"]')
  await page.fill('[data-testid="project-name"]', project.name)
  await page.fill('[data-testid="project-description"]', project.description)
  await page.selectOption('[data-testid="project-application"]', project.application)
  await page.click('[data-testid="create-project"]')
  await page.waitForSelector('[data-testid="project-created-message"]')
}

async function createProjectWithBlocks(page, project) {
  await createTestProject(page, project)
  
  // Adicionar alguns blocos
  await page.click('[data-testid="blocks-tab"]')
  await page.waitForSelector('[data-testid="catalog-families"]')
  
  await page.click('[data-testid="family-dosador-gravimetrico"]')
  await page.click('[data-testid="variant-dg-100"]')
  
  await page.click('[data-testid="family-misturador-industrial"]')
  await page.click('[data-testid="variant-mix-500"]')
}

async function createLargeProject(page) {
  await createTestProject(page, { 
    ...testProject, 
    name: 'Projeto Grande E2E' 
  })
  
  // Adicionar muitos blocos para testar performance
  await page.click('[data-testid="blocks-tab"]')
  
  for (let i = 0; i < 20; i++) {
    await page.click('[data-testid="variant-dg-100"]')
    await page.waitForTimeout(100) // Pequena pausa entre adições
  }
}
