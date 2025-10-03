"""
Sistema de Cache Redis
Gerencia cache distribuído para otimização de performance
"""

import redis
import json
import pickle
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
import hashlib
import asyncio
import aioredis
from functools import wraps
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CacheManager:
    """Gerenciador de cache Redis"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self.redis_client = None
        self.default_ttl = 3600  # 1 hora
        
        # Prefixos para diferentes tipos de cache
        self.prefixes = {
            'catalog': 'cat:',
            'pricing': 'price:',
            'config': 'cfg:',
            'proposal': 'prop:',
            'user': 'user:',
            'project': 'proj:',
            'api': 'api:',
            'session': 'sess:'
        }
    
    async def connect(self):
        """Conectar ao Redis"""
        try:
            self.redis_client = await aioredis.from_url(self.redis_url)
            await self.redis_client.ping()
            logger.info("✅ Connected to Redis successfully")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            self.redis_client = None
    
    async def disconnect(self):
        """Desconectar do Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
    
    def _generate_key(self, prefix: str, identifier: str, params: Dict = None) -> str:
        """Gerar chave de cache"""
        base_key = f"{self.prefixes.get(prefix, '')}{identifier}"
        
        if params:
            # Criar hash dos parâmetros para chave única
            params_str = json.dumps(params, sort_keys=True)
            params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
            base_key += f":{params_hash}"
        
        return base_key
    
    async def get(self, prefix: str, identifier: str, params: Dict = None) -> Optional[Any]:
        """Obter valor do cache"""
        if not self.redis_client:
            return None
        
        try:
            key = self._generate_key(prefix, identifier, params)
            cached_data = await self.redis_client.get(key)
            
            if cached_data:
                # Tentar deserializar JSON primeiro, depois pickle
                try:
                    return json.loads(cached_data)
                except json.JSONDecodeError:
                    return pickle.loads(cached_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting cache for {prefix}:{identifier}: {e}")
            return None
    
    async def set(self, prefix: str, identifier: str, value: Any, 
                  ttl: Optional[int] = None, params: Dict = None) -> bool:
        """Definir valor no cache"""
        if not self.redis_client:
            return False
        
        try:
            key = self._generate_key(prefix, identifier, params)
            ttl = ttl or self.default_ttl
            
            # Tentar serializar como JSON primeiro, depois pickle
            try:
                serialized_value = json.dumps(value, default=str)
            except (TypeError, ValueError):
                serialized_value = pickle.dumps(value)
            
            await self.redis_client.setex(key, ttl, serialized_value)
            return True
            
        except Exception as e:
            logger.error(f"Error setting cache for {prefix}:{identifier}: {e}")
            return False
    
    async def delete(self, prefix: str, identifier: str, params: Dict = None) -> bool:
        """Deletar valor do cache"""
        if not self.redis_client:
            return False
        
        try:
            key = self._generate_key(prefix, identifier, params)
            result = await self.redis_client.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error deleting cache for {prefix}:{identifier}: {e}")
            return False
    
    async def exists(self, prefix: str, identifier: str, params: Dict = None) -> bool:
        """Verificar se chave existe no cache"""
        if not self.redis_client:
            return False
        
        try:
            key = self._generate_key(prefix, identifier, params)
            return await self.redis_client.exists(key) > 0
            
        except Exception as e:
            logger.error(f"Error checking cache existence for {prefix}:{identifier}: {e}")
            return False
    
    async def expire(self, prefix: str, identifier: str, ttl: int, params: Dict = None) -> bool:
        """Definir TTL para chave existente"""
        if not self.redis_client:
            return False
        
        try:
            key = self._generate_key(prefix, identifier, params)
            return await self.redis_client.expire(key, ttl)
            
        except Exception as e:
            logger.error(f"Error setting expiration for {prefix}:{identifier}: {e}")
            return False
    
    async def get_ttl(self, prefix: str, identifier: str, params: Dict = None) -> int:
        """Obter TTL restante da chave"""
        if not self.redis_client:
            return -1
        
        try:
            key = self._generate_key(prefix, identifier, params)
            return await self.redis_client.ttl(key)
            
        except Exception as e:
            logger.error(f"Error getting TTL for {prefix}:{identifier}: {e}")
            return -1
    
    async def clear_prefix(self, prefix: str) -> int:
        """Limpar todas as chaves com prefixo específico"""
        if not self.redis_client:
            return 0
        
        try:
            pattern = f"{self.prefixes.get(prefix, '')}*"
            keys = await self.redis_client.keys(pattern)
            
            if keys:
                return await self.redis_client.delete(*keys)
            
            return 0
            
        except Exception as e:
            logger.error(f"Error clearing cache with prefix {prefix}: {e}")
            return 0
    
    async def get_stats(self) -> Dict[str, Any]:
        """Obter estatísticas do cache"""
        if not self.redis_client:
            return {}
        
        try:
            info = await self.redis_client.info()
            
            stats = {
                'connected_clients': info.get('connected_clients', 0),
                'used_memory': info.get('used_memory_human', '0B'),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'uptime_in_seconds': info.get('uptime_in_seconds', 0)
            }
            
            # Calcular hit rate
            hits = stats['keyspace_hits']
            misses = stats['keyspace_misses']
            total = hits + misses
            
            if total > 0:
                stats['hit_rate'] = round((hits / total) * 100, 2)
            else:
                stats['hit_rate'] = 0
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}

