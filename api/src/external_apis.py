"""
Sistema de Integração com APIs Externas
Gerencia conexões com serviços externos para cotações, frete, certificações, etc.
"""

import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import os
from dataclasses import dataclass
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class APIResponse:
    success: bool
    data: Any
    error: Optional[str] = None
    status_code: Optional[int] = None
    response_time: Optional[float] = None

class ExternalAPIManager:
    """Gerenciador de APIs externas"""
    
    def __init__(self):
        self.session = None
        self.api_keys = {
            'correios': os.getenv('CORREIOS_API_KEY'),
            'bacen': os.getenv('BACEN_API_KEY'),
            'receita_federal': os.getenv('RECEITA_FEDERAL_API_KEY'),
            'via_cep': None,  # API pública
            'fipe': None,     # API pública
        }
        
        # URLs das APIs
        self.api_urls = {
            'correios': 'https://api.correios.com.br/token/v1/authenticate/oauth',
            'bacen': 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados',
            'via_cep': 'https://viacep.com.br/ws',
            'fipe': 'https://parallelum.com.br/fipe/api/v1',
            'cnpj': 'https://www.receitaws.com.br/v1/cnpj',
            'currency': 'https://api.exchangerate-api.com/v4/latest/USD'
        }
        
        # Cache para respostas
        self.cache = {}
        self.cache_ttl = {}
    
    async def __aenter__(self):
        """Context manager para sessão HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'Configurador-3D-TSI/1.0'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Fechar sessão HTTP"""
        if self.session:
            await self.session.close()
    
    def _get_cache_key(self, service: str, params: Dict) -> str:
        """Gerar chave de cache"""
        return f"{service}:{hash(json.dumps(params, sort_keys=True))}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Verificar se cache é válido"""
        if cache_key not in self.cache_ttl:
            return False
        return datetime.now() < self.cache_ttl[cache_key]
    
    def _set_cache(self, cache_key: str, data: Any, ttl_minutes: int = 60):
        """Definir cache com TTL"""
        self.cache[cache_key] = data
        self.cache_ttl[cache_key] = datetime.now() + timedelta(minutes=ttl_minutes)
    
    async def _make_request(self, url: str, method: str = 'GET', 
                           params: Dict = None, data: Dict = None,
                           headers: Dict = None) -> APIResponse:
        """Fazer requisição HTTP genérica"""
        start_time = datetime.now()
        
        try:
            async with self.session.request(
                method=method,
                url=url,
                params=params,
                json=data,
                headers=headers
            ) as response:
                response_time = (datetime.now() - start_time).total_seconds()
                
                if response.status == 200:
                    response_data = await response.json()
                    return APIResponse(
                        success=True,
                        data=response_data,
                        status_code=response.status,
                        response_time=response_time
                    )
                else:
                    error_text = await response.text()
                    return APIResponse(
                        success=False,
                        data=None,
                        error=f"HTTP {response.status}: {error_text}",
                        status_code=response.status,
                        response_time=response_time
                    )
                    
        except asyncio.TimeoutError:
            return APIResponse(
                success=False,
                data=None,
                error="Request timeout",
                response_time=(datetime.now() - start_time).total_seconds()
            )
        except Exception as e:
            return APIResponse(
                success=False,
                data=None,
                error=str(e),
                response_time=(datetime.now() - start_time).total_seconds()
            )

