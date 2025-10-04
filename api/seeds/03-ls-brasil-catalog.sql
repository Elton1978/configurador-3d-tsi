-- Seed com catálogo completo LS DO BRASIL
-- Baseado na análise dos produtos reais da empresa

-- Limpar dados existentes
DELETE FROM project_blocks;
DELETE FROM catalog_variants;
DELETE FROM catalog_connectors;
DELETE FROM catalog_families;

-- Inserir famílias de produtos LS DO BRASIL
INSERT INTO catalog_families (id, name, description, category, created_at) VALUES
('fam_tratadora_batelada', 'Tratadora por Batelada (TSI)', 'Equipamentos para tratamento industrial de sementes por batelada, com diferentes níveis de automação e capacidade', 'tratamento', NOW()),
('fam_tratadora_laboratorio', 'Tratadora de Laboratório', 'Equipamentos de bancada para ensaios, desenvolvimento de receitas e controle de qualidade', 'laboratorio', NOW()),
('fam_tratadora_fertilizantes', 'Tratadora de Fertilizantes', 'Equipamentos móveis especializados para tratamento de fertilizantes', 'tratamento', NOW()),
('fam_aspiracao_filtragem', 'Aspiração e Filtragem', 'Sistemas de aspiração de pó e filtragem de ar para ambiente seguro', 'auxiliar', NOW()),
('fam_secagem', 'Túnel de Secagem', 'Módulos de secagem tipo leito fluidizado para secagem pós-tratamento', 'processamento', NOW()),
('fam_transporte', 'Sistemas de Transporte', 'Elevadores, norias, correias e transporte pneumático para movimentação de sementes', 'transporte', NOW()),
('fam_embalagem', 'Embalagem e Paletização', 'Sistemas de ensaque e paletização para embalagem final', 'embalagem', NOW()),
('fam_acessorios', 'Acessórios de Processo', 'Tolvas, estruturas, válvulas, guilhotinas, BigBag e amostradores', 'acessorio', NOW()),
('fam_plantas_completas', 'Plantas Completas', 'Projetos turn-key de plantas de tratamento e peletização de sementes', 'projeto', NOW());

-- Inserir variantes específicas dos produtos LS DO BRASIL
INSERT INTO catalog_variants (id, family_id, name, model_code, description, specifications, price_base, dimensions, weight_kg, power_kw, capacity_per_hour, created_at) VALUES

-- Tratadoras por Batelada
('var_ls_b5', 'fam_tratadora_batelada', 'LS-B5 Transportável', 'LS-B5', 'Tratadora transportável de entrada, manual/semi-automática para sementes diversas', 
 '{"dosagem_liquidos": "Peristáltica", "dosagem_po": "Tornillo dosificador", "automacao": "Manual/Semi-automática", "aplicacoes": ["soja", "trigo", "milho"], "caracteristicas": ["transportável", "nível entrada"]}',
 85000.00, '{"length": 2.5, "width": 1.8, "height": 2.2}', 800, 3.0, 3.0, NOW()),

('var_ls_b6', 'fam_tratadora_batelada', 'LS-B6 Profissional', 'LS-B6', 'Tratadora profissional com alta precisão e rastreabilidade por lote',
 '{"dosagem_liquidos": "Até 6 dosadores peristálticos com caudalímetros", "dosagem_po": "Até 2 dosadores tornillo", "automacao": "PLC + receitas, balança peso líquido", "aplicacoes": ["soja", "trigo", "milho", "grão-de-bico"], "caracteristicas": ["alta precisão", "rastreabilidade", "2 cortes programáveis"]}',
 145000.00, '{"length": 3.2, "width": 2.1, "height": 2.8}', 1200, 5.5, 6.0, NOW()),