class CacheDecorator:
    """Decorador para cache automático de funções"""
    
    def __init__(self, cache_manager: CacheManager):
        self.cache_manager = cache_manager
    
    def cached(self, prefix: str, ttl: int = None, key_func=None):
        """
        Decorador para cache automático
        
        Args:
            prefix: Prefixo do cache
            ttl: Time to live em segundos
            key_func: Função para gerar chave personalizada
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Gerar chave de cache
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    # Usar nome da função e argumentos como chave
                    func_name = func.__name__
                    params = {
                        'args': str(args),
                        'kwargs': json.dumps(kwargs, sort_keys=True, default=str)
                    }
                    cache_key = func_name
                
                # Tentar obter do cache
                cached_result = await self.cache_manager.get(
                    prefix, cache_key, 
                    params if not key_func else None
                )
                
                if cached_result is not None:
                    logger.debug(f"Cache hit for {prefix}:{cache_key}")
                    return cached_result
                
                # Executar função e cachear resultado
                result = await func(*args, **kwargs)
                
                await self.cache_manager.set(
                    prefix, cache_key, result, ttl,
                    params if not key_func else None
                )
                
                logger.debug(f"Cache miss for {prefix}:{cache_key} - cached result")
                return result
            
            return wrapper
        return decorator

class SessionManager:
    """Gerenciador de sessões usando Redis"""
    
    def __init__(self, cache_manager: CacheManager):
        self.cache_manager = cache_manager
        self.session_ttl = 1800  # 30 minutos
    
    async def create_session(self, user_id: str, session_data: Dict) -> str:
        """Criar nova sessão"""
        import uuid
        session_id = str(uuid.uuid4())
        
        session_info = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'last_activity': datetime.utcnow().isoformat(),
            **session_data
        }
        
        await self.cache_manager.set(
            'session', session_id, session_info, self.session_ttl
        )
        
        return session_id
    
    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Obter dados da sessão"""
        return await self.cache_manager.get('session', session_id)
    
    async def update_session(self, session_id: str, updates: Dict) -> bool:
        """Atualizar dados da sessão"""
        session_data = await self.get_session(session_id)
        
        if not session_data:
            return False
        
        session_data.update(updates)
        session_data['last_activity'] = datetime.utcnow().isoformat()
        
        return await self.cache_manager.set(
            'session', session_id, session_data, self.session_ttl
        )
    
    async def delete_session(self, session_id: str) -> bool:
        """Deletar sessão"""
        return await self.cache_manager.delete('session', session_id)
    
    async def extend_session(self, session_id: str) -> bool:
        """Estender TTL da sessão"""
        return await self.cache_manager.expire('session', session_id, self.session_ttl)

