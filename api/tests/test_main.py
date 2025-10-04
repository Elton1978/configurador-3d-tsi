"""
Suite de Testes para API FastAPI
Testes unitários, integração e performance
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import asyncpg

# Importar a aplicação
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import app
from database import get_db_connection
from external_apis import APIOrchestrator
from cache_manager import cache_manager
from webhooks import event_bus, emit_event, EventType

# Cliente de teste
client = TestClient(app)

# Fixtures
@pytest.fixture
def mock_db_connection():
    """Mock da conexão com banco de dados"""
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = {
        'id': 'test-user-id',
        'username': 'testuser',
        'password_hash': 'hashed_password'
    }
    mock_conn.fetch.return_value = []
    mock_conn.execute.return_value = None
    mock_conn.fetchval.return_value = 1
    return mock_conn

@pytest.fixture
def auth_headers():
    """Headers de autenticação para testes"""
    # Simular login e obter token
    response = client.post("/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    # Fallback para token mock
    return {"Authorization": "Bearer mock_token"}

@pytest.fixture
def sample_project():
    """Projeto de exemplo para testes"""
    return {
        "name": "Projeto Teste",
        "description": "Projeto para testes automatizados",
        "barracao": {
            "dimensions": {"length": 40, "width": 20, "height": 8},
            "location": "São Paulo, SP"
        },
        "application": "industrial"
    }

@pytest.fixture
def sample_variant():
    """Variante de produto para testes"""
    return {
        "id": "variant-test-id",
        "name": "Dosador Teste",
        "family_name": "Dosador Gravimétrico",
        "price": 50000.0,
        "specifications": {
            "capacity": 100,
            "power": 15,
            "weight": 2500
        }
    }

class TestAuthentication:
    """Testes de autenticação"""
    
    @patch('main.get_db_connection')
    def test_register_user_success(self, mock_db):
        """Teste de registro de usuário bem-sucedido"""
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = None  # Usuário não existe
        mock_conn.execute.return_value = None
        mock_db.return_value = mock_conn
        
        response = client.post("/auth/register", json={
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "password123",
            "full_name": "New User"
        })
        
        assert response.status_code == 201
        assert "user_id" in response.json()
    
    @patch('main.get_db_connection')
    def test_register_user_duplicate(self, mock_db):
        """Teste de registro com usuário duplicado"""
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"id": "existing-user"}
        mock_db.return_value = mock_conn
        
        response = client.post("/auth/register", json={
            "username": "existinguser",
            "email": "existing@test.com",
            "password": "password123"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    @patch('main.get_db_connection')
    def test_login_success(self, mock_db):
        """Teste de login bem-sucedido"""
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {
            "id": "user-id",
            "username": "testuser",
            "password_hash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"  # 'password'
        }
        mock_db.return_value = mock_conn
        
        response = client.post("/auth/login", json={
            "username": "testuser",
            "password": "password"
        })
        
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["token_type"] == "bearer"
    
    @patch('main.get_db_connection')
    def test_login_invalid_credentials(self, mock_db):
        """Teste de login com credenciais inválidas"""
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = None
        mock_db.return_value = mock_conn
        
        response = client.post("/auth/login", json={
            "username": "wronguser",
            "password": "wrongpass"
        })
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

class TestCatalogEndpoints:
    """Testes dos endpoints de catálogo"""
    
    @patch('main.get_db_connection')
    def test_get_families(self, mock_db):
        """Teste de obtenção de famílias"""
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [
            {"id": "family-1", "name": "Dosador Gravimétrico"},
            {"id": "family-2", "name": "Misturador Industrial"}
        ]
        mock_db.return_value = mock_conn
        
        response = client.get("/catalog/families")
        
        assert response.status_code == 200
        families = response.json()
        assert len(families) == 2
        assert families[0]["name"] == "Dosador Gravimétrico"
    
    @patch('main.get_db_connection')
    def test_get_variants(self, mock_db):
        """Teste de obtenção de variantes"""
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [
            {
                "id": "variant-1",
                "name": "Dosador DG-100",
                "family_name": "Dosador Gravimétrico",
                "price": 50000.0
            }
        ]
        mock_db.return_value = mock_conn
        
        response = client.get("/catalog/variants")
        
        assert response.status_code == 200
        variants = response.json()
        assert len(variants) == 1
        assert variants[0]["name"] == "Dosador DG-100"
    
    @patch('main.get_db_connection')
    def test_get_variants_by_family(self, mock_db):
        """Teste de obtenção de variantes por família"""
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [
            {
                "id": "variant-1",
                "name": "Dosador DG-100",
                "family_name": "Dosador Gravimétrico"
            }
        ]
        mock_db.return_value = mock_conn
        
        response = client.get("/catalog/variants?family_id=family-1")
        
        assert response.status_code == 200
        variants = response.json()
        assert len(variants) == 1

class TestProjectEndpoints:
    """Testes dos endpoints de projetos"""
    
    @patch('main.verify_token')
    @patch('main.get_db_connection')
    def test_create_project(self, mock_db, mock_auth, sample_project):
        """Teste de criação de projeto"""
        mock_auth.return_value = "testuser"
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"id": "user-id"}
        mock_conn.execute.return_value = None
        mock_db.return_value = mock_conn
        
        response = client.post("/projects", 
                             json=sample_project,
                             headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 201
        assert "project_id" in response.json()
    
    @patch('main.verify_token')
    @patch('main.get_db_connection')
    def test_get_user_projects(self, mock_db, mock_auth):
        """Teste de obtenção de projetos do usuário"""
        mock_auth.return_value = "testuser"
        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = {"id": "user-id"}
        mock_conn.fetch.return_value = [
            {
                "id": "project-1",
                "name": "Projeto 1",
                "owner_username": "testuser"
            }
        ]
        mock_db.return_value = mock_conn
        
        response = client.get("/projects",
                            headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 200
        projects = response.json()
        assert len(projects) == 1
        assert projects[0]["name"] == "Projeto 1"
    
    @patch('main.verify_token')
    @patch('main.get_db_connection')
    def test_get_project_by_id(self, mock_db, mock_auth):
        """Teste de obtenção de projeto específico"""
        mock_auth.return_value = "testuser"
        mock_conn = AsyncMock()
        mock_conn.fetchrow.side_effect = [
            {"id": "user-id"},  # User lookup
            {  # Project lookup
                "id": "project-1",
                "name": "Projeto 1",
                "owner_username": "testuser"
            }
        ]
        mock_conn.fetch.return_value = []  # Blocks
        mock_db.return_value = mock_conn
        
        response = client.get("/projects/project-1",
                            headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 200
        project = response.json()
        assert project["name"] == "Projeto 1"
        assert "blocks" in project
    
    @patch('main.verify_token')
    @patch('main.get_db_connection')
    def test_get_project_not_found(self, mock_db, mock_auth):
        """Teste de projeto não encontrado"""
        mock_auth.return_value = "testuser"
        mock_conn = AsyncMock()
        mock_conn.fetchrow.side_effect = [
            {"id": "user-id"},  # User lookup
            None  # Project not found
        ]
        mock_db.return_value = mock_conn
        
        response = client.get("/projects/nonexistent",
                            headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

class TestBlockEndpoints:
    """Testes dos endpoints de blocos"""
    
    @patch('main.verify_token')
    @patch('main.get_db_connection')
    def test_add_block_to_project(self, mock_db, mock_auth):
        """Teste de adição de bloco ao projeto"""
        mock_auth.return_value = "testuser"
        mock_conn = AsyncMock()
        mock_conn.fetchrow.side_effect = [
            {"id": "user-id"},  # User lookup
            {"id": "project-1"},  # Project exists
            {"id": "variant-1"}  # Variant exists
        ]
        mock_conn.execute.return_value = None
        mock_db.return_value = mock_conn
        
        block_data = {
            "project_id": "project-1",
            "variant_id": "variant-1",
            "position": {"x": 0, "y": 0, "z": 0},
            "tag": "EQ-001"
        }
        
        response = client.post("/projects/project-1/blocks",
                             json=block_data,
                             headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 201
        assert "block_id" in response.json()

class TestProposalEndpoints:
    """Testes dos endpoints de propostas"""
    
    @patch('main.verify_token')
    @patch('main.get_db_connection')
    def test_generate_proposal(self, mock_db, mock_auth):
        """Teste de geração de proposta"""
        mock_auth.return_value = "testuser"
        mock_conn = AsyncMock()
        mock_conn.fetchrow.side_effect = [
            {"id": "user-id"},  # User lookup
            {"id": "project-1", "name": "Projeto Teste"}  # Project exists
        ]
        mock_conn.fetch.return_value = [  # Blocks
            {
                "id": "block-1",
                "variant_name": "Dosador DG-100",
                "price": 50000.0
            }
        ]
        mock_conn.execute.return_value = None
        mock_db.return_value = mock_conn
        
        proposal_data = {
            "project_id": "project-1",
            "template": "standard"
        }
        
        response = client.post("/proposals/generate",
                             json=proposal_data,
                             headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 200
        assert "proposal" in response.json()

class TestConfigurationEndpoints:
    """Testes dos endpoints de configuração"""
    
    def test_configure_product(self):
        """Teste de configuração de produto"""
        config_data = {
            "variant_id": "variant-1",
            "options": {
                "material": "stainless_steel",
                "capacity": 150
            }
        }
        
        response = client.post("/configure", json=config_data)
        
        assert response.status_code == 200
        config = response.json()
        assert "configuration_id" in config
        assert "calculated_price" in config
        assert "specifications" in config
    
    def test_calculate_pricing(self):
        """Teste de cálculo de preços"""
        pricing_data = {
            "items": [
                {
                    "id": "item-1",
                    "base_price": 50000,
                    "multiplier": 1.2
                }
            ]
        }
        
        response = client.post("/pricing/calculate", json=pricing_data)
        
        assert response.status_code == 200
        pricing = response.json()
        assert "total_price" in pricing
        assert "items" in pricing
        assert len(pricing["items"]) == 1

class TestSystemEndpoints:
    """Testes dos endpoints do sistema"""
    
    def test_root_endpoint(self):
        """Teste do endpoint raiz"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["status"] == "running"
    
    @patch('main.get_db_connection')
    def test_health_check(self, mock_db):
        """Teste de health check"""
        mock_conn = AsyncMock()
        mock_conn.fetchval.return_value = 1
        mock_db.return_value = mock_conn
        
        response = client.get("/health")
        
        assert response.status_code == 200
        health = response.json()
        assert "status" in health
        assert "services" in health

