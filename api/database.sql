-- Configurador 3D TSI - Database Schema
-- PostgreSQL DDL com extensões e dados de seed

-- Habilita a extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Famílias de blocos (ex: Dosador, Misturador, Elevador)
CREATE TABLE block_family (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100), -- 'feeding', 'mixing', 'transport', 'storage'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes específicas de cada bloco
CREATE TABLE block_variant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES block_family(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model_code VARCHAR(100) UNIQUE NOT NULL,
    parameters JSONB DEFAULT '{}', -- { "voltage": "220V", "material": "inox-316", "power": 15 }
    capacity REAL, -- ex: 12.5 (t/h)
    efficiency REAL, -- ex: 0.95 (0-1)
    price NUMERIC(12, 2) NOT NULL,
    dimensions JSONB NOT NULL, -- { "length": 2.5, "width": 1.2, "height": 1.8 } em metros
    weight REAL, -- kg
    model_url VARCHAR(255), -- Caminho para o arquivo GLB/GLTF
    compatibility_rules JSONB DEFAULT '{}', -- { "requires": ["family_id"], "excludes": ["variant_id"] }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conectores para snapping e regras de compatibilidade
CREATE TABLE connector (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES block_variant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'electric', 'mechanic', 'hydraulic', 'pneumatic'
    direction VARCHAR(50) NOT NULL, -- 'input', 'output', 'bidirectional'
    position JSONB NOT NULL, -- { "x": 0, "y": 1.2, "z": 0 } posição relativa ao bloco
    orientation JSONB DEFAULT '{ "x": 0, "y": 0, "z": 0 }', -- rotação em radianos
    specifications JSONB DEFAULT '{}', -- { "flow_rate": 100, "pressure": 10, "voltage": 220 }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regras de restrição para o solver
CREATE TABLE constraint_rule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'hard', 'soft'
    category VARCHAR(100), -- 'collision', 'clearance', 'compatibility', 'power'
    description TEXT,
    rule_definition JSONB NOT NULL, -- Lógica da regra em formato estruturado
    weight REAL DEFAULT 1.0, -- Peso para regras soft
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projetos criados pelos usuários
CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barracao_dimensions JSONB NOT NULL, -- { "length": 40, "width": 20, "height": 8 }
    requirements JSONB DEFAULT '{}', -- { "capacity": 12, "efficiency_min": 0.9 }
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'completed'
    created_by VARCHAR(255), -- User ID (futuro OIDC)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocos instanciados em um projeto
CREATE TABLE project_block (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES block_variant(id),
    instance_name VARCHAR(255), -- Nome da instância no projeto
    position JSONB NOT NULL, -- { "x": 10, "y": 0, "z": 5 }
    rotation JSONB DEFAULT '{ "x": 0, "y": 0, "z": 0 }',
    parameters JSONB DEFAULT '{}', -- Parâmetros específicos desta instância
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conexões entre blocos
CREATE TABLE project_connection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    from_block_id UUID NOT NULL REFERENCES project_block(id) ON DELETE CASCADE,
    to_block_id UUID NOT NULL REFERENCES project_block(id) ON DELETE CASCADE,
    from_connector_id UUID NOT NULL REFERENCES connector(id),
    to_connector_id UUID NOT NULL REFERENCES connector(id),
    connection_type VARCHAR(100), -- 'electric', 'mechanic', 'hydraulic'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orçamentos e propostas geradas
CREATE TABLE project_quote (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    proposal_name VARCHAR(255), -- 'Menor Custo', 'Melhor Desempenho', 'Ajuste ao Local'
    proposal_type VARCHAR(100), -- 'cost_optimized', 'performance_optimized', 'space_optimized'
    total_price NUMERIC(15, 2) NOT NULL,
    kpis JSONB, -- { "capacity": 12, "efficiency": 0.92, "area": 150, "violations": 0 }
    layout_data JSONB, -- Dados do layout gerado (posições dos blocos)
    solver_log JSONB, -- Log das decisões do solver
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_block_variant_family ON block_variant(family_id);
CREATE INDEX idx_connector_variant ON connector(variant_id);
CREATE INDEX idx_project_block_project ON project_block(project_id);
CREATE INDEX idx_project_block_variant ON project_block(variant_id);
CREATE INDEX idx_project_quote_project ON project_quote(project_id);
CREATE INDEX idx_project_connection_project ON project_connection(project_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON project
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
