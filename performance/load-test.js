/**
 * Testes de Performance e Carga
 * Usando k6 para testes de carga da API
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Métricas customizadas
const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')
const authTime = new Trend('auth_time')
const catalogLoadTime = new Trend('catalog_load_time')
const projectCreationTime = new Trend('project_creation_time')

// Configurações do teste
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // 10 usuários em 2 minutos
    { duration: '5m', target: 50 },   // 50 usuários em 5 minutos
    { duration: '10m', target: 100 }, // 100 usuários em 10 minutos
    
    // Sustentação
    { duration: '15m', target: 100 }, // Manter 100 usuários por 15 minutos
    
    // Pico de carga
    { duration: '2m', target: 200 },  // Pico de 200 usuários
    { duration: '3m', target: 200 },  // Manter pico por 3 minutos
    
    // Ramp down
    { duration: '5m', target: 0 },    // Reduzir para 0 em 5 minutos
  ],
  
  thresholds: {
    // 95% das requisições devem ser menores que 2s
    http_req_duration: ['p(95)<2000'],
    
    // Taxa de erro deve ser menor que 5%
    errors: ['rate<0.05'],
    
    // 90% das requisições de autenticação devem ser menores que 1s
    auth_time: ['p(90)<1000'],
    
    // Carregamento do catálogo deve ser menor que 3s
    catalog_load_time: ['p(95)<3000'],
    
    // Criação de projeto deve ser menor que 5s
    project_creation_time: ['p(95)<5000'],
  }
}

// Configuração da API
const API_BASE = __ENV.API_URL || 'http://localhost:8000'
const WEB_BASE = __ENV.WEB_URL || 'http://localhost:5173'

// Dados de teste
const testUsers = [
  { username: 'loadtest1', password: 'LoadTest123!' },
  { username: 'loadtest2', password: 'LoadTest123!' },
  { username: 'loadtest3', password: 'LoadTest123!' },
  { username: 'loadtest4', password: 'LoadTest123!' },
  { username: 'loadtest5', password: 'LoadTest123!' },
]

const projectTemplates = [
  {
    name: 'Projeto Industrial A',
    description: 'Sistema de dosagem para indústria alimentícia',
    application: 'food_industry',
    barracao: {
      dimensions: { length: 40, width: 20, height: 8 },
      location: 'São Paulo, SP'
    }
  },
  {
    name: 'Projeto Químico B',
    description: 'Sistema de mistura para indústria química',
    application: 'chemical_industry',
    barracao: {
      dimensions: { length: 60, width: 30, height: 10 },
      location: 'Rio de Janeiro, RJ'
    }
  },
  {
    name: 'Projeto Farmacêutico C',
    description: 'Sistema de dosagem para indústria farmacêutica',
    application: 'pharmaceutical',
    barracao: {
      dimensions: { length: 30, width: 15, height: 6 },
      location: 'Belo Horizonte, MG'
    }
  }
]

// Função principal do teste
export default function() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)]
  
  // 1. Teste de autenticação
  const authStart = Date.now()
  const authResponse = authenticateUser(user)
  const authDuration = Date.now() - authStart
  authTime.add(authDuration)
  
  if (!authResponse.success) {
    errorRate.add(1)
    return
  }
  
  const token = authResponse.token
  const headers = { 'Authorization': `Bearer ${token}` }
  
  // 2. Teste de carregamento do catálogo
  const catalogStart = Date.now()
  const catalogSuccess = loadCatalog(headers)
  const catalogDuration = Date.now() - catalogStart
  catalogLoadTime.add(catalogDuration)
  
  if (!catalogSuccess) {
    errorRate.add(1)
    return
  }
  
  // 3. Teste de criação de projeto
  const projectStart = Date.now()
  const project = createProject(headers)
  const projectDuration = Date.now() - projectStart
  projectCreationTime.add(projectDuration)
  
  if (!project.success) {
    errorRate.add(1)
    return
  }
  
  // 4. Teste de adição de blocos
  const blocksSuccess = addBlocksToProject(headers, project.id)
  if (!blocksSuccess) {
    errorRate.add(1)
    return
  }
  
  // 5. Teste de geração de proposta
  const proposalSuccess = generateProposal(headers, project.id)
  if (!proposalSuccess) {
    errorRate.add(1)
    return
  }
  
  // 6. Teste de cálculo de preços
  const pricingSuccess = calculatePricing(headers, project.id)
  if (!pricingSuccess) {
    errorRate.add(1)
    return
  }
  
  // Pausa entre iterações
  sleep(Math.random() * 3 + 1) // 1-4 segundos
}

// Função de autenticação
function authenticateUser(user) {
  const loginPayload = {
    username: user.username,
    password: user.password
  }
  
  const response = http.post(`${API_BASE}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' }
  })
  
  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => {
      const body = JSON.parse(r.body)
      return body.access_token !== undefined
    }
  })
  
  if (!success) {
    console.error(`Login failed for user ${user.username}: ${response.status} ${response.body}`)
    return { success: false }
  }
  
  const body = JSON.parse(response.body)
  return { success: true, token: body.access_token }
}

// Função de carregamento do catálogo
function loadCatalog(headers) {
  const responses = http.batch([
    ['GET', `${API_BASE}/catalog/families`, null, { headers }],
    ['GET', `${API_BASE}/catalog/variants`, null, { headers }],
    ['GET', `${API_BASE}/catalog/connectors`, null, { headers }]
  ])
  
  const success = check(responses, {
    'families loaded': (r) => r[0].status === 200,
    'variants loaded': (r) => r[1].status === 200,
    'connectors loaded': (r) => r[2].status === 200,
  })
  
  if (!success) {
    console.error('Failed to load catalog')
  }
  
  return success
}

// Função de criação de projeto
function createProject(headers) {
  const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)]
  const projectData = {
    ...template,
    name: `${template.name} - ${Date.now()}` // Nome único
  }
  
  const response = http.post(`${API_BASE}/projects`, JSON.stringify(projectData), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
  
  const success = check(response, {
    'project creation status is 201': (r) => r.status === 201,
    'project creation response has id': (r) => {
      const body = JSON.parse(r.body)
      return body.project_id !== undefined
    }
  })
  
  if (!success) {
    console.error(`Project creation failed: ${response.status} ${response.body}`)
    return { success: false }
  }
  
  const body = JSON.parse(response.body)
  return { success: true, id: body.project_id }
}

// Função de adição de blocos
function addBlocksToProject(headers, projectId) {
  // Simular adição de 3-8 blocos
  const blockCount = Math.floor(Math.random() * 6) + 3
  const blocks = []
  
  for (let i = 0; i < blockCount; i++) {
    const blockData = {
      project_id: projectId,
      variant_id: getRandomVariantId(),
      position: {
        x: Math.random() * 20 - 10,
        y: 0,
        z: Math.random() * 20 - 10
      },
      tag: `EQ-${String(i + 1).padStart(3, '0')}`
    }
    
    blocks.push(['POST', `${API_BASE}/projects/${projectId}/blocks`, JSON.stringify(blockData), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    }])
  }
  
  const responses = http.batch(blocks)
  
  const success = check(responses, {
    'all blocks added successfully': (r) => r.every(resp => resp.status === 201)
  })
  
  if (!success) {
    console.error('Failed to add blocks to project')
  }
  
  return success
}

// Função de geração de proposta
function generateProposal(headers, projectId) {
  const proposalData = {
    project_id: projectId,
    template: 'standard',
    notes: 'Proposta gerada durante teste de carga'
  }
  
  const response = http.post(`${API_BASE}/proposals/generate`, JSON.stringify(proposalData), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
  
  const success = check(response, {
    'proposal generation status is 200': (r) => r.status === 200,
    'proposal has content': (r) => {
      const body = JSON.parse(r.body)
      return body.proposal !== undefined
    }
  })
  
  if (!success) {
    console.error(`Proposal generation failed: ${response.status} ${response.body}`)
  }
  
  return success
}

// Função de cálculo de preços
function calculatePricing(headers, projectId) {
  const response = http.get(`${API_BASE}/projects/${projectId}/pricing`, { headers })
  
  const success = check(response, {
    'pricing calculation status is 200': (r) => r.status === 200,
    'pricing has total': (r) => {
      const body = JSON.parse(r.body)
      return body.total_price !== undefined
    }
  })
  
  if (!success) {
    console.error(`Pricing calculation failed: ${response.status} ${response.body}`)
  }
  
  return success
}

// Função auxiliar para obter ID de variante aleatória
function getRandomVariantId() {
  const variantIds = [
    'variant-dg-100',
    'variant-dg-200',
    'variant-mix-500',
    'variant-mix-1000',
    'variant-elev-canecas',
    'variant-transp-helicoidal'
  ]
  
  return variantIds[Math.floor(Math.random() * variantIds.length)]
}

// Teste de stress específico para endpoints críticos
export function stressTest() {
  const options = {
    stages: [
      { duration: '1m', target: 500 },  // Ramp up rápido
      { duration: '5m', target: 500 },  // Manter carga alta
      { duration: '1m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<5000'], // Mais tolerante durante stress
      errors: ['rate<0.10'], // 10% de erro aceitável durante stress
    }
  }
  
  return function() {
    // Focar apenas nos endpoints mais críticos
    const responses = http.batch([
      ['GET', `${API_BASE}/catalog/families`],
      ['GET', `${API_BASE}/catalog/variants`],
      ['GET', `${API_BASE}/health`],
    ])
    
    check(responses, {
      'catalog endpoints responding': (r) => r.every(resp => resp.status < 500)
    })
    
    sleep(0.1) // Pausa mínima para stress máximo
  }
}

// Teste de pico de carga
export function spikeTest() {
  const options = {
    stages: [
      { duration: '30s', target: 10 },   // Baseline
      { duration: '10s', target: 1000 }, // Pico súbito
      { duration: '30s', target: 1000 }, // Manter pico
      { duration: '10s', target: 10 },   // Volta ao baseline
    ],
    thresholds: {
      http_req_duration: ['p(95)<10000'], // Muito tolerante durante pico
      errors: ['rate<0.20'], // 20% de erro aceitável durante pico
    }
  }
  
  return function() {
    const response = http.get(`${API_BASE}/health`)
    
    check(response, {
      'health check responding': (r) => r.status < 500
    })
    
    sleep(0.05) // Pausa mínima para pico máximo
  }
}

// Teste de volume de dados
export function volumeTest() {
  const options = {
    stages: [
      { duration: '5m', target: 50 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<3000'],
      errors: ['rate<0.05'],
    }
  }
  
  return function() {
    const user = testUsers[0] // Usar sempre o mesmo usuário
    const authResponse = authenticateUser(user)
    
    if (!authResponse.success) return
    
    const headers = { 'Authorization': `Bearer ${authResponse.token}` }
    
    // Criar projeto com muitos blocos
    const project = createProject(headers)
    if (!project.success) return
    
    // Adicionar 50 blocos
    const blocks = []
    for (let i = 0; i < 50; i++) {
      blocks.push(['POST', `${API_BASE}/projects/${project.id}/blocks`, JSON.stringify({
        project_id: project.id,
        variant_id: getRandomVariantId(),
        position: { x: i % 10, y: 0, z: Math.floor(i / 10) },
        tag: `EQ-${String(i + 1).padStart(3, '0')}`
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      }])
    }
    
    const responses = http.batch(blocks)
    
    check(responses, {
      'large project created successfully': (r) => r.every(resp => resp.status === 201)
    })
    
    sleep(1)
  }
}

// Configuração para diferentes tipos de teste
export { stressTest, spikeTest, volumeTest }