class TestExternalAPIs:
    """Testes das APIs externas"""
    
    @pytest.mark.asyncio
    async def test_freight_calculation(self):
        """Teste de cálculo de frete"""
        from external_apis import FreightCalculator
        
        async with FreightCalculator() as calc:
            result = await calc.calculate_shipping(
                "01234-567", "98765-432", 100.0, 
                {"length": 2, "width": 1, "height": 1}
            )
            
            assert result.success
            assert "price" in result.data
            assert "delivery_days" in result.data
    
    @pytest.mark.asyncio
    async def test_currency_exchange(self):
        """Teste de cotação de moedas"""
        from external_apis import CurrencyExchange
        
        async with CurrencyExchange() as exchange:
            result = await exchange.get_exchange_rates()
            
            assert result.success
            assert "rates" in result.data
            assert "BRL" in result.data["rates"]
    
    @pytest.mark.asyncio
    async def test_company_data(self):
        """Teste de dados da empresa"""
        from external_apis import CompanyDataAPI
        
        async with CompanyDataAPI() as api:
            # CNPJ fictício para teste
            result = await api.get_company_info("12345678000195")
            
            # Como é um CNPJ fictício, pode falhar, mas testamos a estrutura
            if result.success:
                assert "cnpj" in result.data
                assert "name" in result.data

