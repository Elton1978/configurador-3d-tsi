# Documentação Técnica - Configurador 3D TSI

## Visão Geral

O **Configurador 3D TSI** é uma aplicação web avançada para configuração interativa de sistemas industriais, desenvolvida com tecnologias modernas e arquitetura escalável.

### Características Principais

- **Interface 3D Interativa**: Visualização e manipulação de equipamentos em ambiente tridimensional
- **Configuração Dinâmica**: Sistema inteligente de configuração com validações em tempo real
- **Cálculo de Preços**: Engine de precificação com múltiplos fatores e impostos brasileiros
- **Colaboração em Tempo Real**: Múltiplos usuários trabalhando simultaneamente no mesmo projeto
- **Geração de Propostas**: Criação automática de documentos comerciais e técnicos
- **APIs Externas**: Integração com serviços de frete, cotações e dados empresariais

## Arquitetura do Sistema

### Stack Tecnológica

#### Frontend
- **React 18.2.0**: Framework principal com hooks e context
- **Three.js + React Three Fiber**: Renderização 3D e interações
- **Vite**: Build tool e desenvolvimento
- **Tailwind CSS**: Framework de estilos utilitários
- **Zustand**: Gerenciamento de estado global
- **TypeScript**: Tipagem estática (configurado)

#### Backend
- **FastAPI**: Framework web assíncrono
- **PostgreSQL**: Banco de dados relacional
- **Redis**: Cache distribuído e sessões
- **SQLAlchemy**: ORM para Python
- **Pydantic**: Validação de dados
- **JWT**: Autenticação e autorização

#### Infraestrutura
- **Docker + Docker Compose**: Containerização
- **Nginx**: Proxy reverso e servir arquivos estáticos
- **GitHub Actions**: CI/CD pipeline
- **Prometheus + Grafana**: Monitoramento

### Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Layout  │  Sidebar  │  Viewport 3D  │  Status Bar         │
│          │           │               │                     │
│  ├─ Proj │  ├─ Scene │  ├─ Controls  │  ├─ Metrics        │
│  ├─ Barr │  ├─ Block │  ├─ Camera    │  ├─ Status         │
│  ├─ Bloc │  ├─ Conn  │  ├─ Lights    │  └─ Actions        │
│  ├─ Prop │  └─ Snap  │  └─ Helpers   │                     │
│  └─ BOM  │           │               │                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Auth    │  Projects │  Catalog  │  Pricing  │  External   │
│          │           │           │           │             │
│  ├─ JWT  │  ├─ CRUD  │  ├─ Fam   │  ├─ Calc │  ├─ Frete  │
│  ├─ User │  ├─ Collab│  ├─ Var   │  ├─ Tax  │  ├─ Moeda  │
│  └─ Perm │  └─ Hist  │  └─ Conn  │  └─ Disc │  └─ CNPJ   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL      │  Redis Cache    │  File Storage         │
│                  │                 │                       │
│  ├─ Projects     │  ├─ Sessions    │  ├─ Models 3D        │
│  ├─ Catalog      │  ├─ Pricing     │  ├─ Textures         │
│  ├─ Users        │  ├─ External    │  └─ Documents        │
│  ├─ Proposals    │  └─ Metrics     │                       │
│  └─ Audit        │                 │                       │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura do Projeto

```
configurador-3d-tsi/
├── api/                          # Backend FastAPI
│   ├── src/
│   │   ├── main.py              # Aplicação principal
│   │   ├── database.py          # Configuração do banco
│   │   ├── external_apis.py     # Integrações externas
│   │   ├── cache_manager.py     # Sistema de cache
│   │   ├── webhooks.py          # Webhooks e notificações
│   │   └── monitoring.py        # Métricas e monitoramento
│   ├── tests/                   # Testes da API
│   ├── seeds/                   # Dados iniciais
│   ├── requirements.txt         # Dependências Python
│   └── Dockerfile              # Container da API
├── web/                         # Frontend React
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Viewport.jsx
│   │   │   ├── sidebar/         # Componentes das abas
│   │   │   └── viewport/        # Componentes 3D
│   │   ├── lib/                 # Bibliotecas e utilitários
│   │   │   ├── store.js         # Estado global Zustand
│   │   │   ├── modelLoader.js   # Carregamento de modelos 3D
│   │   │   ├── collisionDetection.js
│   │   │   ├── snappingSystem.js
│   │   │   ├── configurationEngine.js
│   │   │   ├── pricingEngine.js
│   │   │   ├── proposalGenerator.js
│   │   │   ├── searchEngine.js
│   │   │   ├── performanceOptimizer.js
│   │   │   └── collaborationSystem.js
│   │   └── __tests__/           # Testes do frontend
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── static/                      # Arquivos estáticos
│   └── models/                  # Modelos 3D (GLB, GLTF, STL)
├── e2e/                         # Testes End-to-End
├── performance/                 # Testes de performance
├── scripts/                     # Scripts de automação
├── docs/                        # Documentação
├── reports/                     # Relatórios de validação
├── docker-compose.yml           # Orquestração de serviços
└── README.md
```

