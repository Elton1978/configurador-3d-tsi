# Manual do Usuário - Configurador 3D TSI

## Bem-vindo ao Configurador 3D TSI

O **Configurador 3D TSI** é uma ferramenta avançada para configuração interativa de sistemas industriais. Este manual irá guiá-lo através de todas as funcionalidades da plataforma.

## Primeiros Passos

### 1. Acesso à Plataforma

#### Registro de Conta
1. Acesse a plataforma através do navegador
2. Clique em **"Criar Conta"**
3. Preencha os dados solicitados:
   - Nome completo
   - Email corporativo
   - Senha segura (mín. 8 caracteres)
   - Empresa/Organização
4. Confirme o email recebido
5. Faça login com suas credenciais

#### Login
1. Clique em **"Entrar"**
2. Digite seu email e senha
3. Clique em **"Acessar Plataforma"**

### 2. Interface Principal

A interface é dividida em 4 áreas principais:

```
┌─────────────────────────────────────────────────────────┐
│                    Header (Topo)                        │
├─────────────┬───────────────────────────┬───────────────┤
│             │                           │               │
│   Sidebar   │      Viewport 3D          │   Painel      │
│  (Esquerda) │       (Centro)            │  (Direita)    │
│             │                           │               │
├─────────────┴───────────────────────────┴───────────────┤
│                  Status Bar (Rodapé)                    │
└─────────────────────────────────────────────────────────┘
```

#### Header
- **Logo**: Retorna à página inicial
- **Menu do Usuário**: Perfil, configurações, logout
- **Notificações**: Alertas e atualizações
- **Busca Global**: Pesquisa em todo o sistema

#### Sidebar (Barra Lateral)
Contém 5 abas principais:
- 📋 **Projeto**: Configurações gerais
- 🏭 **Barracão**: Dimensões e layout
- 🔧 **Blocos**: Catálogo de equipamentos
- 📊 **Propostas**: Geração de orçamentos
- 💰 **BOM/Preço**: Lista de materiais e custos

#### Viewport 3D (Área Central)
- Visualização tridimensional do projeto
- Controles de navegação (zoom, rotação, pan)
- Ferramentas de medição e anotação
- Grid de referência configurável

#### Status Bar (Rodapé)
- Status da conexão
- Usuários ativos no projeto
- Informações do projeto atual
- Atalhos de teclado

## Criando Seu Primeiro Projeto

### 1. Novo Projeto

1. Clique no botão **"+ Novo Projeto"**
2. Preencha as informações básicas:

#### Dados do Projeto
- **Nome**: Identificação do projeto
- **Descrição**: Detalhes e objetivos
- **Aplicação**: Tipo de indústria
  - Alimentícia
  - Química
  - Farmacêutica
  - Mineração
  - Outros
- **Cliente**: Empresa/contato
- **Data de Entrega**: Prazo estimado

#### Configurações Técnicas
- **Normas Aplicáveis**: CE, ATEX, FDA, etc.
- **Ambiente**: Interno/Externo
- **Temperatura**: Faixa operacional
- **Umidade**: Condições ambientais

3. Clique em **"Criar Projeto"**

### 2. Configuração do Barracão

Na aba **🏭 Barracão**:

#### Dimensões
- **Comprimento**: Metros (ex: 40m)
- **Largura**: Metros (ex: 20m)
- **Altura**: Metros (ex: 8m)
- **Pé-direito**: Altura útil

#### Características
- **Tipo de Piso**: Concreto, epóxi, etc.
- **Estrutura**: Metálica, concreto
- **Cobertura**: Telha, laje
- **Ventilação**: Natural, forçada

#### Utilidades Disponíveis
- ⚡ **Energia Elétrica**: 220V, 380V, 440V
- 💨 **Ar Comprimido**: Pressão disponível
- 💧 **Água**: Industrial, potável
- 🔥 **Vapor**: Pressão e temperatura
- ❄️ **Água Gelada**: Temperatura

