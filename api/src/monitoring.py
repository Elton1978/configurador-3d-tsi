"""
Sistema de Monitoramento e Métricas
Coleta e analisa métricas de performance, uso e saúde do sistema
"""

import time
import psutil
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import json
import logging
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from fastapi.responses import PlainTextResponse
import asyncpg

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Métricas Prometheus
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Active database connections')
MEMORY_USAGE = Gauge('memory_usage_bytes', 'Memory usage in bytes')
CPU_USAGE = Gauge('cpu_usage_percent', 'CPU usage percentage')
DISK_USAGE = Gauge('disk_usage_percent', 'Disk usage percentage')
API_CALLS = Counter('api_calls_total', 'Total API calls', ['api_name', 'status'])
CACHE_HITS = Counter('cache_hits_total', 'Total cache hits', ['cache_type'])
CACHE_MISSES = Counter('cache_misses_total', 'Total cache misses', ['cache_type'])
ACTIVE_USERS = Gauge('active_users', 'Number of active users')
PROJECTS_COUNT = Gauge('projects_total', 'Total number of projects')
PROPOSALS_COUNT = Gauge('proposals_total', 'Total number of proposals')

@dataclass
class SystemMetric:
    """Métrica do sistema"""
    name: str
    value: float
    unit: str
    timestamp: datetime
    labels: Optional[Dict[str, str]] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class PerformanceMetric:
    """Métrica de performance"""
    operation: str
    duration: float
    success: bool
    timestamp: datetime
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class ErrorMetric:
    """Métrica de erro"""
    error_type: str
    error_message: str
    stack_trace: Optional[str]
    timestamp: datetime
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class MetricsCollector:
    """Coletor de métricas do sistema"""
    
    def __init__(self):
        self.metrics_buffer = deque(maxlen=10000)
        self.performance_buffer = deque(maxlen=5000)
        self.error_buffer = deque(maxlen=1000)
        self.alerts = []
        
        # Configurações de alertas
        self.alert_thresholds = {
            'cpu_usage': 80.0,
            'memory_usage': 85.0,
            'disk_usage': 90.0,
            'response_time': 5.0,
            'error_rate': 5.0,
            'active_connections': 100
        }
        
        # Histórico de métricas agregadas
        self.hourly_metrics = defaultdict(list)
        self.daily_metrics = defaultdict(list)
        
        self.start_background_tasks()
    
    def start_background_tasks(self):
        """Iniciar tarefas de background"""
        asyncio.create_task(self.collect_system_metrics())
        asyncio.create_task(self.process_metrics_buffer())
        asyncio.create_task(self.check_alerts())
    
    async def collect_system_metrics(self):
        """Coletar métricas do sistema periodicamente"""
        while True:
            try:
                # CPU
                cpu_percent = psutil.cpu_percent(interval=1)
                CPU_USAGE.set(cpu_percent)
                self.record_metric('cpu_usage', cpu_percent, 'percent')
                
                # Memória
                memory = psutil.virtual_memory()
                MEMORY_USAGE.set(memory.used)
                self.record_metric('memory_usage', memory.percent, 'percent')
                self.record_metric('memory_available', memory.available, 'bytes')
                
                # Disco
                disk = psutil.disk_usage('/')
                DISK_USAGE.set(disk.percent)
                self.record_metric('disk_usage', disk.percent, 'percent')
                self.record_metric('disk_free', disk.free, 'bytes')
                
                # Rede
                network = psutil.net_io_counters()
                self.record_metric('network_bytes_sent', network.bytes_sent, 'bytes')
                self.record_metric('network_bytes_recv', network.bytes_recv, 'bytes')
                
                # Processos
                process_count = len(psutil.pids())
                self.record_metric('process_count', process_count, 'count')
                
                await asyncio.sleep(30)  # Coletar a cada 30 segundos
                
            except Exception as e:
                logger.error(f"Erro ao coletar métricas do sistema: {e}")
                await asyncio.sleep(60)
    
    async def collect_database_metrics(self, db_pool):
        """Coletar métricas do banco de dados"""
        try:
            # Conexões ativas
            active_connections = db_pool.get_size()
            ACTIVE_CONNECTIONS.set(active_connections)
            self.record_metric('db_active_connections', active_connections, 'count')
            
            # Estatísticas do banco
            async with db_pool.acquire() as conn:
                # Número de projetos
                projects_count = await conn.fetchval("SELECT COUNT(*) FROM projects")
                PROJECTS_COUNT.set(projects_count)
                self.record_metric('projects_count', projects_count, 'count')
                
                # Número de propostas
                proposals_count = await conn.fetchval("SELECT COUNT(*) FROM proposals")
                PROPOSALS_COUNT.set(proposals_count)
                self.record_metric('proposals_count', proposals_count, 'count')
                
                # Usuários ativos (últimas 24h)
                active_users = await conn.fetchval(
                    "SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE last_activity > $1",
                    datetime.utcnow() - timedelta(hours=24)
                )
                ACTIVE_USERS.set(active_users)
                self.record_metric('active_users_24h', active_users, 'count')
                
        except Exception as e:
            logger.error(f"Erro ao coletar métricas do banco: {e}")
    
    def record_metric(self, name: str, value: float, unit: str, 
                     labels: Optional[Dict[str, str]] = None,
                     metadata: Optional[Dict[str, Any]] = None):
        """Registrar métrica"""
        metric = SystemMetric(
            name=name,
            value=value,
            unit=unit,
            timestamp=datetime.utcnow(),
            labels=labels,
            metadata=metadata
        )
        
        self.metrics_buffer.append(metric)
    
    def record_performance(self, operation: str, duration: float, success: bool,
                          user_id: Optional[str] = None,
                          metadata: Optional[Dict[str, Any]] = None):
        """Registrar métrica de performance"""
        perf_metric = PerformanceMetric(
            operation=operation,
            duration=duration,
            success=success,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            metadata=metadata
        )
        
        self.performance_buffer.append(perf_metric)
        
        # Atualizar métricas Prometheus
        REQUEST_DURATION.observe(duration)
    
    def record_error(self, error_type: str, error_message: str,
                    stack_trace: Optional[str] = None,
                    user_id: Optional[str] = None,
                    request_id: Optional[str] = None,
                    metadata: Optional[Dict[str, Any]] = None):
        """Registrar erro"""
        error_metric = ErrorMetric(
            error_type=error_type,
            error_message=error_message,
            stack_trace=stack_trace,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            request_id=request_id,
            metadata=metadata
        )
        
        self.error_buffer.append(error_metric)
    
    async def process_metrics_buffer(self):
        """Processar buffer de métricas"""
        while True:
            try:
                current_time = datetime.utcnow()
                
                # Processar métricas do buffer
                metrics_to_process = []
                while self.metrics_buffer and len(metrics_to_process) < 100:
                    metrics_to_process.append(self.metrics_buffer.popleft())
                
                if metrics_to_process:
                    await self.aggregate_metrics(metrics_to_process)
                
                await asyncio.sleep(60)  # Processar a cada minuto
                
            except Exception as e:
                logger.error(f"Erro ao processar buffer de métricas: {e}")
                await asyncio.sleep(60)
    
    async def aggregate_metrics(self, metrics: List[SystemMetric]):
        """Agregar métricas por hora e dia"""
        for metric in metrics:
            hour_key = metric.timestamp.replace(minute=0, second=0, microsecond=0)
            day_key = metric.timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Agregar por hora
            self.hourly_metrics[f"{metric.name}_{hour_key}"].append(metric.value)
            
            # Agregar por dia
            self.daily_metrics[f"{metric.name}_{day_key}"].append(metric.value)
        
        # Limitar tamanho dos históricos
        self.cleanup_old_aggregations()
    
    def cleanup_old_aggregations(self):
        """Limpar agregações antigas"""
        cutoff_time = datetime.utcnow() - timedelta(days=7)
        
        # Limpar métricas horárias antigas
        keys_to_remove = []
        for key in self.hourly_metrics:
            if any(datetime.fromisoformat(key.split('_')[-1]) < cutoff_time for key in [key]):
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.hourly_metrics[key]
        
        # Limpar métricas diárias antigas (manter 30 dias)
        cutoff_time_daily = datetime.utcnow() - timedelta(days=30)
        keys_to_remove = []
        for key in self.daily_metrics:
            if any(datetime.fromisoformat(key.split('_')[-1]) < cutoff_time_daily for key in [key]):
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.daily_metrics[key]
    
    async def check_alerts(self):
        """Verificar condições de alerta"""
        while True:
            try:
                current_time = datetime.utcnow()
                
                # Verificar métricas recentes
                recent_metrics = [m for m in self.metrics_buffer 
                                if current_time - m.timestamp < timedelta(minutes=5)]
                
                # Agrupar por nome de métrica
                metrics_by_name = defaultdict(list)
                for metric in recent_metrics:
                    metrics_by_name[metric.name].append(metric.value)
                
                # Verificar thresholds
                for metric_name, threshold in self.alert_thresholds.items():
                    if metric_name in metrics_by_name:
                        values = metrics_by_name[metric_name]
                        if values:
                            avg_value = sum(values) / len(values)
                            if avg_value > threshold:
                                await self.trigger_alert(metric_name, avg_value, threshold)
                
                # Verificar taxa de erro
                recent_errors = [e for e in self.error_buffer 
                               if current_time - e.timestamp < timedelta(minutes=5)]
                recent_requests = [p for p in self.performance_buffer 
                                 if current_time - p.timestamp < timedelta(minutes=5)]
                
                if recent_requests:
                    error_rate = (len(recent_errors) / len(recent_requests)) * 100
                    if error_rate > self.alert_thresholds['error_rate']:
                        await self.trigger_alert('error_rate', error_rate, 
                                               self.alert_thresholds['error_rate'])
                
                await asyncio.sleep(300)  # Verificar a cada 5 minutos
                
            except Exception as e:
                logger.error(f"Erro ao verificar alertas: {e}")
                await asyncio.sleep(300)
    
    async def trigger_alert(self, metric_name: str, current_value: float, threshold: float):
        """Disparar alerta"""
        alert = {
            'id': f"alert_{int(time.time())}",
            'metric': metric_name,
            'current_value': current_value,
            'threshold': threshold,
            'severity': self.get_alert_severity(metric_name, current_value, threshold),
            'timestamp': datetime.utcnow().isoformat(),
            'message': f"{metric_name} está em {current_value:.2f}, acima do threshold de {threshold:.2f}"
        }
        
        self.alerts.append(alert)
        
        # Limitar número de alertas
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-50:]
        
        logger.warning(f"ALERTA: {alert['message']}")
        
        # Aqui você pode integrar com sistemas de notificação
        # await self.send_alert_notification(alert)
    
    def get_alert_severity(self, metric_name: str, current_value: float, threshold: float) -> str:
        """Determinar severidade do alerta"""
        ratio = current_value / threshold
        
        if ratio > 1.5:
            return 'critical'
        elif ratio > 1.2:
            return 'high'
        elif ratio > 1.1:
            return 'medium'
        else:
            return 'low'
    
    def get_metrics_summary(self, time_range: str = '1h') -> Dict[str, Any]:
        """Obter resumo das métricas"""
        cutoff_time = datetime.utcnow()
        
        if time_range == '1h':
            cutoff_time -= timedelta(hours=1)
        elif time_range == '24h':
            cutoff_time -= timedelta(hours=24)
        elif time_range == '7d':
            cutoff_time -= timedelta(days=7)
        
        # Filtrar métricas por tempo
        recent_metrics = [m for m in self.metrics_buffer if m.timestamp > cutoff_time]
        recent_performance = [p for p in self.performance_buffer if p.timestamp > cutoff_time]
        recent_errors = [e for e in self.error_buffer if e.timestamp > cutoff_time]
        
        # Calcular estatísticas
        metrics_by_name = defaultdict(list)
        for metric in recent_metrics:
            metrics_by_name[metric.name].append(metric.value)
        
        summary = {
            'time_range': time_range,
            'timestamp': datetime.utcnow().isoformat(),
            'system_metrics': {},
            'performance': {
                'total_requests': len(recent_performance),
                'successful_requests': len([p for p in recent_performance if p.success]),
                'failed_requests': len([p for p in recent_performance if not p.success]),
                'average_response_time': 0,
                'p95_response_time': 0,
                'p99_response_time': 0
            },
            'errors': {
                'total_errors': len(recent_errors),
                'error_rate': 0,
                'error_types': defaultdict(int)
            },
            'alerts': {
                'active_alerts': len([a for a in self.alerts 
                                    if datetime.fromisoformat(a['timestamp']) > cutoff_time]),
                'critical_alerts': len([a for a in self.alerts 
                                      if a['severity'] == 'critical' and 
                                      datetime.fromisoformat(a['timestamp']) > cutoff_time])
            }
        }
        
        # Calcular estatísticas das métricas do sistema
        for name, values in metrics_by_name.items():
            if values:
                summary['system_metrics'][name] = {
                    'current': values[-1] if values else 0,
                    'average': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values),
                    'count': len(values)
                }
        
        # Calcular estatísticas de performance
        if recent_performance:
            durations = [p.duration for p in recent_performance]
            durations.sort()
            
            summary['performance']['average_response_time'] = sum(durations) / len(durations)
            
            if len(durations) > 0:
                p95_index = int(len(durations) * 0.95)
                p99_index = int(len(durations) * 0.99)
                summary['performance']['p95_response_time'] = durations[p95_index]
                summary['performance']['p99_response_time'] = durations[p99_index]
        
        # Calcular taxa de erro
        if recent_performance:
            summary['errors']['error_rate'] = (len(recent_errors) / len(recent_performance)) * 100
        
        # Contar tipos de erro
        for error in recent_errors:
            summary['errors']['error_types'][error.error_type] += 1
        
        return summary
    
    def get_health_status(self) -> Dict[str, Any]:
        """Obter status de saúde do sistema"""
        recent_metrics = [m for m in self.metrics_buffer 
                         if datetime.utcnow() - m.timestamp < timedelta(minutes=5)]
        
        # Calcular métricas atuais
        current_metrics = {}
        metrics_by_name = defaultdict(list)
        for metric in recent_metrics:
            metrics_by_name[metric.name].append(metric.value)
        
        for name, values in metrics_by_name.items():
            if values:
                current_metrics[name] = values[-1]
        
        # Determinar status geral
        status = 'healthy'
        issues = []
        
        # Verificar CPU
        cpu_usage = current_metrics.get('cpu_usage', 0)
        if cpu_usage > 90:
            status = 'critical'
            issues.append(f"CPU usage muito alto: {cpu_usage:.1f}%")
        elif cpu_usage > 80:
            status = 'warning'
            issues.append(f"CPU usage alto: {cpu_usage:.1f}%")
        
        # Verificar memória
        memory_usage = current_metrics.get('memory_usage', 0)
        if memory_usage > 95:
            status = 'critical'
            issues.append(f"Memory usage crítico: {memory_usage:.1f}%")
        elif memory_usage > 85:
            if status != 'critical':
                status = 'warning'
            issues.append(f"Memory usage alto: {memory_usage:.1f}%")
        
        # Verificar disco
        disk_usage = current_metrics.get('disk_usage', 0)
        if disk_usage > 95:
            status = 'critical'
            issues.append(f"Disk usage crítico: {disk_usage:.1f}%")
        elif disk_usage > 90:
            if status != 'critical':
                status = 'warning'
            issues.append(f"Disk usage alto: {disk_usage:.1f}%")
        
        # Verificar alertas ativos
        active_alerts = [a for a in self.alerts 
                        if datetime.utcnow() - datetime.fromisoformat(a['timestamp']) < timedelta(minutes=10)]
        
        critical_alerts = [a for a in active_alerts if a['severity'] == 'critical']
        if critical_alerts:
            status = 'critical'
            issues.extend([a['message'] for a in critical_alerts])
        
        return {
            'status': status,
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': time.time() - psutil.boot_time(),
            'current_metrics': current_metrics,
            'active_alerts': len(active_alerts),
            'critical_alerts': len(critical_alerts),
            'issues': issues
        }

