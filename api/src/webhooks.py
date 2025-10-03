"""
Sistema de Webhooks e Notificações
Gerencia notificações em tempo real e webhooks para eventos do sistema
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import logging
from urllib.parse import urlparse

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EventType(Enum):
    """Tipos de eventos do sistema"""
    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_DELETED = "project.deleted"
    BLOCK_ADDED = "block.added"
    BLOCK_UPDATED = "block.updated"
    BLOCK_REMOVED = "block.removed"
    PROPOSAL_GENERATED = "proposal.generated"
    PROPOSAL_APPROVED = "proposal.approved"
    PROPOSAL_REJECTED = "proposal.rejected"
    PRICING_CALCULATED = "pricing.calculated"
    CONFIGURATION_CHANGED = "configuration.changed"
    USER_REGISTERED = "user.registered"
    USER_LOGIN = "user.login"
    SYSTEM_ERROR = "system.error"
    API_CALL = "api.call"

class NotificationChannel(Enum):
    """Canais de notificação"""
    EMAIL = "email"
    SMS = "sms"
    WEBHOOK = "webhook"
    WEBSOCKET = "websocket"
    SLACK = "slack"
    TEAMS = "teams"

@dataclass
class Event:
    """Evento do sistema"""
    id: str
    type: EventType
    source: str
    timestamp: datetime
    data: Dict[str, Any]
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class WebhookEndpoint:
    """Endpoint de webhook"""
    id: str
    url: str
    events: List[EventType]
    active: bool = True
    secret: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    retry_count: int = 3
    timeout: int = 30
    created_at: Optional[datetime] = None

@dataclass
class Notification:
    """Notificação"""
    id: str
    event_id: str
    channel: NotificationChannel
    recipient: str
    subject: str
    content: str
    status: str = "pending"  # pending, sent, failed
    attempts: int = 0
    created_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None

class EventBus:
    """Barramento de eventos"""
    
    def __init__(self):
        self.subscribers: Dict[EventType, List[Callable]] = {}
        self.event_history: List[Event] = []
        self.max_history = 1000
    
    def subscribe(self, event_type: EventType, callback: Callable):
        """Inscrever callback para tipo de evento"""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)
        logger.info(f"Subscribed to {event_type.value}")
    
    def unsubscribe(self, event_type: EventType, callback: Callable):
        """Cancelar inscrição"""
        if event_type in self.subscribers:
            try:
                self.subscribers[event_type].remove(callback)
                logger.info(f"Unsubscribed from {event_type.value}")
            except ValueError:
                pass
    
    async def publish(self, event: Event):
        """Publicar evento"""
        # Adicionar ao histórico
        self.event_history.append(event)
        if len(self.event_history) > self.max_history:
            self.event_history.pop(0)
        
        # Notificar subscribers
        if event.type in self.subscribers:
            tasks = []
            for callback in self.subscribers[event.type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        tasks.append(callback(event))
                    else:
                        callback(event)
                except Exception as e:
                    logger.error(f"Error in event callback: {e}")
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info(f"Published event: {event.type.value}")
    
    def get_history(self, event_type: Optional[EventType] = None, 
                   user_id: Optional[str] = None,
                   project_id: Optional[str] = None,
                   limit: int = 100) -> List[Event]:
        """Obter histórico de eventos"""
        filtered_events = self.event_history
        
        if event_type:
            filtered_events = [e for e in filtered_events if e.type == event_type]
        
        if user_id:
            filtered_events = [e for e in filtered_events if e.user_id == user_id]
        
        if project_id:
            filtered_events = [e for e in filtered_events if e.project_id == project_id]
        
        return filtered_events[-limit:]

class WebhookManager:
    """Gerenciador de webhooks"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.endpoints: Dict[str, WebhookEndpoint] = {}
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Inscrever-se em todos os eventos
        for event_type in EventType:
            self.event_bus.subscribe(event_type, self.handle_event)
    
    async def __aenter__(self):
        """Context manager para sessão HTTP"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Fechar sessão HTTP"""
        if self.session:
            await self.session.close()
    
    def register_webhook(self, endpoint: WebhookEndpoint):
        """Registrar endpoint de webhook"""
        self.endpoints[endpoint.id] = endpoint
        logger.info(f"Registered webhook: {endpoint.url}")
    
    def unregister_webhook(self, endpoint_id: str):
        """Cancelar registro de webhook"""
        if endpoint_id in self.endpoints:
            del self.endpoints[endpoint_id]
            logger.info(f"Unregistered webhook: {endpoint_id}")
    
    async def handle_event(self, event: Event):
        """Processar evento e enviar webhooks"""
        for endpoint in self.endpoints.values():
            if endpoint.active and event.type in endpoint.events:
                await self.send_webhook(endpoint, event)
    
    async def send_webhook(self, endpoint: WebhookEndpoint, event: Event):
        """Enviar webhook para endpoint"""
        if not self.session:
            logger.error("HTTP session not initialized")
            return
        
        payload = {
            "event": {
                "id": event.id,
                "type": event.type.value,
                "source": event.source,
                "timestamp": event.timestamp.isoformat(),
                "data": event.data,
                "user_id": event.user_id,
                "project_id": event.project_id,
                "metadata": event.metadata
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Configurador-3D-TSI-Webhook/1.0"
        }
        
        if endpoint.headers:
            headers.update(endpoint.headers)
        
        if endpoint.secret:
            # Adicionar assinatura HMAC
            import hmac
            import hashlib
            
            payload_str = json.dumps(payload, separators=(',', ':'))
            signature = hmac.new(
                endpoint.secret.encode(),
                payload_str.encode(),
                hashlib.sha256
            ).hexdigest()
            headers["X-Webhook-Signature"] = f"sha256={signature}"
        
        for attempt in range(endpoint.retry_count):
            try:
                async with self.session.post(
                    endpoint.url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=endpoint.timeout)
                ) as response:
                    if 200 <= response.status < 300:
                        logger.info(f"Webhook sent successfully to {endpoint.url}")
                        return
                    else:
                        logger.warning(f"Webhook failed with status {response.status}: {endpoint.url}")
                        
            except Exception as e:
                logger.error(f"Webhook attempt {attempt + 1} failed: {e}")
                
                if attempt < endpoint.retry_count - 1:
                    # Backoff exponencial
                    await asyncio.sleep(2 ** attempt)
        
        logger.error(f"Webhook failed after {endpoint.retry_count} attempts: {endpoint.url}")