#### Localização
- **Endereço**: Para cálculo de frete
- **CEP**: Código postal
- **Cidade/Estado**: Localização
- **Coordenadas**: GPS (opcional)

### 3. Visualização 3D

O viewport 3D permite:

#### Navegação
- **Mouse**: Clique e arraste para rotacionar
- **Scroll**: Zoom in/out
- **Shift + Clique**: Pan (mover vista)
- **Duplo Clique**: Focar no objeto

#### Controles da Câmera
- 🎯 **Focar**: Centraliza a vista
- 🏠 **Home**: Vista inicial
- 📐 **Vistas**: Frontal, lateral, superior
- 📏 **Medição**: Ferramenta de medidas

#### Configurações de Visualização
- ⚏ **Grid**: Mostrar/ocultar grade
- 🔌 **Conectores**: Visualizar pontos de conexão
- 👻 **Ghost Mode**: Transparência para análise
- 🌅 **Iluminação**: Ajustar ambiente

## Adicionando Equipamentos

### 1. Catálogo de Equipamentos

Na aba **🔧 Blocos**, você encontra:

#### Famílias de Produtos
- **Dosadores Gravimétricos**: DG-50, DG-100, DG-200
- **Misturadores Industriais**: MIX-500, MIX-1000, MIX-2000
- **Elevadores de Canecas**: EC-100, EC-200
- **Transportadores**: Helicoidais, correias
- **Silos e Tanques**: Diversos volumes
- **Sistemas de Filtragem**: Mangas, ciclones

#### Informações do Produto
Para cada equipamento:
- 📸 **Imagens**: Fotos e renders 3D
- 📋 **Especificações**: Técnicas detalhadas
- 💰 **Preço Base**: Valor de referência
- ⚙️ **Opções**: Customizações disponíveis
- 📐 **Dimensões**: Comprimento x Largura x Altura
- ⚖️ **Peso**: Operacional e vazio

### 2. Adicionando ao Projeto

#### Método 1: Drag & Drop
1. Selecione o equipamento no catálogo
2. Arraste para o viewport 3D
3. Posicione no local desejado
4. Solte para confirmar

#### Método 2: Clique Duplo
1. Dê duplo clique no equipamento
2. Ele será adicionado automaticamente
3. Use as ferramentas para reposicionar

### 3. Configuração de Equipamentos

Após adicionar um equipamento:

#### Posicionamento
- **Coordenadas X, Y, Z**: Posição exata
- **Rotação**: Orientação em graus
- **Elevação**: Altura do piso
- **Ancoragem**: Tipo de fixação

#### Opções Técnicas
- **Material**: Aço carbono, inox 304/316L
- **Acabamento**: Pintura, polimento
- **Capacidade**: Ajuste conforme necessidade
- **Potência**: Motor adequado
- **Voltagem**: Conforme disponível

#### Certificações
- ✅ **CE**: Conformidade Europeia
- 🔥 **ATEX**: Atmosferas explosivas
- 🏥 **FDA**: Uso alimentício/farmacêutico
- 📋 **ISO**: Normas de qualidade

### 4. Sistema de Snapping

O sistema de encaixe automático facilita o posicionamento:

#### Tipos de Snap
- **Grid**: Alinha à grade de referência
- **Conectores**: Encaixa em pontos de conexão
- **Bordas**: Alinha com bordas de outros equipamentos
- **Centro**: Centraliza com outros objetos

#### Configurações
- **Tolerância**: Distância para ativação (padrão: 0.5m)
- **Tipos Ativos**: Quais snaps estão habilitados
- **Feedback Visual**: Indicadores de encaixe

## Conexões e Tubulações

### 1. Tipos de Conectores

#### Elétricos ⚡
- **Força**: Alimentação principal
- **Comando**: Sinais de controle
- **Instrumentação**: Sensores e medidores

#### Pneumáticos 💨
- **Ar de Processo**: Transporte pneumático
- **Ar de Instrumentos**: Controle e automação
- **Vácuo**: Sistemas de aspiração

#### Hidráulicos 💧
- **Água Industrial**: Resfriamento, limpeza
- **Água Potável**: Processos alimentícios
- **Efluentes**: Descarte controlado