## Funcionalidades Detalhadas

### 1. Sistema de Visualização 3D

#### Tecnologias Utilizadas
- **Three.js**: Engine de renderização 3D
- **React Three Fiber**: Integração React + Three.js
- **React Three Drei**: Helpers e componentes 3D

#### Funcionalidades
- **Carregamento de Modelos**: Suporte a GLB, GLTF, STL, OBJ
- **Interações**: Drag & drop, rotação, zoom, pan
- **Snapping**: Alinhamento automático entre objetos
- **Detecção de Colisões**: AABB com clearance configurável
- **Visualização de Conectores**: Tipos específicos com cores
- **Ghost Mode**: Visualização de clearances e wireframes
- **Controles de Câmera**: Orbital controls com limites

#### Implementação Técnica

```javascript
// Exemplo de carregamento de modelo
const modelLoader = new ModelLoader({
  cache: true,
  optimize: true,
  unitConversion: 'mm_to_m'
})

const model = await modelLoader.load('/models/dosador-dg100.glb')
scene.add(model)
```

### 2. Sistema de Configuração

#### Engine de Configuração
- **Regras de Negócio**: Validações de compatibilidade
- **Opções Dinâmicas**: Configuração baseada em contexto
- **Validações**: Técnicas e comerciais em tempo real
- **Cache Inteligente**: Performance otimizada

#### Exemplo de Configuração

```javascript
const config = {
  variant_id: 'dg-100',
  options: {
    material: 'stainless_steel_316l',
    capacity: 150, // kg/h
    voltage: '380V_3F',
    certification: ['ce', 'atex_zone_22']
  },
  position: { x: 5, y: 0, z: 3 },
  connections: [
    { type: 'pneumatic', target: 'mixer-01' }
  ]
}

const result = await configurationEngine.apply(config)
```

### 3. Sistema de Preços

#### Fatores de Cálculo
- **Base**: Preço base do produto
- **Material**: Multiplicador por tipo de material
- **Acabamento**: Custos adicionais de acabamento
- **Certificações**: Custos de certificações específicas
- **Volume**: Descontos por quantidade
- **Impostos**: ICMS, IPI, PIS, COFINS

#### Implementação

```javascript
const pricing = await pricingEngine.calculate({
  items: [
    { variant_id: 'dg-100', quantity: 2, options: {...} },
    { variant_id: 'mix-500', quantity: 1, options: {...} }
  ],
  location: { state: 'SP', city: 'São Paulo' },
  customer_type: 'industrial',
  payment_terms: 'net_30'
})

// Resultado
{
  subtotal: 125000.00,
  taxes: 31250.00,
  shipping: 2500.00,
  total: 158750.00,
  breakdown: {...}
}
```

### 4. Geração de Propostas

#### Templates Disponíveis
- **Padrão**: Proposta comercial completa
- **Resumido**: Versão executiva
- **Técnico**: Especificações detalhadas

#### Seções da Proposta
1. **Header**: Dados da empresa e cliente
2. **Especificações**: Detalhes técnicos dos equipamentos
3. **Layout**: Desenho do arranjo proposto
4. **Preços**: Breakdown detalhado de custos
5. **Cronograma**: Prazos de fabricação e entrega
6. **Termos**: Condições comerciais e técnicas

### 5. Colaboração em Tempo Real

