#!/bin/bash

# Script de Validação Final do Sistema
# Executa todos os testes e gera relatório completo

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="$PROJECT_ROOT/reports"
REPORT_FILE="$REPORT_DIR/validation_report_$TIMESTAMP.md"

# Criar diretório de relatórios
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}🔍 Iniciando Validação Completa do Sistema${NC}"
echo "Timestamp: $(date)"
echo "Projeto: Configurador 3D TSI"
echo "Relatório será salvo em: $REPORT_FILE"
echo ""

# Inicializar relatório
cat > "$REPORT_FILE" << EOF
# Relatório de Validação - Configurador 3D TSI

**Data:** $(date)  
**Versão:** 1.0.0  
**Ambiente:** Desenvolvimento  

## Resumo Executivo

Este relatório apresenta os resultados da validação completa do sistema Configurador 3D TSI, incluindo testes unitários, integração, performance e segurança.

## Resultados dos Testes

EOF

# Função para adicionar seção ao relatório
add_section() {
    echo "" >> "$REPORT_FILE"
    echo "### $1" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Função para adicionar resultado
add_result() {
    local status=$1
    local description=$2
    local details=$3
    
    if [ "$status" = "PASS" ]; then
        echo "✅ **PASSOU:** $description" >> "$REPORT_FILE"
    elif [ "$status" = "FAIL" ]; then
        echo "❌ **FALHOU:** $description" >> "$REPORT_FILE"
    else
        echo "⚠️ **AVISO:** $description" >> "$REPORT_FILE"
    fi
    
    if [ -n "$details" ]; then
        echo "   - $details" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# Função para executar comando e capturar resultado
run_test() {
    local test_name=$1
    local command=$2
    local expected_exit_code=${3:-0}
    
    echo -e "${YELLOW}Executando: $test_name${NC}"
    
    if eval "$command" > /tmp/test_output.log 2>&1; then
        if [ $? -eq $expected_exit_code ]; then
            echo -e "${GREEN}✅ $test_name - PASSOU${NC}"
            return 0
        else
            echo -e "${RED}❌ $test_name - FALHOU (código de saída inesperado)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $test_name - FALHOU${NC}"
        cat /tmp/test_output.log
        return 1
    fi
}

# 1. Validação da Estrutura do Projeto
echo -e "${BLUE}📁 Validando Estrutura do Projeto${NC}"
add_section "Estrutura do Projeto"

check_file_exists() {
    local file=$1
    local description=$2
    
    if [ -f "$PROJECT_ROOT/$file" ]; then
        add_result "PASS" "$description" "Arquivo encontrado: $file"
        return 0
    else
        add_result "FAIL" "$description" "Arquivo não encontrado: $file"
        return 1
    fi
}

check_dir_exists() {
    local dir=$1
    local description=$2
    
    if [ -d "$PROJECT_ROOT/$dir" ]; then
        add_result "PASS" "$description" "Diretório encontrado: $dir"
        return 0
    else
        add_result "FAIL" "$description" "Diretório não encontrado: $dir"
        return 1
    fi
}

# Verificar arquivos essenciais
check_file_exists "README.md" "Documentação principal"
check_file_exists "docker-compose.yml" "Configuração Docker"
check_file_exists "api/src/main.py" "API principal"
check_file_exists "web/package.json" "Configuração do frontend"
check_file_exists "api/database.sql" "Schema do banco de dados"

# Verificar diretórios essenciais
check_dir_exists "api/src" "Código fonte da API"
check_dir_exists "web/src" "Código fonte do frontend"
check_dir_exists "static/models" "Modelos 3D"
check_dir_exists "api/tests" "Testes da API"

# 2. Validação do Backend (API)
echo -e "${BLUE}🔧 Validando Backend${NC}"
add_section "Backend (FastAPI)"

cd "$PROJECT_ROOT/api"

# Verificar dependências Python
if run_test "Instalação de dependências Python" "pip install -r requirements.txt"; then
    add_result "PASS" "Dependências Python instaladas" "requirements.txt processado com sucesso"
else
    add_result "FAIL" "Falha na instalação de dependências Python" "Verificar requirements.txt"
fi

# Verificar sintaxe Python
if run_test "Sintaxe Python" "python -m py_compile src/main.py"; then
    add_result "PASS" "Sintaxe Python válida" "main.py compilado sem erros"
else
    add_result "FAIL" "Erro de sintaxe Python" "Verificar código em src/main.py"
fi

# Testes unitários da API
if [ -f "tests/test_main.py" ]; then
    if run_test "Testes unitários da API" "python -m pytest tests/ -v --tb=short"; then
        add_result "PASS" "Testes unitários da API" "Todos os testes passaram"
    else
        add_result "FAIL" "Falha nos testes unitários da API" "Verificar logs de teste"
    fi
else
    add_result "WARN" "Testes unitários não encontrados" "Arquivo tests/test_main.py não existe"
fi

# 3. Validação do Frontend
echo -e "${BLUE}🎨 Validando Frontend${NC}"
add_section "Frontend (React)"

cd "$PROJECT_ROOT/web"

# Verificar Node.js e npm
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    add_result "PASS" "Node.js instalado" "Versão: $NODE_VERSION"
else
    add_result "FAIL" "Node.js não encontrado" "Instalar Node.js"
fi

# Instalar dependências
if run_test "Instalação de dependências npm" "npm install"; then
    add_result "PASS" "Dependências npm instaladas" "package.json processado com sucesso"
else
    add_result "FAIL" "Falha na instalação de dependências npm" "Verificar package.json"
fi

# Build do frontend
if run_test "Build do frontend" "npm run build"; then
    add_result "PASS" "Build do frontend" "Aplicação compilada com sucesso"
    
    # Verificar tamanho do bundle
    if [ -d "dist" ]; then
        BUNDLE_SIZE=$(du -sh dist | cut -f1)
        add_result "PASS" "Bundle gerado" "Tamanho: $BUNDLE_SIZE"
    fi
else
    add_result "FAIL" "Falha no build do frontend" "Verificar erros de compilação"
fi

# Testes do frontend (se existirem)
if [ -f "src/__tests__/App.test.jsx" ]; then
    if run_test "Testes do frontend" "npm test -- --run"; then
        add_result "PASS" "Testes do frontend" "Todos os testes passaram"
    else
        add_result "FAIL" "Falha nos testes do frontend" "Verificar logs de teste"
    fi
else
    add_result "WARN" "Testes do frontend não encontrados" "Considerar adicionar testes"
fi

# 4. Validação do Banco de Dados
echo -e "${BLUE}🗄️ Validando Banco de Dados${NC}"
add_section "Banco de Dados"

cd "$PROJECT_ROOT"

# Verificar schema SQL
if [ -f "api/database.sql" ]; then
    # Verificar sintaxe SQL básica
    if grep -q "CREATE TABLE" api/database.sql; then
        add_result "PASS" "Schema SQL válido" "Contém definições de tabelas"
    else
        add_result "FAIL" "Schema SQL inválido" "Não contém CREATE TABLE"
    fi
    
    # Contar tabelas
    TABLE_COUNT=$(grep -c "CREATE TABLE" api/database.sql)
    add_result "PASS" "Tabelas definidas" "Total: $TABLE_COUNT tabelas"
else
    add_result "FAIL" "Schema SQL não encontrado" "Arquivo api/database.sql não existe"
fi

# Verificar seeds
if [ -f "api/seeds/02-catalog-seed.sql" ]; then
    add_result "PASS" "Seeds de dados encontrados" "Dados iniciais disponíveis"
else
    add_result "WARN" "Seeds não encontrados" "Considerar adicionar dados iniciais"
fi

# 5. Validação de Segurança
echo -e "${BLUE}🔒 Validando Segurança${NC}"
add_section "Segurança"

# Verificar se há senhas hardcoded
if grep -r "password.*=" api/src/ --include="*.py" | grep -v "password_hash" | grep -v "# " > /tmp/security_check.log; then
    add_result "WARN" "Possíveis senhas hardcoded encontradas" "Verificar arquivo de log"
else
    add_result "PASS" "Nenhuma senha hardcoded encontrada" "Código limpo"
fi

# Verificar uso de HTTPS em produção
if grep -q "ssl_context" api/src/main.py; then
    add_result "PASS" "Configuração SSL encontrada" "HTTPS configurado"
else
    add_result "WARN" "Configuração SSL não encontrada" "Configurar HTTPS para produção"
fi

# Verificar CORS
if grep -q "CORSMiddleware" api/src/main.py; then
    add_result "PASS" "CORS configurado" "Middleware encontrado"
else
    add_result "WARN" "CORS não configurado" "Adicionar middleware CORS"
fi

# 6. Validação de Performance
echo -e "${BLUE}⚡ Validando Performance${NC}"
add_section "Performance"

# Verificar otimizações do frontend
if [ -f "web/vite.config.js" ]; then
    if grep -q "build.*rollupOptions" web/vite.config.js; then
        add_result "PASS" "Otimizações de build configuradas" "Rollup options encontradas"
    else
        add_result "WARN" "Otimizações de build não configuradas" "Considerar adicionar rollupOptions"
    fi
fi

# Verificar lazy loading
if grep -q "React.lazy\|lazy(" web/src/**/*.jsx 2>/dev/null; then
    add_result "PASS" "Lazy loading implementado" "Componentes carregados sob demanda"
else
    add_result "WARN" "Lazy loading não encontrado" "Considerar implementar code splitting"
fi

# Verificar cache no backend
if grep -q "cache" api/src/main.py; then
    add_result "PASS" "Sistema de cache implementado" "Cache encontrado no backend"
else
    add_result "WARN" "Sistema de cache não encontrado" "Considerar implementar cache"
fi

# 7. Validação de Documentação
echo -e "${BLUE}📚 Validando Documentação${NC}"
add_section "Documentação"

# Verificar README
if [ -f "README.md" ]; then
    if grep -q "# " README.md && grep -q "## " README.md; then
        add_result "PASS" "README bem estruturado" "Contém títulos e seções"
    else
        add_result "WARN" "README básico" "Considerar melhorar estrutura"
    fi
else
    add_result "FAIL" "README não encontrado" "Criar documentação principal"
fi

# Verificar documentação da API
if grep -q "swagger\|openapi" api/src/main.py; then
    add_result "PASS" "Documentação da API configurada" "Swagger/OpenAPI encontrado"
else
    add_result "WARN" "Documentação da API não configurada" "Adicionar Swagger/OpenAPI"
fi

# 8. Validação de Deploy
echo -e "${BLUE}🚀 Validando Configuração de Deploy${NC}"
add_section "Deploy"

# Verificar Docker
if [ -f "docker-compose.yml" ]; then
    add_result "PASS" "Docker Compose configurado" "Orquestração de serviços disponível"
    
    # Verificar se há Dockerfiles
    if [ -f "api/Dockerfile" ] && [ -f "web/Dockerfile" ]; then
        add_result "PASS" "Dockerfiles encontrados" "Containerização configurada"
    else
        add_result "WARN" "Dockerfiles incompletos" "Verificar api/Dockerfile e web/Dockerfile"
    fi
else
    add_result "WARN" "Docker Compose não encontrado" "Considerar adicionar orquestração"
fi

# Verificar variáveis de ambiente
if [ -f ".env.example" ]; then
    add_result "PASS" "Template de variáveis de ambiente" ".env.example encontrado"
else
    add_result "WARN" "Template de variáveis não encontrado" "Criar .env.example"
fi

# 9. Testes de Integração (se disponíveis)
echo -e "${BLUE}🔗 Validando Testes de Integração${NC}"
add_section "Testes de Integração"

if [ -d "e2e" ]; then
    add_result "PASS" "Testes E2E configurados" "Diretório e2e encontrado"
    
    if [ -f "e2e/tests/configurator.spec.js" ]; then
        add_result "PASS" "Testes E2E implementados" "Specs encontradas"
    fi
else
    add_result "WARN" "Testes E2E não encontrados" "Considerar adicionar testes end-to-end"
fi

# 10. Resumo Final
echo -e "${BLUE}📊 Gerando Resumo Final${NC}"

# Contar resultados
PASS_COUNT=$(grep -c "✅ \*\*PASSOU:\*\*" "$REPORT_FILE" || echo "0")
FAIL_COUNT=$(grep -c "❌ \*\*FALHOU:\*\*" "$REPORT_FILE" || echo "0")
WARN_COUNT=$(grep -c "⚠️ \*\*AVISO:\*\*" "$REPORT_FILE" || echo "0")
TOTAL_COUNT=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))