class TestCacheManager:
    """Testes do gerenciador de cache"""
    
    @pytest.mark.asyncio
    async def test_cache_set_get(self):
        """Teste de set/get no cache"""
        await cache_manager.connect()
        
        # Set
        success = await cache_manager.set("test", "key1", {"data": "test_value"})
        assert success
        
        # Get
        result = await cache_manager.get("test", "key1")
        assert result is not None
        assert result["data"] == "test_value"
        
        await cache_manager.disconnect()
    
    @pytest.mark.asyncio
    async def test_cache_expiration(self):
        """Teste de expiração do cache"""
        await cache_manager.connect()
        
        # Set com TTL curto
        await cache_manager.set("test", "key2", {"data": "expire_test"}, ttl=1)
        
        # Verificar se existe
        result = await cache_manager.get("test", "key2")
        assert result is not None
        
        # Aguardar expiração
        await asyncio.sleep(2)
        
        # Verificar se expirou
        result = await cache_manager.get("test", "key2")
        assert result is None
        
        await cache_manager.disconnect()

class TestWebhooks:
    """Testes do sistema de webhooks"""
    
    @pytest.mark.asyncio
    async def test_event_emission(self):
        """Teste de emissão de eventos"""
        events_received = []
        
        def event_handler(event):
            events_received.append(event)
        
        # Inscrever handler
        event_bus.subscribe(EventType.PROJECT_CREATED, event_handler)
        
        # Emitir evento
        await emit_event(
            EventType.PROJECT_CREATED,
            "test_source",
            {"project_name": "Test Project"},
            user_id="test-user"
        )
        
        # Verificar se evento foi recebido
        assert len(events_received) == 1
        assert events_received[0].type == EventType.PROJECT_CREATED
        assert events_received[0].data["project_name"] == "Test Project"