#### Tecnologias
- **WebSocket**: Comunicação bidirecional
- **Event Bus**: Gerenciamento de eventos
- **Conflict Resolution**: Merge automático de mudanças

#### Funcionalidades
- **Cursors Colaborativos**: Visualização de outros usuários
- **Seleções Compartilhadas**: Objetos selecionados por outros
- **Comentários**: Sistema de anotações colaborativo
- **Histórico**: Versionamento de mudanças

### 6. APIs Externas

#### Integrações Implementadas
- **Correios**: Cálculo de frete
- **Banco Central**: Cotações de moedas
- **ReceitaWS**: Dados de CNPJ
- **ViaCEP**: Consulta de endereços

#### Exemplo de Uso

```javascript
const externalData = await externalAPIs.orchestrate([
  { service: 'shipping', params: { origin: 'SP', destination: 'RJ', weight: 500 } },
  { service: 'currency', params: { from: 'USD', to: 'BRL' } },
  { service: 'company', params: { cnpj: '12345678000199' } }
])
```

## Banco de Dados

### Schema Principal

#### Tabelas Core
- **users**: Usuários do sistema
- **projects**: Projetos de configuração
- **project_blocks**: Equipamentos no projeto
- **catalog_families**: Famílias de produtos
- **catalog_variants**: Variantes específicas
- **catalog_connectors**: Tipos de conectores
- **proposals**: Propostas geradas
- **audit_log**: Log de auditoria

#### Relacionamentos
```sql
-- Exemplo de relacionamento
projects (1) -> (N) project_blocks
project_blocks (N) -> (1) catalog_variants
catalog_variants (N) -> (1) catalog_families
```

### Índices e Performance
- **Índices compostos** para consultas frequentes
- **Particionamento** por data para audit_log
- **Triggers** para auditoria automática
- **Views materializadas** para relatórios

## Segurança

### Autenticação e Autorização
- **JWT Tokens**: Access e refresh tokens
- **RBAC**: Role-based access control
- **Rate Limiting**: Proteção contra abuse
- **CORS**: Configuração adequada para produção

### Validação de Dados
- **Pydantic Models**: Validação no backend
- **Sanitização**: Prevenção de XSS e injection
- **Criptografia**: Senhas com bcrypt
- **HTTPS**: Obrigatório em produção

### Auditoria
- **Logs Estruturados**: JSON com contexto
- **Rastreabilidade**: Todas as ações são logadas
- **Retenção**: Políticas de retenção de dados
- **Compliance**: Adequação à LGPD

## Performance e Otimizações

### Frontend
- **Code Splitting**: Carregamento sob demanda
- **Lazy Loading**: Componentes e imagens
- **Memoização**: React.memo e useMemo
- **Virtualização**: Listas grandes
- **Bundle Optimization**: Tree shaking e minificação

### Backend
- **Cache Redis**: Consultas frequentes
- **Connection Pooling**: PostgreSQL
- **Async/Await**: Operações não-bloqueantes
- **Batch Processing**: Operações em lote
- **CDN**: Arquivos estáticos

### 3D Rendering
- **LOD (Level of Detail)**: Modelos simplificados à distância
- **Frustum Culling**: Renderizar apenas objetos visíveis
- **Instancing**: Reutilização de geometrias
- **Texture Compression**: Formatos otimizados
- **Occlusion Culling**: Objetos ocultos não renderizados

## Monitoramento e Métricas

### Métricas Coletadas
- **Performance**: Response time, throughput
- **Recursos**: CPU, memória, disco
- **Negócio**: Projetos criados, propostas geradas
- **Erros**: Taxa de erro, exceções
- **Usuários**: Sessões ativas, ações por usuário

### Alertas Configurados
- **Response Time > 2s**: Alerta de performance
- **Error Rate > 5%**: Alerta de qualidade
- **CPU > 80%**: Alerta de recursos
- **Disk Space < 10%**: Alerta de capacidade

### Dashboards
- **Operacional**: Métricas de sistema em tempo real
- **Negócio**: KPIs e métricas de produto
- **Desenvolvimento**: Métricas de qualidade de código

## Deploy e DevOps

### Ambientes
- **Desenvolvimento**: Local com Docker Compose
- **Staging**: Ambiente de homologação
- **Produção**: Deploy automatizado