# Calcular score
if [ $TOTAL_COUNT -gt 0 ]; then
    SCORE=$((PASS_COUNT * 100 / TOTAL_COUNT))
else
    SCORE=0
fi

# Adicionar resumo ao relatório
cat >> "$REPORT_FILE" << EOF

## Resumo dos Resultados

| Categoria | Quantidade |
|-----------|------------|
| ✅ Passou | $PASS_COUNT |
| ❌ Falhou | $FAIL_COUNT |
| ⚠️ Avisos | $WARN_COUNT |
| **Total** | **$TOTAL_COUNT** |

**Score de Qualidade: $SCORE%**

## Recomendações

EOF

# Adicionar recomendações baseadas nos resultados
if [ $FAIL_COUNT -gt 0 ]; then
    echo "### 🚨 Ações Críticas" >> "$REPORT_FILE"
    echo "- Corrigir todos os itens que falharam antes do deploy em produção" >> "$REPORT_FILE"
    echo "- Executar novamente a validação após correções" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ $WARN_COUNT -gt 0 ]; then
    echo "### ⚠️ Melhorias Recomendadas" >> "$REPORT_FILE"
    echo "- Implementar itens marcados como avisos para melhorar qualidade" >> "$REPORT_FILE"
    echo "- Priorizar segurança e performance" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