# Instância global
metrics_collector = MetricsCollector()

# Middleware para coleta automática de métricas
class MetricsMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = time.time()
            request = Request(scope, receive)
            
            # Processar request
            response = await self.app(scope, receive, send)
            
            # Calcular duração
            duration = time.time() - start_time
            
            # Registrar métricas
            method = request.method
            path = request.url.path
            status_code = getattr(response, 'status_code', 200)
            
            REQUEST_COUNT.labels(method=method, endpoint=path, status=status_code).inc()
            REQUEST_DURATION.observe(duration)
            
            metrics_collector.record_performance(
                operation=f"{method} {path}",
                duration=duration,
                success=200 <= status_code < 400,
                metadata={'status_code': status_code}
            )
            
            return response
        else:
            return await self.app(scope, receive, send)

# Endpoints para métricas
async def get_metrics():
    """Endpoint para métricas Prometheus"""
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

async def get_health():
    """Endpoint para health check"""
    return metrics_collector.get_health_status()

async def get_metrics_summary(time_range: str = '1h'):
    """Endpoint para resumo das métricas"""
    return metrics_collector.get_metrics_summary(time_range)

# Funções de conveniência
def record_api_call(api_name: str, success: bool, duration: float):
    """Registrar chamada de API"""
    status = 'success' if success else 'error'
    API_CALLS.labels(api_name=api_name, status=status).inc()
    
    metrics_collector.record_performance(
        operation=f"api_call_{api_name}",
        duration=duration,
        success=success
    )

def record_cache_hit(cache_type: str):
    """Registrar cache hit"""
    CACHE_HITS.labels(cache_type=cache_type).inc()

def record_cache_miss(cache_type: str):
    """Registrar cache miss"""
    CACHE_MISSES.labels(cache_type=cache_type).inc()

def record_custom_metric(name: str, value: float, unit: str = 'count'):
    """Registrar métrica customizada"""
    metrics_collector.record_metric(name, value, unit)

def record_error(error_type: str, error_message: str, **kwargs):
    """Registrar erro"""
    metrics_collector.record_error(error_type, error_message, **kwargs)
