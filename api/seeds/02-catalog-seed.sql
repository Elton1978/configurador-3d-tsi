-- Seed data para o catálogo de blocos TSI
-- Inserir famílias de blocos

INSERT INTO block_family (id, name, description, category) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Dosador Gravimétrico', 'Equipamentos para dosagem precisa de materiais por peso', 'feeding'),
('550e8400-e29b-41d4-a716-446655440002', 'Misturador Industrial', 'Equipamentos para homogeneização de materiais', 'mixing'),
('550e8400-e29b-41d4-a716-446655440003', 'Elevador de Canecas', 'Sistemas de transporte vertical de materiais', 'transport'),
('550e8400-e29b-41d4-a716-446655440004', 'Transportador Helicoidal', 'Sistemas de transporte horizontal de materiais', 'transport'),
('550e8400-e29b-41d4-a716-446655440005', 'Tanque de Armazenamento', 'Reservatórios para estocagem de materiais', 'storage'),
('550e8400-e29b-41d4-a716-446655440006', 'Painel de Controle', 'Sistemas de automação e controle', 'control'),
('550e8400-e29b-41d4-a716-446655440007', 'Sistema de Tubulação', 'Redes de distribuição pneumática', 'transport'),
('550e8400-e29b-41d4-a716-446655440008', 'Filtro Industrial', 'Sistemas de filtragem e separação', 'processing');

-- Inserir variantes dos blocos

-- Dosadores Gravimétricos
INSERT INTO block_variant (id, family_id, name, model_code, parameters, capacity, efficiency, price, dimensions, weight, model_url) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Dosador DG-500', 'DG-500-220V', '{"voltage": "220V", "material": "inox-304", "power": 2.5, "precision": 0.1}', 0.5, 0.98, 45000.00, '{"length": 1.2, "width": 0.8, "height": 1.5}', 150, '/static/models/dosador-dg500.glb'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Dosador DG-1000', 'DG-1000-380V', '{"voltage": "380V", "material": "inox-316", "power": 5.0, "precision": 0.05}', 1.0, 0.99, 78000.00, '{"length": 1.5, "width": 1.0, "height": 1.8}', 280, '/static/models/dosador-dg1000.glb'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Dosador DG-2000', 'DG-2000-380V', '{"voltage": "380V", "material": "inox-316", "power": 7.5, "precision": 0.02}', 2.0, 0.99, 125000.00, '{"length": 2.0, "width": 1.2, "height": 2.2}', 450, '/static/models/dosador-dg2000.glb'),

-- Misturadores Industriais
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Misturador MH-500', 'MH-500-380V', '{"voltage": "380V", "material": "inox-304", "power": 15, "mixing_type": "horizontal"}', 5.0, 0.95, 95000.00, '{"length": 3.0, "width": 1.5, "height": 2.0}', 800, '/static/models/misturador-mh500.glb'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Misturador MH-1000', 'MH-1000-380V', '{"voltage": "380V", "material": "inox-316", "power": 30, "mixing_type": "horizontal"}', 10.0, 0.96, 165000.00, '{"length": 4.0, "width": 2.0, "height": 2.5}', 1200, '/static/models/misturador-mh1000.glb'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Misturador MV-750', 'MV-750-380V', '{"voltage": "380V", "material": "inox-316", "power": 22, "mixing_type": "vertical"}', 7.5, 0.94, 135000.00, '{"length": 2.5, "width": 2.5, "height": 3.5}', 950, '/static/models/misturador-mv750.glb'),

-- Elevadores de Canecas
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Elevador EC-6M', 'EC-6M-380V', '{"voltage": "380V", "material": "carbono", "power": 5.5, "height": 6}', 8.0, 0.92, 55000.00, '{"length": 1.0, "width": 1.0, "height": 6.0}', 350, '/static/models/elevador-ec6m.glb'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Elevador EC-10M', 'EC-10M-380V', '{"voltage": "380V", "material": "carbono", "power": 7.5, "height": 10}', 12.0, 0.93, 85000.00, '{"length": 1.2, "width": 1.2, "height": 10.0}', 580, '/static/models/elevador-ec10m.glb'),