echo "### 🎯 Próximos Passos" >> "$REPORT_FILE"
echo "1. Corrigir itens críticos (falhas)" >> "$REPORT_FILE"
echo "2. Implementar melhorias recomendadas" >> "$REPORT_FILE"
echo "3. Executar testes de carga e performance" >> "$REPORT_FILE"
echo "4. Preparar ambiente de produção" >> "$REPORT_FILE"
echo "5. Executar deploy e monitoramento" >> "$REPORT_FILE"

# Output final
echo ""
echo -e "${BLUE}📋 Validação Concluída${NC}"
echo -e "Resultados: ${GREEN}$PASS_COUNT passou${NC}, ${RED}$FAIL_COUNT falhou${NC}, ${YELLOW}$WARN_COUNT avisos${NC}"
echo -e "Score de Qualidade: ${GREEN}$SCORE%${NC}"
echo -e "Relatório completo: ${BLUE}$REPORT_FILE${NC}"

# Determinar código de saída
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Validação falhou - Itens críticos precisam ser corrigidos${NC}"
    exit 1
elif [ $WARN_COUNT -gt 5 ]; then
    echo -e "${YELLOW}⚠️ Validação passou com muitos avisos - Melhorias recomendadas${NC}"
    exit 2
else
    echo -e "${GREEN}✅ Validação passou - Sistema pronto para deploy${NC}"
    exit 0
fi