('var_ls_b6pm', 'fam_tratadora_batelada', 'LS-B6PM Profissional Plus', 'LS-B6PM', 'Versão premium da LS-B6 com funcionalidades adicionais',
 '{"dosagem_liquidos": "Até 6 dosadores peristálticos com caudalímetros", "dosagem_po": "Até 2 dosadores tornillo", "automacao": "PLC + receitas avançadas, balança peso líquido", "aplicacoes": ["soja", "trigo", "milho", "grão-de-bico"], "caracteristicas": ["alta precisão", "rastreabilidade", "2 cortes programáveis", "funcionalidades premium"]}',
 165000.00, '{"length": 3.2, "width": 2.1, "height": 2.8}', 1250, 5.5, 6.0, NOW()),

('var_ls_b18', 'fam_tratadora_batelada', 'LS-B18 Industrial', 'LS-B18', 'Equipamento mais vendido, para TSI industrial com automação avançada',
 '{"dosagem_liquidos": "Peristáltica com calibração automática", "dosagem_po": "Dosador tornillo", "automacao": "Automação avançada, HMI, receitas", "aplicacoes": ["sementes diversas", "TSI industrial"], "caracteristicas": ["equipamento mais vendido", "150 kg por ciclo"], "image_url": "/images/products/ls_b18_industrial.png"}',
 285000.00, '{"length": 4.5, "width": 2.8, "height": 3.5}', 2200, 11.0, 18.0, NOW()),

('var_ls_b300', 'fam_tratadora_batelada', 'LS-B300 Grande Porte', 'LS-B300', 'Tratadora de grande porte para TSI industrial de alta capacidade',
 '{"dosagem_liquidos": "Peristáltica linha", "dosagem_po": "Dosador pó linha", "automacao": "PLC + HMI automação avançada", "aplicacoes": ["TSI grande porte"], "caracteristicas": ["alta capacidade", "industrial"], "image_url": "/images/products/ls_b300_large_scale.png"}',
 485000.00, '{"length": 6.0, "width": 3.5, "height": 4.2}', 3800, 18.5, 30.0, NOW()),

('var_ls_b300_duo', 'fam_tratadora_batelada', 'LS-B300 Duo', 'LS-B300-DUO', 'Versão dupla da LS-B300 com até 600 kg por ciclo (2 tambores)',
 '{"dosagem_liquidos": "Peristáltica linha dupla", "dosagem_po": "Dosador pó linha dupla", "automacao": "PLC + HMI automação avançada", "aplicacoes": ["TSI grande porte"], "caracteristicas": ["600 kg por ciclo", "2 tambores", "máxima capacidade"], "image_url": "/images/products/ls_treatment_line.png"}',
 685000.00, '{"length": 8.5, "width": 4.2, "height": 4.8}', 5200, 25.0, 45.0, NOW()),

-- Tratadora de Laboratório
('var_ls_blab', 'fam_tratadora_laboratorio', 'LS-BLAB Laboratório', 'LS-BLAB', 'Tratadora de bancada para ensaios e desenvolvimento de receitas',
 '{"dosagem_liquidos": "Peristáltica linha", "dosagem_po": "Dosador pó linha", "automacao": "Automação para testes de receita", "aplicacoes": ["ensaios", "desenvolvimento receitas", "QA"], "caracteristicas": ["bancada/laboratório", "0.5-1.5 kg por batch", "fácil traslado"]}',
 35000.00, '{"length": 1.2, "width": 0.8, "height": 1.5}', 150, 1.0, 0.1, NOW()),

-- Tratadora de Fertilizantes
('var_ls_ef40', 'fam_tratadora_fertilizantes', 'LS-EF40 Móvel Fertilizantes', 'LS-EF40', 'Tratadora móvel dedicada para fertilizantes',
 '{"aplicacao": "Dedicada fertilizantes", "tipo": "Móvel", "caracteristicas": ["tratamento fertilizantes", "móvel"]}',
 125000.00, '{"length": 4.0, "width": 2.2, "height": 2.5}', 1800, 7.5, 8.0, NOW()),

-- Aspiração e Filtragem
('var_filtro_cartucho_100', 'fam_aspiracao_filtragem', 'Filtro Cartucho 100m³', 'FC-100', 'Sistema de aspiração e filtrado de pó com filtro de cartucho de 100m³',
 '{"tipo": "Filtro cartucho", "capacidade": "100 m³", "aplicacao": "Aspiração pó TSI", "caracteristicas": ["ambiente seguro", "alto rendimento"]}',
 45000.00, '{"length": 3.0, "width": 2.0, "height": 3.5}', 800, 5.5, 100.0, NOW()),