-- Transportadores Helicoidais
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Transportador TH-200', 'TH-200-380V', '{"voltage": "380V", "material": "carbono", "power": 3.0, "diameter": 200}', 6.0, 0.88, 35000.00, '{"length": 4.0, "width": 0.5, "height": 0.8}', 180, '/static/models/transportador-th200.glb'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Transportador TH-300', 'TH-300-380V', '{"voltage": "380V", "material": "inox-304", "power": 5.5, "diameter": 300}', 12.0, 0.90, 58000.00, '{"length": 6.0, "width": 0.7, "height": 1.0}', 320, '/static/models/transportador-th300.glb'),

-- Tanques de Armazenamento
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', 'Tanque TA-5000L', 'TA-5000L-INOX', '{"material": "inox-316", "capacity": 5000, "pressure": "atmospheric"}', 0, 1.0, 25000.00, '{"length": 2.0, "width": 2.0, "height": 3.0}', 400, '/static/models/tanque-ta5000l.glb'),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', 'Tanque TA-10000L', 'TA-10000L-INOX', '{"material": "inox-316", "capacity": 10000, "pressure": "atmospheric"}', 0, 1.0, 42000.00, '{"length": 2.5, "width": 2.5, "height": 4.0}', 650, '/static/models/tanque-ta10000l.glb'),

-- Painéis de Controle
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440006', 'Painel PC-Basic', 'PC-BASIC-220V', '{"voltage": "220V", "type": "basic", "io_points": 32}', 0, 1.0, 15000.00, '{"length": 0.8, "width": 0.3, "height": 1.8}', 80, '/static/models/painel-basic.glb'),
('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440006', 'Painel PC-Advanced', 'PC-ADV-380V', '{"voltage": "380V", "type": "advanced", "io_points": 128}', 0, 1.0, 35000.00, '{"length": 1.2, "width": 0.4, "height": 2.0}', 150, '/static/models/painel-advanced.glb');

-- Inserir conectores para os blocos