class FreightCalculator(ExternalAPIManager):
    """Calculadora de frete usando APIs dos Correios"""
    
    async def calculate_shipping(self, origin_cep: str, destination_cep: str,
                               weight: float, dimensions: Dict[str, float],
                               service_code: str = "04014") -> APIResponse:
        """
        Calcular frete
        service_code: 04014 (SEDEX), 04510 (PAC)
        """
        cache_key = self._get_cache_key('shipping', {
            'origin': origin_cep,
            'destination': destination_cep,
            'weight': weight,
            'service': service_code
        })
        
        if self._is_cache_valid(cache_key):
            return APIResponse(success=True, data=self.cache[cache_key])
        
        # Simular cálculo de frete (integração real seria com API dos Correios)
        base_price = 50.0
        weight_factor = weight * 2.5  # R$ 2,50 por kg
        distance_factor = 1.2 if origin_cep[:2] != destination_cep[:2] else 1.0
        
        shipping_data = {
            "service_name": "SEDEX" if service_code == "04014" else "PAC",
            "price": round(base_price + weight_factor * distance_factor, 2),
            "delivery_days": 3 if service_code == "04014" else 7,
            "origin_cep": origin_cep,
            "destination_cep": destination_cep,
            "weight": weight,
            "dimensions": dimensions,
            "calculated_at": datetime.now().isoformat()
        }
        
        self._set_cache(cache_key, shipping_data, ttl_minutes=120)
        
        return APIResponse(success=True, data=shipping_data)
    
    async def get_cep_info(self, cep: str) -> APIResponse:
        """Obter informações de CEP via ViaCEP"""
        cache_key = self._get_cache_key('cep', {'cep': cep})
        
        if self._is_cache_valid(cache_key):
            return APIResponse(success=True, data=self.cache[cache_key])
        
        url = f"{self.api_urls['via_cep']}/{cep}/json/"
        response = await self._make_request(url)
        
        if response.success and 'erro' not in response.data:
            self._set_cache(cache_key, response.data, ttl_minutes=1440)  # 24 horas
        
        return response

class CurrencyExchange(ExternalAPIManager):
    """Cotações de moedas"""
    
    async def get_exchange_rates(self, base_currency: str = 'USD') -> APIResponse:
        """Obter cotações de moedas"""
        cache_key = self._get_cache_key('currency', {'base': base_currency})
        
        if self._is_cache_valid(cache_key):
            return APIResponse(success=True, data=self.cache[cache_key])
        
        # Usar API pública de cotações
        url = f"{self.api_urls['currency']}"
        response = await self._make_request(url)
        
        if response.success:
            # Processar dados para formato padronizado
            rates_data = {
                'base': response.data.get('base', 'USD'),
                'date': response.data.get('date'),
                'rates': {
                    'BRL': response.data.get('rates', {}).get('BRL', 5.20),
                    'EUR': response.data.get('rates', {}).get('EUR', 0.85),
                    'USD': 1.0
                },
                'updated_at': datetime.now().isoformat()
            }
            
            self._set_cache(cache_key, rates_data, ttl_minutes=60)
            return APIResponse(success=True, data=rates_data)
        
        # Fallback com cotações fixas
        fallback_data = {
            'base': 'USD',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'rates': {'BRL': 5.20, 'EUR': 0.85, 'USD': 1.0},
            'updated_at': datetime.now().isoformat(),
            'source': 'fallback'
        }
        
        return APIResponse(success=True, data=fallback_data)
    
    async def convert_currency(self, amount: float, from_currency: str, 
                              to_currency: str) -> APIResponse:
        """Converter valores entre moedas"""
        rates_response = await self.get_exchange_rates()
        
        if not rates_response.success:
            return rates_response
        
        rates = rates_response.data['rates']
        
        if from_currency not in rates or to_currency not in rates:
            return APIResponse(
                success=False,
                error=f"Currency not supported: {from_currency} or {to_currency}"
            )
        
        # Converter via USD como base
        usd_amount = amount / rates[from_currency] if from_currency != 'USD' else amount
        converted_amount = usd_amount * rates[to_currency] if to_currency != 'USD' else usd_amount
        
        conversion_data = {
            'original_amount': amount,
            'converted_amount': round(converted_amount, 2),
            'from_currency': from_currency,
            'to_currency': to_currency,
            'exchange_rate': rates[to_currency] / rates[from_currency],
            'converted_at': datetime.now().isoformat()
        }
        
        return APIResponse(success=True, data=conversion_data)