('var_filtro_cartucho_200', 'fam_aspiracao_filtragem', 'Filtro Cartucho 200m³', 'FC-200', 'Sistema de aspiração e filtrado de pó com filtro de cartucho de 200m³',
 '{"tipo": "Filtro cartucho", "capacidade": "200 m³", "aplicacao": "Aspiração pó TSI", "caracteristicas": ["ambiente seguro", "alto rendimento", "maior capacidade"]}',
 65000.00, '{"length": 3.5, "width": 2.5, "height": 4.0}', 1200, 7.5, 200.0, NOW()),

-- Túnel de Secagem
('var_secagem_modular', 'fam_secagem', 'Módulo Secagem Leito Fluidizado', 'SEC-MOD', 'Módulo de secagem tipo leito fluidizado para secagem pós-tratamento',
 '{"tipo": "Leito fluidizado", "controle": "Aeração/temperatura", "aplicacao": "Secagem pós-tratamento", "caracteristicas": ["melhor plantabilidade"]}',
 95000.00, '{"length": 4.0, "width": 2.0, "height": 2.8}', 1500, 8.0, 5.0, NOW()),

-- Sistemas de Transporte
('var_elevador_canecas', 'fam_transporte', 'Elevador de Canecas', 'ELEV-CAN', 'Elevador de canecas para movimentação vertical de sementes',
 '{"tipo": "Elevador canecas", "aplicacao": "Movimentação vertical", "caracteristicas": ["transporte suave", "alta capacidade"]}',
 55000.00, '{"length": 2.0, "width": 1.5, "height": 8.0}', 1200, 4.0, 15.0, NOW()),

('var_noria_transporte', 'fam_transporte', 'Noria de Transporte', 'NORIA', 'Sistema de noria para transporte horizontal de sementes',
 '{"tipo": "Noria", "aplicacao": "Movimentação horizontal", "caracteristicas": ["transporte contínuo", "baixa manutenção"]}',
 35000.00, '{"length": 6.0, "width": 0.8, "height": 1.2}', 800, 2.5, 12.0, NOW()),

('var_correia_transportadora', 'fam_transporte', 'Correia Transportadora', 'CORREIA', 'Correia transportadora para movimentação de sementes',
 '{"tipo": "Correia", "aplicacao": "Transporte horizontal/inclinado", "caracteristicas": ["versátil", "fácil manutenção"]}',
 25000.00, '{"length": 8.0, "width": 1.0, "height": 1.5}', 600, 3.0, 20.0, NOW()),

('var_transporte_pneumatico', 'fam_transporte', 'Transporte Pneumático', 'PNEUM', 'Sistema de transporte pneumático para sementes',
 '{"tipo": "Pneumático", "aplicacao": "Transporte por tubulação", "caracteristicas": ["flexível", "sem contaminação"]}',
 75000.00, '{"length": 4.0, "width": 2.0, "height": 2.5}', 1000, 15.0, 25.0, NOW()),

-- Embalagem e Paletização
('var_ensacadora_automatica', 'fam_embalagem', 'Ensacadora Automática', 'ENSAC-AUTO', 'Sistema automático de ensaque para embalagem final',
 '{"tipo": "Ensacadora automática", "aplicacao": "Embalagem final TSI", "caracteristicas": ["alta velocidade", "precisão"]}',
 185000.00, '{"length": 5.0, "width": 2.5, "height": 3.0}', 2200, 8.5, 10.0, NOW()),

('var_paletizadora', 'fam_embalagem', 'Paletizadora Automática', 'PALET-AUTO', 'Sistema automático de paletização',
 '{"tipo": "Paletizadora", "aplicacao": "Paletização automática", "caracteristicas": ["robótica", "alta eficiência"]}',
 285000.00, '{"length": 4.0, "width": 3.0, "height": 4.5}', 3500, 12.0, 8.0, NOW()),