class NotificationManager:
    """Gerenciador de notificações"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.notifications: List[Notification] = []
        self.templates: Dict[str, Dict[str, str]] = {}
        
        # Carregar templates padrão
        self.load_default_templates()
        
        # Inscrever-se em eventos relevantes
        notification_events = [
            EventType.PROJECT_CREATED,
            EventType.PROPOSAL_GENERATED,
            EventType.PROPOSAL_APPROVED,
            EventType.USER_REGISTERED,
            EventType.SYSTEM_ERROR
        ]
        
        for event_type in notification_events:
            self.event_bus.subscribe(event_type, self.handle_notification_event)
    
    def load_default_templates(self):
        """Carregar templates padrão de notificação"""
        self.templates = {
            "project_created": {
                "subject": "Novo projeto criado: {project_name}",
                "content": """
                Olá {user_name},
                
                Seu projeto "{project_name}" foi criado com sucesso.
                
                Detalhes:
                - ID do Projeto: {project_id}
                - Data de Criação: {created_at}
                - Aplicação: {application}
                
                Você pode acessar seu projeto através do configurador.
                
                Atenciosamente,
                Equipe TSI
                """
            },
            "proposal_generated": {
                "subject": "Proposta gerada: {proposal_number}",
                "content": """
                Olá {user_name},
                
                Uma nova proposta foi gerada para o projeto "{project_name}".
                
                Detalhes da Proposta:
                - Número: {proposal_number}
                - Valor Total: R$ {total_value:,.2f}
                - Válida até: {valid_until}
                
                A proposta está disponível para download no sistema.
                
                Atenciosamente,
                Equipe TSI
                """
            },
            "user_registered": {
                "subject": "Bem-vindo ao Configurador 3D TSI",
                "content": """
                Olá {user_name},
                
                Bem-vindo ao Configurador 3D TSI!
                
                Sua conta foi criada com sucesso. Agora você pode:
                - Criar projetos de sistemas industriais
                - Configurar equipamentos em 3D
                - Gerar propostas comerciais
                - Calcular preços em tempo real
                
                Comece criando seu primeiro projeto!
                
                Atenciosamente,
                Equipe TSI
                """
            },
            "system_error": {
                "subject": "Alerta do Sistema - {error_type}",
                "content": """
                Alerta do Sistema Configurador 3D TSI
                
                Tipo de Erro: {error_type}
                Timestamp: {timestamp}
                Usuário: {user_id}
                Projeto: {project_id}
                
                Detalhes:
                {error_details}
                
                Este é um alerta automático do sistema.
                """
            }
        }
    
    async def handle_notification_event(self, event: Event):
        """Processar evento para notificações"""
        template_key = event.type.value.replace('.', '_')
        
        if template_key in self.templates:
            # Determinar destinatários baseado no evento
            recipients = await self.get_event_recipients(event)
            
            for recipient in recipients:
                notification = await self.create_notification(
                    event, recipient, template_key
                )
                if notification:
                    await self.send_notification(notification)
    
    async def get_event_recipients(self, event: Event) -> List[Dict[str, str]]:
        """Obter destinatários para um evento"""
        recipients = []
        
        # Lógica para determinar destinatários baseado no tipo de evento
        if event.type == EventType.USER_REGISTERED:
            recipients.append({
                "channel": NotificationChannel.EMAIL.value,
                "address": event.data.get("email", ""),
                "name": event.data.get("full_name", "Usuário")
            })
        
        elif event.type in [EventType.PROJECT_CREATED, EventType.PROPOSAL_GENERATED]:
            # Notificar o dono do projeto
            recipients.append({
                "channel": NotificationChannel.EMAIL.value,
                "address": event.data.get("user_email", ""),
                "name": event.data.get("user_name", "Usuário")
            })
        
        elif event.type == EventType.SYSTEM_ERROR:
            # Notificar administradores
            recipients.append({
                "channel": NotificationChannel.EMAIL.value,
                "address": "admin@tsi.com.br",
                "name": "Administrador"
            })
        
        return recipients
    
    async def create_notification(self, event: Event, recipient: Dict[str, str], 
                                template_key: str) -> Optional[Notification]:
        """Criar notificação a partir de evento"""
        template = self.templates.get(template_key)
        if not template:
            return None
        
        # Preparar dados para template
        template_data = {
            **event.data,
            "timestamp": event.timestamp.strftime("%d/%m/%Y %H:%M:%S"),
            "event_id": event.id,
            "user_name": recipient.get("name", "Usuário")
        }
        
        try:
            subject = template["subject"].format(**template_data)
            content = template["content"].format(**template_data)
            
            notification = Notification(
                id=str(uuid.uuid4()),
                event_id=event.id,
                channel=NotificationChannel(recipient["channel"]),
                recipient=recipient["address"],
                subject=subject,
                content=content,
                created_at=datetime.utcnow()
            )
            
            self.notifications.append(notification)
            return notification
            
        except KeyError as e:
            logger.error(f"Template formatting error: {e}")
            return None
    
    async def send_notification(self, notification: Notification):
        """Enviar notificação"""
        notification.attempts += 1
        
        try:
            if notification.channel == NotificationChannel.EMAIL:
                success = await self.send_email(notification)
            elif notification.channel == NotificationChannel.SMS:
                success = await self.send_sms(notification)
            elif notification.channel == NotificationChannel.SLACK:
                success = await self.send_slack(notification)
            else:
                logger.warning(f"Unsupported notification channel: {notification.channel}")
                success = False
            
            if success:
                notification.status = "sent"
                notification.sent_at = datetime.utcnow()
                logger.info(f"Notification sent: {notification.id}")
            else:
                notification.status = "failed"
                logger.error(f"Failed to send notification: {notification.id}")
                
        except Exception as e:
            notification.status = "failed"
            logger.error(f"Error sending notification {notification.id}: {e}")
    
    async def send_email(self, notification: Notification) -> bool:
        """Enviar email (simulado)"""
        # Em produção, integraria com serviço de email como SendGrid, SES, etc.
        logger.info(f"📧 Email sent to {notification.recipient}: {notification.subject}")
        return True
    
    async def send_sms(self, notification: Notification) -> bool:
        """Enviar SMS (simulado)"""
        # Em produção, integraria com serviço de SMS como Twilio
        logger.info(f"📱 SMS sent to {notification.recipient}")
        return True
    
    async def send_slack(self, notification: Notification) -> bool:
        """Enviar mensagem Slack (simulado)"""
        # Em produção, integraria com Slack API
        logger.info(f"💬 Slack message sent to {notification.recipient}")
        return True

class WebSocketManager:
    """Gerenciador de WebSocket para notificações em tempo real"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.connections: Dict[str, Any] = {}  # websocket connections por user_id
        
        # Inscrever-se em todos os eventos para broadcast
        for event_type in EventType:
            self.event_bus.subscribe(event_type, self.broadcast_event)
    
    def add_connection(self, user_id: str, websocket):
        """Adicionar conexão WebSocket"""
        self.connections[user_id] = websocket
        logger.info(f"WebSocket connected for user: {user_id}")
    
    def remove_connection(self, user_id: str):
        """Remover conexão WebSocket"""
        if user_id in self.connections:
            del self.connections[user_id]
            logger.info(f"WebSocket disconnected for user: {user_id}")
    
    async def broadcast_event(self, event: Event):
        """Broadcast evento para conexões WebSocket"""
        if not self.connections:
            return
        
        message = {
            "type": "event",
            "data": {
                "id": event.id,
                "type": event.type.value,
                "timestamp": event.timestamp.isoformat(),
                "data": event.data
            }
        }
        
        # Enviar para usuário específico ou broadcast geral
        target_users = []
        
        if event.user_id:
            target_users = [event.user_id]
        else:
            # Eventos globais para todos os usuários conectados
            target_users = list(self.connections.keys())
        
        for user_id in target_users:
            if user_id in self.connections:
                try:
                    websocket = self.connections[user_id]
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending WebSocket message to {user_id}: {e}")
                    # Remover conexão inválida
                    self.remove_connection(user_id)