class CompanyDataAPI(ExternalAPIManager):
    """API para dados de empresas (CNPJ)"""
    
    async def get_company_info(self, cnpj: str) -> APIResponse:
        """Obter informações da empresa por CNPJ"""
        # Limpar CNPJ (remover caracteres especiais)
        clean_cnpj = ''.join(filter(str.isdigit, cnpj))
        
        if len(clean_cnpj) != 14:
            return APIResponse(
                success=False,
                error="CNPJ deve ter 14 dígitos"
            )
        
        cache_key = self._get_cache_key('cnpj', {'cnpj': clean_cnpj})
        
        if self._is_cache_valid(cache_key):
            return APIResponse(success=True, data=self.cache[cache_key])
        
        url = f"{self.api_urls['cnpj']}/{clean_cnpj}"
        response = await self._make_request(url)
        
        if response.success and response.data.get('status') != 'ERROR':
            # Processar dados da empresa
            company_data = {
                'cnpj': response.data.get('cnpj'),
                'name': response.data.get('nome'),
                'trade_name': response.data.get('fantasia'),
                'legal_nature': response.data.get('natureza_juridica'),
                'status': response.data.get('situacao'),
                'address': {
                    'street': response.data.get('logradouro'),
                    'number': response.data.get('numero'),
                    'complement': response.data.get('complemento'),
                    'neighborhood': response.data.get('bairro'),
                    'city': response.data.get('municipio'),
                    'state': response.data.get('uf'),
                    'zip_code': response.data.get('cep')
                },
                'contact': {
                    'phone': response.data.get('telefone'),
                    'email': response.data.get('email')
                },
                'activities': response.data.get('atividade_principal', []),
                'updated_at': datetime.now().isoformat()
            }
            
            self._set_cache(cache_key, company_data, ttl_minutes=1440)  # 24 horas
            return APIResponse(success=True, data=company_data)
        
        return APIResponse(
            success=False,
            error="Company not found or API error"
        )

class CertificationAPI(ExternalAPIManager):
    """API para verificação de certificações"""
    
    async def verify_certification(self, cert_type: str, cert_number: str) -> APIResponse:
        """Verificar validade de certificação"""
        # Simular verificação de certificação
        # Em produção, integraria com APIs oficiais dos órgãos certificadores
        
        cert_data = {
            'certification_type': cert_type,
            'certification_number': cert_number,
            'status': 'valid',  # valid, expired, invalid
            'issued_date': '2023-01-15',
            'expiry_date': '2026-01-15',
            'issuer': self._get_cert_issuer(cert_type),
            'scope': self._get_cert_scope(cert_type),
            'verified_at': datetime.now().isoformat()
        }
        
        return APIResponse(success=True, data=cert_data)
    
    def _get_cert_issuer(self, cert_type: str) -> str:
        """Obter emissor da certificação"""
        issuers = {
            'ISO9001': 'Bureau Veritas',
            'ISO14001': 'SGS',
            'CE': 'TÜV Rheinland',
            'ATEX': 'DEKRA',
            'FDA': 'Food and Drug Administration'
        }
        return issuers.get(cert_type, 'Unknown Issuer')
    
    def _get_cert_scope(self, cert_type: str) -> str:
        """Obter escopo da certificação"""
        scopes = {
            'ISO9001': 'Quality Management Systems',
            'ISO14001': 'Environmental Management Systems',
            'CE': 'European Conformity',
            'ATEX': 'Explosive Atmospheres',
            'FDA': 'Food and Drug Safety'
        }
        return scopes.get(cert_type, 'General Certification')

class TaxCalculationAPI(ExternalAPIManager):
    """API para cálculo de impostos"""
    
    async def calculate_taxes(self, amount: float, state: str, 
                             product_type: str = 'industrial') -> APIResponse:
        """Calcular impostos brasileiros"""
        
        # Tabelas de impostos por estado (simplificado)
        icms_rates = {
            'SP': 0.18, 'RJ': 0.20, 'MG': 0.18, 'RS': 0.17,
            'PR': 0.18, 'SC': 0.17, 'BA': 0.18, 'GO': 0.17
        }
        
        icms_rate = icms_rates.get(state, 0.18)  # 18% padrão
        
        taxes = {
            'icms': {
                'rate': icms_rate,
                'amount': round(amount * icms_rate, 2),
                'description': 'Imposto sobre Circulação de Mercadorias'
            },
            'ipi': {
                'rate': 0.10,
                'amount': round(amount * 0.10, 2),
                'description': 'Imposto sobre Produtos Industrializados'
            },
            'pis': {
                'rate': 0.0165,
                'amount': round(amount * 0.0165, 2),
                'description': 'Programa de Integração Social'
            },
            'cofins': {
                'rate': 0.076,
                'amount': round(amount * 0.076, 2),
                'description': 'Contribuição para Financiamento da Seguridade Social'
            }
        }
        
        total_taxes = sum(tax['amount'] for tax in taxes.values())
        
        tax_data = {
            'base_amount': amount,
            'state': state,
            'product_type': product_type,
            'taxes': taxes,
            'total_taxes': round(total_taxes, 2),
            'final_amount': round(amount + total_taxes, 2),
            'calculated_at': datetime.now().isoformat()
        }
        
        return APIResponse(success=True, data=tax_data)