-- Acessórios de Processo
('var_tolva_recepcao', 'fam_acessorios', 'Tolva de Recepção', 'TOLVA-REC', 'Tolva para recepção de sementes',
 '{"tipo": "Tolva recepção", "aplicacao": "Recepção sementes", "caracteristicas": ["grande capacidade", "descarga controlada"]}',
 15000.00, '{"length": 2.5, "width": 2.5, "height": 3.0}', 400, 0.0, 0.0, NOW()),

('var_valvula_guilhotina', 'fam_acessorios', 'Válvula Guilhotina', 'VALV-GUIL', 'Válvula guilhotina para controle de fluxo',
 '{"tipo": "Válvula guilhotina", "aplicacao": "Controle fluxo", "caracteristicas": ["vedação hermética", "acionamento pneumático"]}',
 8500.00, '{"length": 0.5, "width": 0.5, "height": 0.8}', 25, 0.0, 0.0, NOW()),

('var_bigbag_carga', 'fam_acessorios', 'Sistema BigBag Carga', 'BIGBAG-CARGA', 'Sistema para carga de BigBags',
 '{"tipo": "BigBag carga", "aplicacao": "Carga BigBag", "caracteristicas": ["automático", "pesagem integrada"]}',
 45000.00, '{"length": 2.0, "width": 2.0, "height": 3.5}', 800, 2.0, 5.0, NOW()),

('var_bigbag_descarga', 'fam_acessorios', 'Sistema BigBag Descarga', 'BIGBAG-DESC', 'Sistema para descarga de BigBags',
 '{"tipo": "BigBag descarga", "aplicacao": "Descarga BigBag", "caracteristicas": ["automático", "controle fluxo"]}',
 35000.00, '{"length": 2.0, "width": 2.0, "height": 3.0}', 600, 1.5, 8.0, NOW()),

('var_amostrador_automatico', 'fam_acessorios', 'Amostrador Automático', 'AMOST-AUTO', 'Sistema automático de amostragem',
 '{"tipo": "Amostrador", "aplicacao": "Amostragem automática", "caracteristicas": ["representativo", "rastreável"]}',
 25000.00, '{"length": 1.0, "width": 0.8, "height": 1.5}', 150, 1.0, 0.0, NOW()),

-- Plantas Completas
('var_planta_tsi_pequena', 'fam_plantas_completas', 'Planta TSI Pequena', 'PLANTA-P', 'Planta completa de tratamento de sementes para pequenos volumes',
 '{"tipo": "Planta completa", "capacidade": "Pequena (até 10 t/h)", "automacao": "Turn-key, automação total", "aplicacao": "UBS pequeno porte", "caracteristicas": ["projeto completo", "instalação inclusa"]}',
 850000.00, '{"length": 15.0, "width": 8.0, "height": 6.0}', 8000, 45.0, 10.0, NOW()),

('var_planta_tsi_media', 'fam_plantas_completas', 'Planta TSI Média', 'PLANTA-M', 'Planta completa de tratamento de sementes para volumes médios',
 '{"tipo": "Planta completa", "capacidade": "Média (até 25 t/h)", "automacao": "Turn-key, automação total", "aplicacao": "UBS médio porte", "caracteristicas": ["projeto completo", "instalação inclusa", "múltiplas linhas"]}',
 1650000.00, '{"length": 25.0, "width": 12.0, "height": 8.0}', 15000, 85.0, 25.0, NOW()),

('var_planta_tsi_grande', 'fam_plantas_completas', 'Planta TSI Grande', 'PLANTA-G', 'Planta completa de tratamento de sementes para grandes volumes',
 '{"tipo": "Planta completa", "capacidade": "Grande (até 50 t/h)", "automacao": "Turn-key, automação total", "aplicacao": "UBS grande porte", "caracteristicas": ["projeto completo", "instalação inclusa", "múltiplas linhas", "automação avançada"]}',
 2850000.00, '{"length": 40.0, "width": 18.0, "height": 12.0}', 25000, 150.0, 50.0, NOW());