#### Processo 🔄
- **Material Sólido**: Pós, grânulos
- **Material Líquido**: Soluções, suspensões
- **Gases**: Ar, nitrogênio, CO2

### 2. Criando Conexões

#### Automática
1. Aproxime dois equipamentos compatíveis
2. O sistema detecta conectores próximos
3. Conexão é criada automaticamente
4. Tubulação é roteada otimamente

#### Manual
1. Clique no conector de origem
2. Arraste até o conector de destino
3. Selecione o tipo de conexão
4. Configure parâmetros da tubulação

### 3. Roteamento de Tubulações

#### Configurações
- **Material**: Aço, PVC, inox
- **Diâmetro**: Conforme vazão
- **Isolamento**: Térmico, acústico
- **Suportes**: Espaçamento e tipo

#### Validações Automáticas
- ✅ **Compatibilidade**: Tipos de fluidos
- ✅ **Pressão**: Limites operacionais
- ✅ **Temperatura**: Faixas adequadas
- ✅ **Clearance**: Espaços mínimos

## Análise e Validação

### 1. Detecção de Colisões

O sistema verifica automaticamente:

#### Tipos de Colisão
- 🔴 **Crítica**: Sobreposição física
- 🟡 **Aviso**: Clearance insuficiente
- 🔵 **Informação**: Proximidade

#### Clearances Padrão
- **Manutenção**: 1.5m mínimo
- **Operação**: 0.8m mínimo
- **Segurança**: 2.0m para equipamentos críticos
- **Acesso**: Corredores de 1.2m

### 2. Validações Técnicas

#### Estrutural
- **Cargas**: Peso dos equipamentos
- **Fundações**: Necessidade de reforços
- **Vibrações**: Isolamento necessário

#### Utilidades
- **Demanda Elétrica**: Potência total
- **Consumo de Ar**: Vazão necessária
- **Água de Resfriamento**: Capacidade

#### Processo
- **Balanço de Massa**: Entradas vs saídas
- **Capacidades**: Gargalos identificados
- **Sequenciamento**: Ordem operacional

### 3. Relatórios de Análise

#### Relatório de Colisões
- Lista de interferências encontradas
- Classificação por criticidade
- Sugestões de correção
- Impacto no cronograma

#### Relatório de Utilidades
- Demanda total por tipo
- Pontos de conexão necessários
- Dimensionamento de alimentações
- Custos estimados de instalação

## Geração de Propostas

### 1. Configuração da Proposta

Na aba **📊 Propostas**:

#### Dados do Cliente
- **Empresa**: Razão social
- **CNPJ**: Para cálculo de impostos
- **Contato**: Responsável técnico
- **Endereço**: Para frete e instalação

#### Configurações Comerciais
- **Condições de Pagamento**: À vista, parcelado
- **Prazo de Entrega**: Cronograma detalhado
- **Garantia**: Período e cobertura
- **Assistência Técnica**: Incluída/opcional

### 2. Templates de Proposta

#### Padrão (Comercial)
- Apresentação da empresa
- Especificações resumidas
- Preços e condições
- Cronograma básico

#### Técnico (Detalhado)
- Especificações completas
- Desenhos e layouts
- Análises técnicas
- Procedimentos de instalação

#### Executivo (Resumido)
- Resumo do projeto
- Investimento total
- Benefícios esperados
- Próximos passos

### 3. Conteúdo da Proposta

#### Seções Incluídas
1. **Capa**: Logo, título, data
2. **Apresentação**: Empresa e capacidades
3. **Escopo**: Detalhamento do fornecimento
4. **Especificações**: Técnicas de cada equipamento
5. **Layout**: Arranjo proposto em 3D
6. **Preços**: Breakdown detalhado
7. **Cronograma**: Prazos de fabricação e entrega
8. **Condições**: Comerciais e técnicas
9. **Garantia**: Termos e cobertura
10. **Anexos**: Catálogos e certificados