class APIOrchestrator:
    """Orquestrador para múltiplas APIs"""
    
    def __init__(self):
        self.freight_calc = FreightCalculator()
        self.currency_api = CurrencyExchange()
        self.company_api = CompanyDataAPI()
        self.cert_api = CertificationAPI()
        self.tax_api = TaxCalculationAPI()
    
    async def get_complete_quote(self, quote_params: Dict) -> Dict[str, APIResponse]:
        """Obter cotação completa com múltiplas APIs"""
        
        async with self.freight_calc, self.currency_api, self.company_api, \
                   self.cert_api, self.tax_api:
            
            tasks = []
            
            # Cotação de moedas
            tasks.append(('currency', self.currency_api.get_exchange_rates()))
            
            # Cálculo de frete
            if all(k in quote_params for k in ['origin_cep', 'destination_cep', 'weight']):
                tasks.append(('freight', self.freight_calc.calculate_shipping(
                    quote_params['origin_cep'],
                    quote_params['destination_cep'],
                    quote_params['weight'],
                    quote_params.get('dimensions', {})
                )))
            
            # Dados da empresa cliente
            if 'customer_cnpj' in quote_params:
                tasks.append(('company', self.company_api.get_company_info(
                    quote_params['customer_cnpj']
                )))
            
            # Cálculo de impostos
            if 'amount' in quote_params and 'state' in quote_params:
                tasks.append(('taxes', self.tax_api.calculate_taxes(
                    quote_params['amount'],
                    quote_params['state']
                )))
            
            # Executar todas as tarefas em paralelo
            results = {}
            for name, task in tasks:
                try:
                    results[name] = await task
                except Exception as e:
                    results[name] = APIResponse(
                        success=False,
                        error=f"Error in {name}: {str(e)}"
                    )
            
            return results
    
    async def health_check(self) -> Dict[str, bool]:
        """Verificar saúde de todas as APIs"""
        
        async with self.currency_api:
            # Testar API de cotações
            currency_health = await self.currency_api.get_exchange_rates()
            
            return {
                'currency_api': currency_health.success,
                'freight_api': True,  # Simulado
                'company_api': True,  # Simulado
                'certification_api': True,  # Simulado
                'tax_api': True  # Local
            }

# Instância global
api_orchestrator = APIOrchestrator()

# Funções de conveniência
async def get_shipping_quote(origin_cep: str, destination_cep: str, 
                           weight: float, dimensions: Dict) -> APIResponse:
    """Função de conveniência para cálculo de frete"""
    async with FreightCalculator() as calc:
        return await calc.calculate_shipping(origin_cep, destination_cep, weight, dimensions)

async def get_currency_rates() -> APIResponse:
    """Função de conveniência para cotações"""
    async with CurrencyExchange() as exchange:
        return await exchange.get_exchange_rates()

async def get_company_data(cnpj: str) -> APIResponse:
    """Função de conveniência para dados da empresa"""
    async with CompanyDataAPI() as api:
        return await api.get_company_info(cnpj)

async def calculate_brazilian_taxes(amount: float, state: str) -> APIResponse:
    """Função de conveniência para cálculo de impostos"""
    async with TaxCalculationAPI() as api:
        return await api.calculate_taxes(amount, state)