-- Inserir conectores específicos para equipamentos LS DO BRASIL
INSERT INTO catalog_connectors (id, variant_id, name, type, position, direction, diameter_mm, pressure_bar, flow_rate, created_at) VALUES

-- Conectores LS-B5
('conn_ls_b5_entrada', 'var_ls_b5', 'Entrada Sementes', 'material', '{"x": 0, "y": 2.2, "z": 1.25}', '{"x": 0, "y": -1, "z": 0}', 150, 0, 3.0, NOW()),
('conn_ls_b5_saida', 'var_ls_b5', 'Saída Sementes', 'material', '{"x": 2.5, "y": 0.5, "z": 1.25}', '{"x": 1, "y": 0, "z": 0}', 150, 0, 3.0, NOW()),
('conn_ls_b5_liquido', 'var_ls_b5', 'Entrada Líquidos', 'hidraulico', '{"x": 1.25, "y": 2.2, "z": 1.8}', '{"x": 0, "y": -1, "z": 0}', 25, 6, 0.5, NOW()),
('conn_ls_b5_eletrico', 'var_ls_b5', 'Alimentação Elétrica', 'eletrico', '{"x": 0.5, "y": 1.8, "z": 0}', '{"x": 0, "y": 0, "z": -1}', 0, 0, 3.0, NOW()),

-- Conectores LS-B6
('conn_ls_b6_entrada', 'var_ls_b6', 'Entrada Sementes', 'material', '{"x": 0, "y": 2.8, "z": 1.6}', '{"x": 0, "y": -1, "z": 0}', 200, 0, 6.0, NOW()),
('conn_ls_b6_saida', 'var_ls_b6', 'Saída Sementes', 'material', '{"x": 3.2, "y": 0.5, "z": 1.6}', '{"x": 1, "y": 0, "z": 0}', 200, 0, 6.0, NOW()),
('conn_ls_b6_liquido_1', 'var_ls_b6', 'Entrada Líquidos 1', 'hidraulico', '{"x": 1.0, "y": 2.1, "z": 2.3}', '{"x": 0, "y": -1, "z": 0}', 25, 8, 0.8, NOW()),
('conn_ls_b6_liquido_2', 'var_ls_b6', 'Entrada Líquidos 2', 'hidraulico', '{"x": 1.6, "y": 2.1, "z": 2.3}', '{"x": 0, "y": -1, "z": 0}', 25, 8, 0.8, NOW()),
('conn_ls_b6_po', 'var_ls_b6', 'Entrada Pó', 'pneumatico', '{"x": 2.2, "y": 2.1, "z": 2.3}', '{"x": 0, "y": -1, "z": 0}', 50, 2, 0.2, NOW()),
('conn_ls_b6_eletrico', 'var_ls_b6', 'Alimentação Elétrica', 'eletrico', '{"x": 0.5, "y": 2.1, "z": 0}', '{"x": 0, "y": 0, "z": -1}', 0, 0, 5.5, NOW()),

-- Conectores LS-B18
('conn_ls_b18_entrada', 'var_ls_b18', 'Entrada Sementes', 'material', '{"x": 0, "y": 3.5, "z": 2.25}', '{"x": 0, "y": -1, "z": 0}', 300, 0, 18.0, NOW()),
('conn_ls_b18_saida', 'var_ls_b18', 'Saída Sementes', 'material', '{"x": 4.5, "y": 0.5, "z": 2.25}', '{"x": 1, "y": 0, "z": 0}', 300, 0, 18.0, NOW()),
('conn_ls_b18_liquido_1', 'var_ls_b18', 'Entrada Líquidos 1', 'hidraulico', '{"x": 1.5, "y": 2.8, "z": 3.0}', '{"x": 0, "y": -1, "z": 0}', 32, 10, 1.2, NOW()),
('conn_ls_b18_liquido_2', 'var_ls_b18', 'Entrada Líquidos 2', 'hidraulico', '{"x": 2.25, "y": 2.8, "z": 3.0}', '{"x": 0, "y": -1, "z": 0}', 32, 10, 1.2, NOW()),
('conn_ls_b18_po', 'var_ls_b18', 'Entrada Pó', 'pneumatico', '{"x": 3.0, "y": 2.8, "z": 3.0}', '{"x": 0, "y": -1, "z": 0}', 80, 3, 0.5, NOW()),
('conn_ls_b18_eletrico', 'var_ls_b18', 'Alimentação Elétrica', 'eletrico', '{"x": 0.8, "y": 2.8, "z": 0}', '{"x": 0, "y": 0, "z": -1}', 0, 0, 11.0, NOW()),