#### Personalização
- **Logo da Empresa**: Sua marca
- **Cores Corporativas**: Identidade visual
- **Textos Padrão**: Termos e condições
- **Assinaturas**: Responsáveis técnicos

### 4. Cálculo de Preços

#### Componentes do Preço
- **Equipamentos**: Preço base + opções
- **Materiais**: Tubulações, estruturas
- **Montagem**: Mão de obra especializada
- **Comissionamento**: Testes e startup
- **Frete**: Calculado por região
- **Impostos**: ICMS, IPI, PIS, COFINS

#### Descontos e Acréscimos
- **Volume**: Desconto por quantidade
- **Prazo**: Desconto para pagamento à vista
- **Complexidade**: Acréscimo para projetos especiais
- **Urgência**: Acréscimo para prazos reduzidos

## BOM e Análise de Custos

### 1. Bill of Materials (BOM)

Na aba **💰 BOM/Preço**:

#### Lista Detalhada
- **Item**: Código e descrição
- **Quantidade**: Unidades necessárias
- **Unidade**: Peça, metro, kg
- **Preço Unitário**: Valor individual
- **Preço Total**: Quantidade × unitário
- **Fornecedor**: Empresa responsável
- **Prazo**: Tempo de entrega

#### Categorias
- 🔧 **Equipamentos Principais**: Máquinas e sistemas
- 🔩 **Componentes**: Peças e acessórios
- 📏 **Materiais**: Tubos, chapas, perfis
- ⚡ **Elétricos**: Cabos, painéis, motores
- 🔧 **Montagem**: Mão de obra e serviços

### 2. Análise de Custos

#### Distribuição por Categoria
- Gráfico pizza mostrando percentuais
- Identificação dos itens mais caros
- Oportunidades de otimização

#### Comparativo de Fornecedores
- Preços alternativos
- Prazos de entrega
- Qualidade e garantia
- Histórico de fornecimento

#### Análise de Sensibilidade
- Impacto de variações de preço
- Cenários otimista/pessimista
- Margem de segurança

### 3. Otimização de Custos

#### Sugestões Automáticas
- **Padronização**: Usar componentes comuns
- **Consolidação**: Agrupar fornecedores
- **Alternativas**: Materiais equivalentes
- **Volumes**: Aproveitar economias de escala

#### Análise de Valor
- **Funcionalidade**: Custo vs benefício
- **Qualidade**: Nível adequado
- **Prazo**: Impacto no cronograma
- **Risco**: Confiabilidade do fornecedor

## Colaboração em Tempo Real

### 1. Trabalho em Equipe

#### Usuários Simultâneos
- Até 10 usuários no mesmo projeto
- Visualização de cursors de outros usuários
- Indicação de quem está editando o quê
- Chat integrado para comunicação

#### Permissões
- **Administrador**: Controle total
- **Editor**: Pode modificar o projeto
- **Visualizador**: Apenas consulta
- **Comentarista**: Pode adicionar anotações

### 2. Sistema de Comentários

#### Adicionando Comentários
1. Clique no ícone de comentário
2. Clique no local desejado no 3D
3. Digite sua observação
4. Marque usuários com @nome
5. Defina prioridade (baixa/média/alta)

#### Tipos de Comentários
- 💬 **Geral**: Observações diversas
- ⚠️ **Problema**: Questões a resolver
- 💡 **Sugestão**: Melhorias propostas
- ✅ **Aprovação**: Confirmações

#### Gerenciamento
- Lista de todos os comentários
- Filtros por autor, tipo, status
- Resolução e fechamento
- Histórico de discussões

### 3. Controle de Versões

#### Salvamento Automático
- Salva a cada 30 segundos
- Backup automático a cada hora
- Histórico de 30 dias
- Recuperação de versões anteriores

#### Marcos (Milestones)
- Versões importantes marcadas
- Descrição das mudanças
- Comparação entre versões
- Restauração seletiva

## Exportação e Compartilhamento

### 1. Formatos de Exportação

#### Propostas
- **PDF**: Documento final
- **Word**: Para edição adicional
- **PowerPoint**: Apresentações
- **Excel**: Planilhas de custos

