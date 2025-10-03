# Configurador 3D TSI

Sistema de configuração de equipamentos industriais TSI com visualização 3D interativa, otimização automática de layout e geração de orçamentos.

## 🎯 Visão Geral

O Configurador 3D TSI é uma aplicação web que permite ao time Comercial e de Engenharia da LS DO BRASIL compor sistemas TSI usando blocos modulares (peças/células como LEGO) a partir de um catálogo completo. O sistema oferece:

- **Visualização 3D Interativa**: Interface Three.js com snapping automático e detecção de colisões
- **Auto-Propostas Inteligentes**: 3 estratégias de otimização (Desempenho, Ajuste ao Local, Menor Custo)
- **Configuração Paramétrica**: Ajustes por bloco com flag para desenvolvimento especial
- **Barracão Virtual**: Ambiente 3D (L×W×H) com checagem de clearances e cotas mínimas
- **Gestão de Cenários**: Salvar, versionar e comparar diferentes configurações
- **Exportação Completa**: BOM, orçamento e modelos 3D em PDF/XLSX/GLB

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| **Frontend** | React + Vite | 18.x |
| **Visualização 3D** | Three.js | Latest |
| **Estado Global** | Zustand | Latest |
| **Estilização** | Tailwind CSS | 3.x |
| **Backend** | Python FastAPI | 0.104+ |
| **Banco de Dados** | PostgreSQL | 15+ |
| **Cache & Jobs** | Redis | 7+ |
| **Containerização** | Docker Compose | 3.8 |

## 🚀 Setup Rápido (1 Comando)

```bash
# Clone o repositório
git clone https://github.com/Elton1978/configurador-3d-tsi.git
cd configurador-3d-tsi

# Inicie todos os serviços
docker-compose up -d

# Aguarde ~30 segundos para inicialização completa
# Acesse: http://localhost:5173 (Frontend)
# API: http://localhost:8000 (Backend + Docs)
```

### Credenciais de Desenvolvimento

- **PostgreSQL**: `postgres:postgres@localhost:5432/configurador_tsi`
- **Redis**: `localhost:6379`
- **API Docs**: http://localhost:8000/docs

## 📁 Estrutura do Projeto

```
configurador-3d-tsi/
├── api/                    # Backend FastAPI
│   ├── src/
│   │   ├── main.py        # Aplicação principal
│   │   ├── database.py    # Configuração do banco
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── routers/       # Endpoints da API
│   │   └── services/      # Lógica de negócio
│   ├── seeds/             # Dados iniciais
│   ├── tests/             # Testes unitários
│   ├── Dockerfile
│   └── requirements.txt
├── web/                   # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários
│   │   └── assets/        # Assets estáticos
│   ├── Dockerfile
│   └── package.json
├── static/                # Modelos 3D (GLB/GLTF)
├── docker-compose.yml     # Orquestração
└── README.md
```

## 🗄️ Modelo de Dados

### Tabelas Principais

- **`block_family`**: Famílias de equipamentos (Dosador, Misturador, etc.)
- **`block_variant`**: Variantes específicas com parâmetros e preços
- **`connector`**: Pontos de conexão para snapping 3D
- **`constraint_rule`**: Regras de otimização (hard/soft constraints)
- **`project`**: Projetos de configuração
- **`project_block`**: Instâncias de blocos em projetos
- **`project_quote`**: Orçamentos e propostas geradas

### Catálogo Inicial (Seed Data)

O sistema vem pré-populado com:
- **8 Famílias** de equipamentos
- **14 Variantes** com especificações completas
- **18 Conectores** para snapping automático
- **7 Regras** de otimização e restrição
- **1 Projeto** de demonstração

## 🧮 Lógica de Otimização

### Restrições (Constraints)

**Hard Constraints** (Violação = 0):
- Detecção de colisão (AABB)
- Limites do barracão
- Incompatibilidade de conectores
- Limites de potência elétrica