class CacheWarmer:
    """Aquecedor de cache para dados frequentemente acessados"""
    
    def __init__(self, cache_manager: CacheManager):
        self.cache_manager = cache_manager
    
    async def warm_catalog_cache(self, db_connection):
        """Aquecer cache do catálogo"""
        try:
            # Cache de famílias
            families = await db_connection.fetch("SELECT * FROM families ORDER BY name")
            await self.cache_manager.set(
                'catalog', 'families', 
                [dict(family) for family in families], 
                ttl=7200  # 2 horas
            )
            
            # Cache de variantes
            variants = await db_connection.fetch(
                """SELECT v.*, f.name as family_name 
                   FROM variants v 
                   JOIN families f ON v.family_id = f.id 
                   ORDER BY f.name, v.name"""
            )
            await self.cache_manager.set(
                'catalog', 'variants', 
                [dict(variant) for variant in variants], 
                ttl=7200
            )
            
            # Cache de conectores
            connectors = await db_connection.fetch("SELECT * FROM connectors ORDER BY type, name")
            await self.cache_manager.set(
                'catalog', 'connectors', 
                [dict(connector) for connector in connectors], 
                ttl=7200
            )
            
            logger.info("✅ Catalog cache warmed successfully")
            
        except Exception as e:
            logger.error(f"❌ Error warming catalog cache: {e}")
    
    async def warm_pricing_cache(self):
        """Aquecer cache de preços base"""
        try:
            # Cache de regras de preço base por família
            base_prices = {
                'Dosador Gravimétrico': {'min': 25000, 'max': 150000, 'base': 50000},
                'Misturador Industrial': {'min': 35000, 'max': 200000, 'base': 75000},
                'Elevador de Canecas': {'min': 20000, 'max': 120000, 'base': 45000},
                'Transportador Helicoidal': {'min': 15000, 'max': 80000, 'base': 35000},
                'Tanque de Armazenamento': {'min': 30000, 'max': 180000, 'base': 65000},
                'Painel de Controle': {'min': 10000, 'max': 50000, 'base': 25000},
                'Sistema de Tubulação': {'min': 5000, 'max': 30000, 'base': 15000},
                'Filtro Industrial': {'min': 12000, 'max': 60000, 'base': 28000}
            }
            
            await self.cache_manager.set(
                'pricing', 'base_prices', base_prices, ttl=86400  # 24 horas
            )
            
            logger.info("✅ Pricing cache warmed successfully")
            
        except Exception as e:
            logger.error(f"❌ Error warming pricing cache: {e}")

# Instância global do cache manager
cache_manager = CacheManager()
cache_decorator = CacheDecorator(cache_manager)
session_manager = SessionManager(cache_manager)
cache_warmer = CacheWarmer(cache_manager)

# Funções de conveniência
async def init_cache():
    """Inicializar cache"""
    await cache_manager.connect()

async def close_cache():
    """Fechar cache"""
    await cache_manager.disconnect()

async def get_cached(prefix: str, identifier: str, params: Dict = None) -> Optional[Any]:
    """Função de conveniência para obter do cache"""
    return await cache_manager.get(prefix, identifier, params)

async def set_cached(prefix: str, identifier: str, value: Any, 
                    ttl: Optional[int] = None, params: Dict = None) -> bool:
    """Função de conveniência para definir no cache"""
    return await cache_manager.set(prefix, identifier, value, ttl, params)

async def clear_cache(prefix: str) -> int:
    """Função de conveniência para limpar cache"""
    return await cache_manager.clear_prefix(prefix)

# Decoradores prontos para uso
def cache_catalog(ttl: int = 7200):
    """Decorador para cache de catálogo (2 horas)"""
    return cache_decorator.cached('catalog', ttl)

def cache_pricing(ttl: int = 3600):
    """Decorador para cache de preços (1 hora)"""
    return cache_decorator.cached('pricing', ttl)

def cache_config(ttl: int = 1800):
    """Decorador para cache de configurações (30 minutos)"""
    return cache_decorator.cached('config', ttl)

def cache_api(ttl: int = 600):
    """Decorador para cache de APIs externas (10 minutos)"""
    return cache_decorator.cached('api', ttl)