-- Conectores para Dosador DG-500
INSERT INTO connector (id, variant_id, name, type, direction, position, orientation, specifications) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Entrada Material', 'mechanic', 'input', '{"x": 0, "y": 1.4, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 500, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Saída Material', 'mechanic', 'output', '{"x": 0, "y": 0.2, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 500, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Alimentação Elétrica', 'electric', 'input', '{"x": -0.5, "y": 0.8, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"voltage": 220, "current": 15, "power": 2500}'),

-- Conectores para Misturador MH-500
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'Entrada Material A', 'mechanic', 'input', '{"x": -1.2, "y": 1.8, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 2500, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 'Entrada Material B', 'mechanic', 'input', '{"x": 1.2, "y": 1.8, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 2500, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440004', 'Saída Mistura', 'mechanic', 'output', '{"x": 0, "y": 0.2, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 5000, "material_type": "mixed"}'),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440004', 'Alimentação Elétrica', 'electric', 'input', '{"x": -1.4, "y": 1.0, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"voltage": 380, "current": 25, "power": 15000}'),

-- Conectores para Elevador EC-6M
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440007', 'Entrada Base', 'mechanic', 'input', '{"x": 0, "y": 0.5, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 8000, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440007', 'Saída Topo', 'mechanic', 'output', '{"x": 0, "y": 5.8, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 8000, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440007', 'Alimentação Elétrica', 'electric', 'input', '{"x": -0.4, "y": 1.0, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"voltage": 380, "current": 12, "power": 5500}'),

-- Conectores para Transportador TH-200
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440009', 'Entrada Material', 'mechanic', 'input', '{"x": -1.8, "y": 0.6, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 6000, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440009', 'Saída Material', 'mechanic', 'output', '{"x": 1.8, "y": 0.6, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 6000, "material_type": "granular"}'),
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440009', 'Alimentação Elétrica', 'electric', 'input', '{"x": 0, "y": 0.6, "z": -0.2}', '{"x": 0, "y": 0, "z": 0}', '{"voltage": 380, "current": 8, "power": 3000}'),

-- Conectores para Tanque TA-5000L
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440011', 'Entrada Superior', 'mechanic', 'input', '{"x": 0, "y": 2.8, "z": 0}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 1000, "material_type": "liquid"}'),
('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440011', 'Saída Inferior', 'mechanic', 'output', '{"x": 0, "y": 0.3, "z": 0.8}', '{"x": 0, "y": 0, "z": 0}', '{"flow_rate": 1000, "material_type": "liquid"}'),

-- Conectores para Painel PC-Basic
('770e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440013', 'Alimentação Principal', 'electric', 'input', '{"x": 0, "y": 0.2, "z": -0.1}', '{"x": 0, "y": 0, "z": 0}', '{"voltage": 220, "current": 20, "power": 1000}'),
('770e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440013', 'Saída Controle 1', 'electric', 'output', '{"x": -0.3, "y": 1.0, "z": -0.1}', '{"x": 0, "y": 0, "z": 0}', '{"voltage": 220, "current": 5, "signal_type": "control"}'),
('770e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440013', 'Saída Controle 2', 'electric', 'output', '{"x": 0.3, "y": 1.0, "z": -0.1}', '{"x": 0, "y": 0, "z": 0}', '{"voltage": 220, "current": 5, "signal_type": "control"}');

-- Inserir regras de restrição
INSERT INTO constraint_rule (id, name, type, category, description, rule_definition, weight) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Colisão AABB', 'hard', 'collision', 'Verifica sobreposição de bounding boxes entre blocos', '{"type": "aabb_collision", "min_distance": 0.1}', 1.0),
('880e8400-e29b-41d4-a716-446655440002', 'Limites do Barracão', 'hard', 'collision', 'Verifica se blocos estão dentro dos limites do barracão', '{"type": "boundary_check", "margin": 0.5}', 1.0),
('880e8400-e29b-41d4-a716-446655440003', 'Clearance Manutenção', 'soft', 'clearance', 'Espaço mínimo para acesso de manutenção', '{"type": "maintenance_clearance", "min_distance": 1.5}', 0.8),
('880e8400-e29b-41d4-a716-446655440004', 'Compatibilidade Elétrica', 'hard', 'compatibility', 'Verifica compatibilidade de tensão entre conectores elétricos', '{"type": "electrical_compatibility", "check_voltage": true}', 1.0),
('880e8400-e29b-41d4-a716-446655440005', 'Fluxo de Material', 'hard', 'compatibility', 'Verifica compatibilidade de fluxo entre conectores mecânicos', '{"type": "flow_compatibility", "check_flow_rate": true}', 1.0),
('880e8400-e29b-41d4-a716-446655440006', 'Otimização de Custo', 'soft', 'optimization', 'Minimiza o custo total do sistema', '{"type": "cost_optimization", "weight": 1.0}', 1.0),
('880e8400-e29b-41d4-a716-446655440007', 'Otimização de Eficiência', 'soft', 'optimization', 'Maximiza a eficiência energética do sistema', '{"type": "efficiency_optimization", "weight": 0.7}', 0.7);

-- Inserir projeto de demonstração
INSERT INTO project (id, name, description, barracao_dimensions, requirements, status, created_by) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Projeto Demo - Linha de Produção', 'Projeto de demonstração para linha de produção de 12 t/h', '{"length": 40, "width": 20, "height": 8}', '{"capacity": 12, "efficiency_min": 0.9, "max_cost": 500000}', 'draft', 'demo_user');