-- Conectores LS-B300
('conn_ls_b300_entrada', 'var_ls_b300', 'Entrada Sementes', 'material', '{"x": 0, "y": 4.2, "z": 3.0}', '{"x": 0, "y": -1, "z": 0}', 400, 0, 30.0, NOW()),
('conn_ls_b300_saida', 'var_ls_b300', 'Saída Sementes', 'material', '{"x": 6.0, "y": 0.5, "z": 3.0}', '{"x": 1, "y": 0, "z": 0}', 400, 0, 30.0, NOW()),
('conn_ls_b300_liquido_1', 'var_ls_b300', 'Entrada Líquidos 1', 'hidraulico', '{"x": 2.0, "y": 3.5, "z": 3.8}', '{"x": 0, "y": -1, "z": 0}', 40, 12, 2.0, NOW()),
('conn_ls_b300_liquido_2', 'var_ls_b300', 'Entrada Líquidos 2', 'hidraulico', '{"x": 3.0, "y": 3.5, "z": 3.8}', '{"x": 0, "y": -1, "z": 0}', 40, 12, 2.0, NOW()),
('conn_ls_b300_po', 'var_ls_b300', 'Entrada Pó', 'pneumatico', '{"x": 4.0, "y": 3.5, "z": 3.8}', '{"x": 0, "y": -1, "z": 0}', 100, 4, 1.0, NOW()),
('conn_ls_b300_eletrico', 'var_ls_b300', 'Alimentação Elétrica', 'eletrico', '{"x": 1.0, "y": 3.5, "z": 0}', '{"x": 0, "y": 0, "z": -1}', 0, 0, 18.5, NOW()),

-- Conectores sistemas de transporte
('conn_elevador_entrada', 'var_elevador_canecas', 'Entrada Inferior', 'material', '{"x": 1.0, "y": 0.75, "z": 0.5}', '{"x": 0, "y": 0, "z": 1}', 200, 0, 15.0, NOW()),
('conn_elevador_saida', 'var_elevador_canecas', 'Saída Superior', 'material', '{"x": 1.0, "y": 0.75, "z": 7.5}', '{"x": 0, "y": 0, "z": -1}', 200, 0, 15.0, NOW()),
('conn_elevador_eletrico', 'var_elevador_canecas', 'Motor Elétrico', 'eletrico', '{"x": 1.5, "y": 1.5, "z": 7.8}', '{"x": 0, "y": 0, "z": -1}', 0, 0, 4.0, NOW()),

-- Conectores correia transportadora
('conn_correia_entrada', 'var_correia_transportadora', 'Entrada', 'material', '{"x": 0, "y": 0.5, "z": 1.0}', '{"x": 1, "y": 0, "z": 0}', 300, 0, 20.0, NOW()),
('conn_correia_saida', 'var_correia_transportadora', 'Saída', 'material', '{"x": 8.0, "y": 0.5, "z": 1.0}', '{"x": -1, "y": 0, "z": 0}', 300, 0, 20.0, NOW()),
('conn_correia_eletrico', 'var_correia_transportadora', 'Motor', 'eletrico', '{"x": 7.5, "y": 1.0, "z": 0.5}', '{"x": 0, "y": 0, "z": -1}', 0, 0, 3.0, NOW());

-- Atualizar timestamp
UPDATE catalog_families SET updated_at = NOW();
UPDATE catalog_variants SET updated_at = NOW();
UPDATE catalog_connectors SET updated_at = NOW();