# Instâncias globais
event_bus = EventBus()
webhook_manager = WebhookManager(event_bus)
notification_manager = NotificationManager(event_bus)
websocket_manager = WebSocketManager(event_bus)

# Funções de conveniência
async def emit_event(event_type: EventType, source: str, data: Dict[str, Any],
                    user_id: Optional[str] = None, project_id: Optional[str] = None):
    """Emitir evento no sistema"""
    event = Event(
        id=str(uuid.uuid4()),
        type=event_type,
        source=source,
        timestamp=datetime.utcnow(),
        data=data,
        user_id=user_id,
        project_id=project_id
    )
    
    await event_bus.publish(event)

def register_webhook_endpoint(url: str, events: List[EventType], 
                            secret: Optional[str] = None) -> str:
    """Registrar endpoint de webhook"""
    endpoint = WebhookEndpoint(
        id=str(uuid.uuid4()),
        url=url,
        events=events,
        secret=secret,
        created_at=datetime.utcnow()
    )
    
    webhook_manager.register_webhook(endpoint)
    return endpoint.id

async def send_custom_notification(channel: NotificationChannel, recipient: str,
                                 subject: str, content: str) -> str:
    """Enviar notificação customizada"""
    notification = Notification(
        id=str(uuid.uuid4()),
        event_id="custom",
        channel=channel,
        recipient=recipient,
        subject=subject,
        content=content,
        created_at=datetime.utcnow()
    )
    
    await notification_manager.send_notification(notification)
    return notification.id