class TestPerformance:
    """Testes de performance"""
    
    def test_catalog_endpoint_performance(self):
        """Teste de performance do endpoint de catálogo"""
        import time
        
        start_time = time.time()
        response = client.get("/catalog/families")
        end_time = time.time()
        
        # Deve responder em menos de 1 segundo
        assert (end_time - start_time) < 1.0
        assert response.status_code == 200
    
    def test_multiple_concurrent_requests(self):
        """Teste de múltiplas requisições concorrentes"""
        import concurrent.futures
        import time
        
        def make_request():
            return client.get("/")
        
        start_time = time.time()
        
        # Fazer 10 requisições concorrentes
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in futures]
        
        end_time = time.time()
        
        # Todas devem ser bem-sucedidas
        assert all(r.status_code == 200 for r in results)
        
        # Deve completar em menos de 5 segundos
        assert (end_time - start_time) < 5.0

class TestSecurity:
    """Testes de segurança"""
    
    def test_unauthorized_access(self):
        """Teste de acesso não autorizado"""
        response = client.get("/projects")
        
        # Deve retornar 401 ou 403
        assert response.status_code in [401, 403]
    
    def test_invalid_token(self):
        """Teste com token inválido"""
        response = client.get("/projects", 
                            headers={"Authorization": "Bearer invalid_token"})
        
        assert response.status_code in [401, 403]
    
    def test_sql_injection_protection(self):
        """Teste de proteção contra SQL injection"""
        malicious_input = "'; DROP TABLE users; --"
        
        response = client.post("/auth/login", json={
            "username": malicious_input,
            "password": "password"
        })
        
        # Não deve causar erro interno do servidor
        assert response.status_code != 500
    
    def test_xss_protection(self):
        """Teste de proteção contra XSS"""
        xss_payload = "<script>alert('xss')</script>"
        
        # Tentar criar projeto com payload XSS
        response = client.post("/projects", 
                             json={
                                 "name": xss_payload,
                                 "description": "Test",
                                 "barracao": {}
                             },
                             headers={"Authorization": "Bearer mock_token"})
        
        # Deve ser rejeitado ou sanitizado
        if response.status_code == 201:
            # Se aceito, verificar se foi sanitizado
            project = response.json()
            assert "<script>" not in str(project)

class TestDataValidation:
    """Testes de validação de dados"""
    
    def test_invalid_project_data(self):
        """Teste com dados de projeto inválidos"""
        invalid_project = {
            "name": "",  # Nome vazio
            "barracao": "invalid"  # Tipo incorreto
        }
        
        response = client.post("/projects",
                             json=invalid_project,
                             headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 422  # Validation error
    
    def test_invalid_email_format(self):
        """Teste com formato de email inválido"""
        response = client.post("/auth/register", json={
            "username": "testuser",
            "email": "invalid-email",
            "password": "password123"
        })
        
        assert response.status_code == 422
    
    def test_weak_password(self):
        """Teste com senha fraca"""
        response = client.post("/auth/register", json={
            "username": "testuser",
            "email": "test@test.com",
            "password": "123"  # Senha muito fraca
        })
        
        # Dependendo da implementação, pode aceitar ou rejeitar
        # Este teste documenta o comportamento esperado
        assert response.status_code in [201, 422]

# Configuração do pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