#### Modelos 3D
- **GLB/GLTF**: Visualização web
- **STL**: Impressão 3D
- **OBJ**: Softwares CAD
- **IFC**: BIM (Building Information Modeling)

#### Desenhos 2D
- **DWG**: AutoCAD
- **PDF**: Plantas e cortes
- **PNG/JPG**: Imagens de alta resolução
- **SVG**: Gráficos vetoriais

### 2. Compartilhamento

#### Links Públicos
- Gerar link para visualização
- Definir prazo de validade
- Controlar permissões de acesso
- Rastrear visualizações

#### Integração com Email
- Envio direto da plataforma
- Templates de email personalizáveis
- Anexos automáticos
- Confirmação de leitura

#### APIs e Webhooks
- Integração com sistemas ERP
- Notificações automáticas
- Sincronização de dados
- Automação de processos

## Configurações e Personalização

### 1. Perfil do Usuário

#### Dados Pessoais
- Nome e foto de perfil
- Informações de contato
- Preferências de idioma
- Fuso horário

#### Configurações da Interface
- **Tema**: Claro, escuro, automático
- **Densidade**: Compacta, confortável
- **Atalhos**: Personalizar teclas
- **Notificações**: Tipos e frequência

### 2. Configurações da Empresa

#### Dados Corporativos
- Logo e identidade visual
- Informações de contato
- Certificações e licenças
- Termos e condições padrão

#### Catálogo Personalizado
- Adicionar produtos próprios
- Definir preços e margens
- Configurar opções disponíveis
- Gerenciar fornecedores

### 3. Integrações

#### ERP/CRM
- SAP, Oracle, Salesforce
- Sincronização de clientes
- Importação de produtos
- Exportação de propostas

#### CAD/BIM
- AutoCAD, SolidWorks, Revit
- Importação de modelos
- Exportação de layouts
- Sincronização de mudanças

## Dicas e Melhores Práticas

### 1. Organização de Projetos

#### Nomenclatura
- Use nomes descritivos e padronizados
- Inclua data e versão quando relevante
- Evite caracteres especiais
- Mantenha consistência na equipe

#### Estrutura de Pastas
```
Cliente_ABC/
├── 2025_Projeto_Expansao/
│   ├── Versao_1.0_Preliminar/
│   ├── Versao_2.0_Revisao_Cliente/
│   └── Versao_3.0_Final/
└── 2025_Projeto_Modernizacao/
    ├── Fase_1_Dosagem/
    └── Fase_2_Mistura/
```

### 2. Eficiência no Trabalho

#### Atalhos de Teclado
- **Ctrl+S**: Salvar projeto
- **Ctrl+Z**: Desfazer ação
- **Ctrl+Y**: Refazer ação
- **Del**: Excluir selecionado
- **Ctrl+D**: Duplicar objeto
- **F**: Focar na seleção
- **G**: Alternar grid
- **H**: Vista home

#### Templates de Projeto
- Crie templates para tipos recorrentes
- Inclua configurações padrão
- Defina layouts típicos
- Reutilize em novos projetos

### 3. Qualidade dos Projetos

#### Checklist de Validação
- [ ] Todas as colisões resolvidas
- [ ] Clearances adequados verificados
- [ ] Conexões validadas
- [ ] Utilidades dimensionadas
- [ ] Acessos de manutenção garantidos
- [ ] Normas de segurança atendidas
- [ ] Custos dentro do orçamento
- [ ] Prazos factíveis

#### Revisão por Pares
- Sempre tenha um colega revisando
- Use o sistema de comentários
- Documente decisões importantes
- Mantenha histórico de mudanças

### 4. Performance e Otimização

#### Projetos Grandes
- Use níveis de detalhe (LOD)
- Oculte objetos desnecessários
- Agrupe equipamentos similares
- Otimize texturas e materiais

#### Navegação 3D
- Use vistas predefinidas
- Configure bookmarks de câmera
- Utilize o modo wireframe para análise
- Ajuste qualidade conforme necessidade