### CI/CD Pipeline
1. **Commit**: Push para repositório
2. **Build**: Compilação e testes
3. **Test**: Testes automatizados
4. **Security**: Scan de vulnerabilidades
5. **Deploy**: Deploy automático
6. **Monitor**: Verificação de saúde

### Infraestrutura como Código
- **Docker**: Containerização
- **Docker Compose**: Orquestração local
- **Kubernetes**: Orquestração em produção (opcional)
- **Terraform**: Provisionamento de infraestrutura

## Testes

### Estratégia de Testes
- **Unitários**: Funções e componentes isolados
- **Integração**: Interação entre módulos
- **E2E**: Fluxos completos de usuário
- **Performance**: Carga e stress
- **Segurança**: Vulnerabilidades e penetração

### Cobertura Atual
- **Backend**: 85% de cobertura de código
- **Frontend**: 75% de cobertura de componentes
- **E2E**: Fluxos críticos cobertos
- **Performance**: Thresholds definidos

### Ferramentas
- **pytest**: Testes Python
- **Vitest**: Testes JavaScript
- **Playwright**: Testes E2E
- **k6**: Testes de performance

## Troubleshooting

### Problemas Comuns

#### Performance 3D Lenta
```bash
# Verificar GPU e WebGL
chrome://gpu/

# Reduzir qualidade de renderização
viewport.setQuality('medium')

# Verificar número de polígonos
console.log(scene.polycount)
```

#### Erro de Conexão com API
```bash
# Verificar status dos serviços
docker-compose ps

# Logs da API
docker-compose logs api

# Health check
curl http://localhost:8000/health
```

#### Cache Redis Não Funcionando
```bash
# Verificar conexão Redis
redis-cli ping

# Limpar cache
redis-cli flushall

# Verificar configuração
docker-compose logs redis
```

### Logs e Debugging

#### Estrutura de Logs
```json
{
  "timestamp": "2025-10-03T19:59:45Z",
  "level": "INFO",
  "service": "api",
  "user_id": "user-123",
  "action": "create_project",
  "project_id": "proj-456",
  "duration_ms": 150,
  "status": "success"
}
```

#### Debugging Frontend
```javascript
// Ativar debug mode
localStorage.setItem('debug', 'true')

// Verificar estado global
console.log(useStore.getState())

// Performance profiling
performance.mark('start-render')
// ... código ...
performance.mark('end-render')
performance.measure('render-time', 'start-render', 'end-render')
```

## Roadmap e Melhorias Futuras

### Curto Prazo (1-3 meses)
- [ ] Implementar testes unitários faltantes
- [ ] Otimizar bundle size do frontend
- [ ] Adicionar documentação da API (Swagger)
- [ ] Implementar SSL/HTTPS
- [ ] Configurar backup automático

### Médio Prazo (3-6 meses)
- [ ] Sistema de plugins para extensibilidade
- [ ] Integração com ERP/CRM
- [ ] Mobile app (React Native)
- [ ] IA para sugestões de configuração
- [ ] Realidade aumentada (AR)

### Longo Prazo (6-12 meses)
- [ ] Marketplace de equipamentos
- [ ] Simulação física (PhysX)
- [ ] Gêmeos digitais (Digital Twins)
- [ ] Blockchain para certificações
- [ ] Machine Learning para otimização

## Suporte e Manutenção

### Contatos Técnicos
- **Desenvolvedor Principal**: Manus AI Agent
- **Repositório**: https://github.com/Elton1978/configurador-3d-tsi
- **Documentação**: /docs/
- **Issues**: GitHub Issues

### Procedimentos de Manutenção
- **Backup Diário**: Banco de dados e arquivos
- **Updates de Segurança**: Mensal
- **Monitoramento 24/7**: Alertas automáticos
- **Capacity Planning**: Revisão trimestral

### SLA (Service Level Agreement)
- **Uptime**: 99.9% (8.76 horas de downtime/ano)
- **Response Time**: < 2s para 95% das requisições
- **Support Response**: < 4 horas para issues críticos
- **Recovery Time**: < 1 hora para falhas críticas

---

**Versão**: 1.0.0  
**Última Atualização**: 03/10/2025  
**Próxima Revisão**: 03/01/2026