**Soft Constraints** (Otimização):
- Clearances de manutenção (1.5m mínimo)
- Rotas de acesso
- Comprimento de linhas
- Custo total do sistema

### Algoritmo de Otimização

1. **Geração Inicial**: Layout em grid estruturado
2. **Busca Local**: Simulated Annealing para refinamento
3. **Avaliação Multi-Objetivo**: Custo, Desempenho, Área Ocupada
4. **Saída**: 3 propostas com KPIs detalhados

## 🎨 Interface do Usuário

### Layout Principal

- **Sidebar Esquerda**: Projeto, Barracão, Requisitos, Catálogo, Propostas, BOM
- **Viewport 3D Central**: Visualização interativa com snapping
- **Painel Direito**: Propriedades do bloco selecionado
- **Barra Inferior**: Controles rápidos e status

### Funcionalidades 3D

- **Snapping Automático**: Baseado em `connector.type`
- **Medição de Distâncias**: Ferramenta de medição integrada
- **Ghost Mode**: Visualização de clearances de manutenção
- **LOD (Level of Detail)**: Otimização para 50+ blocos (FPS > 40)

## 📊 KPIs e Relatórios

Cada proposta gerada apresenta:

| KPI | Descrição | Unidade |
|-----|-----------|---------|
| **Capacidade** | Throughput do sistema | t/h |
| **Eficiência** | Eficiência energética média | % |
| **Área Ocupada** | Footprint no barracão | m² |
| **Custo Total** | Investimento necessário | R$ |
| **Violações** | Restrições não atendidas | count (deve ser 0) |

## 🔒 Segurança e Controle

- **RBAC**: Admin, Engenharia, Comercial, Viewer
- **Versionamento**: Histórico completo de projetos
- **Auditoria**: Log de decisões do solver
- **Autenticação**: OIDC (preparado para integração)

## 🧪 Testes e Validação

### Critérios de Aceite (MVP)

✅ **Fluxo Principal**:
1. Criar projeto → Importar barracão → Gerar 3 propostas
2. Escolher proposta → Validar 0 colisões → Exportar PDF/XLSX
3. Performance: 50+ blocos com FPS > 40

✅ **Cobertura de Negócio**:
- ≥80% dos casos atendidos sem "desenvolvimento especial"
- Parametrizações existentes suficientes

### Comandos de Teste

```bash
# Testes unitários (API)
cd api && python -m pytest tests/

# Testes de integração
docker-compose exec api python -m pytest tests/integration/

# Teste E2E (demonstração)
cd web && npm run test:e2e
```

## 📦 Exportação e Integração

### Formatos Suportados

- **PDF**: Orçamento completo com layout 3D
- **XLSX**: Bill of Materials (BOM) detalhado
- **GLB**: Modelo 3D para visualização externa

### Integrações Futuras (Post-MVP)

- **Webhooks**: `project.created`, `proposal.generated`, `special.requested`
- **CRM**: Envio automático de PDFs
- **n8n**: Criação de tarefas de follow-up

## 🔄 Próximos Passos

### Backlog Prioritário

1. **Otimização 2.0**: Algoritmos genéticos para layouts complexos
2. **KPIs Avançados**: Análise de fluxo e gargalos
3. **Integração CRM**: Sincronização bidirecional
4. **Mobile**: Visualização em tablets para campo
5. **AR/VR**: Visualização imersiva do layout

### Limitações Conhecidas

- Modelos 3D são placeholders (aguardando assets reais)
- Algoritmo de otimização é heurístico (não garante ótimo global)
- Autenticação OIDC não implementada (mock para desenvolvimento)

## 📞 Suporte

Para questões técnicas ou sugestões:
- **Issues**: https://github.com/Elton1978/configurador-3d-tsi/issues
- **Documentação**: http://localhost:8000/docs (API)
- **Demo**: http://localhost:5173 (Interface)

---

**Desenvolvido com ❤️ pela equipe LS DO BRASIL**