## Solução de Problemas

### 1. Problemas Comuns

#### Lentidão na Visualização 3D
**Causas Possíveis:**
- Muitos objetos na cena
- Modelos com alta complexidade
- Placa de vídeo inadequada
- Navegador desatualizado

**Soluções:**
- Reduza a qualidade de renderização
- Oculte objetos desnecessários
- Atualize drivers da placa de vídeo
- Use navegador compatível (Chrome, Firefox)

#### Erro ao Salvar Projeto
**Causas Possíveis:**
- Conexão de internet instável
- Projeto muito grande
- Sessão expirada
- Espaço em disco insuficiente

**Soluções:**
- Verifique conexão de internet
- Faça login novamente
- Reduza complexidade do projeto
- Entre em contato com suporte

#### Modelos 3D Não Carregam
**Causas Possíveis:**
- Arquivo corrompido
- Formato não suportado
- Tamanho excessivo
- Permissões inadequadas

**Soluções:**
- Verifique formato do arquivo
- Reduza tamanho do modelo
- Converta para formato suportado
- Contate administrador do sistema

### 2. Contato com Suporte

#### Canais de Atendimento
- **Email**: suporte@configurador3d.com
- **Chat**: Disponível na plataforma
- **Telefone**: +55 11 1234-5678
- **WhatsApp**: +55 11 98765-4321

#### Informações para Suporte
Ao entrar em contato, forneça:
- ID do projeto afetado
- Descrição detalhada do problema
- Passos para reproduzir o erro
- Screenshots ou vídeos
- Navegador e versão utilizada
- Sistema operacional

#### Horário de Atendimento
- **Segunda a Sexta**: 8h às 18h
- **Sábado**: 8h às 12h
- **Emergências**: 24h (apenas clientes premium)

## Recursos Avançados

### 1. Automação e Scripts

#### Macros Personalizadas
- Automatize tarefas repetitivas
- Crie sequências de comandos
- Configure atalhos personalizados
- Compartilhe com a equipe

#### API de Integração
- Conecte com sistemas externos
- Automatize importação de dados
- Sincronize com ERP/CRM
- Desenvolva extensões customizadas

### 2. Análises Avançadas

#### Simulação de Fluxo
- Análise CFD básica
- Visualização de fluxos de ar
- Identificação de zonas mortas
- Otimização de layout

#### Análise Estrutural
- Cargas e esforços
- Dimensionamento de fundações
- Análise de vibrações
- Recomendações de reforços

### 3. Realidade Aumentada (AR)

#### Visualização Mobile
- App para smartphones/tablets
- Sobreposição do projeto no ambiente real
- Validação de dimensões in-loco
- Apresentações imersivas para clientes

#### Óculos AR
- Suporte para HoloLens
- Visualização hands-free
- Colaboração remota
- Treinamento de operadores

## Glossário

**AABB**: Axis-Aligned Bounding Box - Caixa delimitadora alinhada aos eixos

**API**: Application Programming Interface - Interface de programação

**ATEX**: Atmosphères Explosibles - Diretiva europeia para atmosferas explosivas

**BOM**: Bill of Materials - Lista de materiais

**CAD**: Computer-Aided Design - Desenho assistido por computador

**CE**: Conformité Européenne - Conformidade europeia

**CFD**: Computational Fluid Dynamics - Dinâmica dos fluidos computacional

**CRM**: Customer Relationship Management - Gestão de relacionamento com cliente

**ERP**: Enterprise Resource Planning - Planejamento de recursos empresariais

**FDA**: Food and Drug Administration - Agência reguladora americana

**GLB/GLTF**: Formatos de arquivo 3D para web

**IFC**: Industry Foundation Classes - Padrão BIM

**LOD**: Level of Detail - Nível de detalhe

**STL**: Stereolithography - Formato para impressão 3D

**WebGL**: Web Graphics Library - Biblioteca gráfica para web

---

**Versão**: 1.0.0  
**Última Atualização**: 03/10/2025  
**Suporte**: suporte@configurador3d.com
