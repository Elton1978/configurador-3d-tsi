/**
 * Sistema de Colaboração em Tempo Real
 * Implementa funcionalidades de colaboração multi-usuário com WebSocket
 */

import { EventEmitter } from 'events'

class CollaborationSystem extends EventEmitter {
  constructor() {
    super()
    this.websocket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.heartbeatTimeout = 30000
    
    // Estado da colaboração
    this.currentUser = null
    this.activeUsers = new Map()
    this.cursors = new Map()
    this.selections = new Map()
    this.comments = new Map()
    this.changes = []
    this.changeHistory = []
    
    // Configurações
    this.config = {
      autoReconnect: true,
      syncInterval: 100,
      maxChangesBuffer: 1000,
      conflictResolution: 'last-write-wins' // 'last-write-wins', 'merge', 'manual'
    }
    
    this.initializeEventHandlers()
  }

  /**
   * Inicializar manipuladores de eventos
   */
  initializeEventHandlers() {
    // Eventos de conexão
    this.on('connected', () => {
      console.log('🔗 Colaboração conectada')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.startHeartbeat()
    })

    this.on('disconnected', () => {
      console.log('❌ Colaboração desconectada')
      this.isConnected = false
      this.stopHeartbeat()
      
      if (this.config.autoReconnect) {
        this.scheduleReconnect()
      }
    })

    // Eventos de usuários
    this.on('user-joined', (user) => {
      this.activeUsers.set(user.id, user)
      console.log(`👤 Usuário entrou: ${user.name}`)
    })

    this.on('user-left', (userId) => {
      const user = this.activeUsers.get(userId)
      this.activeUsers.delete(userId)
      this.cursors.delete(userId)
      this.selections.delete(userId)
      console.log(`👋 Usuário saiu: ${user?.name || userId}`)
    })

    // Eventos de mudanças
    this.on('change-received', (change) => {
      this.applyChange(change)
    })

    this.on('conflict-detected', (conflict) => {
      this.handleConflict(conflict)
    })
  }

  /**
   * Conectar ao servidor de colaboração
   * @param {string} url - URL do WebSocket
   * @param {Object} user - Dados do usuário
   * @param {string} projectId - ID do projeto
   */
  async connect(url, user, projectId) {
    if (this.websocket) {
      this.disconnect()
    }

    this.currentUser = user
    this.projectId = projectId

    try {
      this.websocket = new WebSocket(`${url}?project=${projectId}&user=${user.id}`)
      
      this.websocket.onopen = () => {
        this.emit('connected')
        this.sendMessage('join', {
          user: this.currentUser,
          projectId: this.projectId
        })
      }

      this.websocket.onclose = () => {
        this.emit('disconnected')
      }

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }

    } catch (error) {
      console.error('Erro ao conectar:', error)
      this.emit('error', error)
    }
  }

  /**
   * Desconectar do servidor
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    
    this.stopHeartbeat()
    this.isConnected = false
    this.activeUsers.clear()
    this.cursors.clear()
    this.selections.clear()
  }

  /**
   * Enviar mensagem para o servidor
   * @param {string} type - Tipo da mensagem
   * @param {Object} data - Dados da mensagem
   */
  sendMessage(type, data) {
    if (!this.isConnected || !this.websocket) {
      console.warn('WebSocket não conectado')
      return false
    }

    const message = {
      type,
      data,
      timestamp: Date.now(),
      userId: this.currentUser?.id,
      projectId: this.projectId
    }

    try {
      this.websocket.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      return false
    }
  }

  /**
   * Manipular mensagem recebida
   * @param {Object} message - Mensagem recebida
   */
  handleMessage(message) {
    const { type, data, userId, timestamp } = message

    switch (type) {
      case 'user-joined':
        this.emit('user-joined', data.user)
        break

      case 'user-left':
        this.emit('user-left', data.userId)
        break

      case 'cursor-moved':
        this.updateCursor(userId, data.position)
        break

      case 'selection-changed':
        this.updateSelection(userId, data.selection)
        break

      case 'change':
        this.emit('change-received', { ...data, userId, timestamp })
        break

      case 'comment-added':
        this.addComment(data.comment)
        break

      case 'comment-updated':
        this.updateComment(data.commentId, data.updates)
        break

      case 'comment-deleted':
        this.deleteComment(data.commentId)
        break

      case 'project-locked':
        this.emit('project-locked', data)
        break

      case 'project-unlocked':
        this.emit('project-unlocked', data)
        break

      case 'conflict':
        this.emit('conflict-detected', data)
        break

      case 'sync-state':
        this.syncState(data.state)
        break

      case 'pong':
        // Resposta do heartbeat
        break

      default:
        console.warn('Tipo de mensagem desconhecido:', type)
    }
  }

  /**
   * Atualizar posição do cursor de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} position - Posição do cursor
   */
  updateCursor(userId, position) {
    if (userId === this.currentUser?.id) return

    this.cursors.set(userId, {
      position,
      timestamp: Date.now(),
      user: this.activeUsers.get(userId)
    })

    this.emit('cursor-updated', { userId, position })
  }

  /**
   * Atualizar seleção de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} selection - Seleção do usuário
   */
  updateSelection(userId, selection) {
    if (userId === this.currentUser?.id) return

    this.selections.set(userId, {
      selection,
      timestamp: Date.now(),
      user: this.activeUsers.get(userId)
    })

    this.emit('selection-updated', { userId, selection })
  }

  /**
   * Enviar movimento do cursor
   * @param {Object} position - Posição do cursor
   */
  sendCursorMove(position) {
    this.sendMessage('cursor-move', { position })
  }

  /**
   * Enviar mudança de seleção
   * @param {Object} selection - Seleção atual
   */
  sendSelectionChange(selection) {
    this.sendMessage('selection-change', { selection })
  }

  /**
   * Enviar mudança no projeto
   * @param {Object} change - Mudança a ser enviada
   */
  sendChange(change) {
    const changeWithId = {
      id: this.generateChangeId(),
      ...change,
      userId: this.currentUser?.id,
      timestamp: Date.now()
    }

    // Adicionar ao buffer local
    this.changes.push(changeWithId)
    
    // Limitar tamanho do buffer
    if (this.changes.length > this.config.maxChangesBuffer) {
      this.changes = this.changes.slice(-this.config.maxChangesBuffer / 2)
    }

    // Enviar para o servidor
    this.sendMessage('change', changeWithId)

    return changeWithId.id
  }

  /**
   * Aplicar mudança recebida
   * @param {Object} change - Mudança a ser aplicada
   */
  applyChange(change) {
    // Verificar conflitos
    const conflict = this.detectConflict(change)
    if (conflict) {
      this.emit('conflict-detected', conflict)
      return
    }

    // Aplicar mudança
    this.changeHistory.push(change)
    this.emit('change-applied', change)

    // Limitar histórico
    if (this.changeHistory.length > this.config.maxChangesBuffer) {
      this.changeHistory = this.changeHistory.slice(-this.config.maxChangesBuffer / 2)
    }
  }

  /**
   * Detectar conflitos entre mudanças
   * @param {Object} incomingChange - Mudança recebida
   * @returns {Object|null} - Conflito detectado ou null
   */
  detectConflict(incomingChange) {
    // Buscar mudanças locais que podem conflitar
    const conflictingChanges = this.changes.filter(localChange => {
      return (
        localChange.target === incomingChange.target &&
        localChange.timestamp > incomingChange.timestamp - 5000 && // 5 segundos de janela
        localChange.userId !== incomingChange.userId
      )
    })

    if (conflictingChanges.length > 0) {
      return {
        type: 'concurrent-edit',
        incomingChange,
        conflictingChanges,
        resolution: this.config.conflictResolution
      }
    }

    return null
  }

  /**
   * Manipular conflito detectado
   * @param {Object} conflict - Conflito a ser resolvido
   */
  handleConflict(conflict) {
    switch (conflict.resolution) {
      case 'last-write-wins':
        // Aplicar mudança mais recente
        if (conflict.incomingChange.timestamp > conflict.conflictingChanges[0].timestamp) {
          this.applyChange(conflict.incomingChange)
        }
        break

      case 'merge':
        // Tentar fazer merge automático
        const mergedChange = this.mergeChanges(conflict.incomingChange, conflict.conflictingChanges[0])
        if (mergedChange) {
          this.applyChange(mergedChange)
        } else {
          // Se não conseguir fazer merge, escalar para resolução manual
          this.emit('manual-resolution-required', conflict)
        }
        break

      case 'manual':
        // Sempre requer resolução manual
        this.emit('manual-resolution-required', conflict)
        break
    }
  }

  /**
   * Fazer merge de mudanças conflitantes
   * @param {Object} change1 - Primeira mudança
   * @param {Object} change2 - Segunda mudança
   * @returns {Object|null} - Mudança mesclada ou null se não possível
   */
  mergeChanges(change1, change2) {
    // Implementar lógica de merge específica para diferentes tipos de mudança
    if (change1.type === 'block-move' && change2.type === 'block-move') {
      // Para movimentação de blocos, usar posição média
      return {
        ...change1,
        data: {
          ...change1.data,
          position: {
            x: (change1.data.position.x + change2.data.position.x) / 2,
            y: (change1.data.position.y + change2.data.position.y) / 2,
            z: (change1.data.position.z + change2.data.position.z) / 2
          }
        },
        merged: true,
        originalChanges: [change1.id, change2.id]
      }
    }

    // Outros tipos de merge podem ser implementados aqui
    return null
  }

  /**
   * Adicionar comentário
   * @param {Object} comment - Comentário a ser adicionado
   */
  addComment(comment) {
    this.comments.set(comment.id, comment)
    this.emit('comment-added', comment)
  }

  /**
   * Atualizar comentário
   * @param {string} commentId - ID do comentário
   * @param {Object} updates - Atualizações do comentário
   */
  updateComment(commentId, updates) {
    const comment = this.comments.get(commentId)
    if (comment) {
      Object.assign(comment, updates)
      this.emit('comment-updated', comment)
    }
  }

  /**
   * Deletar comentário
   * @param {string} commentId - ID do comentário
   */
  deleteComment(commentId) {
    const comment = this.comments.get(commentId)
    if (comment) {
      this.comments.delete(commentId)
      this.emit('comment-deleted', comment)
    }
  }

  /**
   * Enviar comentário
   * @param {Object} commentData - Dados do comentário
   */
  sendComment(commentData) {
    const comment = {
      id: this.generateCommentId(),
      ...commentData,
      userId: this.currentUser?.id,
      userName: this.currentUser?.name,
      timestamp: Date.now()
    }

    this.sendMessage('add-comment', { comment })
    return comment.id
  }

  /**
   * Responder a comentário
   * @param {string} parentCommentId - ID do comentário pai
   * @param {string} content - Conteúdo da resposta
   */
  replyToComment(parentCommentId, content) {
    return this.sendComment({
      content,
      parentId: parentCommentId,
      type: 'reply'
    })
  }

  /**
   * Sincronizar estado com o servidor
   * @param {Object} serverState - Estado do servidor
   */
  syncState(serverState) {
    // Atualizar usuários ativos
    this.activeUsers.clear()
    serverState.activeUsers?.forEach(user => {
      this.activeUsers.set(user.id, user)
    })

    // Atualizar comentários
    this.comments.clear()
    serverState.comments?.forEach(comment => {
      this.comments.set(comment.id, comment)
    })

    // Sincronizar mudanças
    if (serverState.changes) {
      this.changeHistory = serverState.changes
    }

    this.emit('state-synced', serverState)
  }

  /**
   * Iniciar heartbeat
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage('ping', { timestamp: Date.now() })
    }, this.heartbeatTimeout)
  }

  /**
   * Parar heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Agendar reconexão
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido')
      this.emit('max-reconnect-attempts-reached')
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect(this.websocketUrl, this.currentUser, this.projectId)
      }
    }, delay)
  }

  /**
   * Gerar ID único para mudança
   * @returns {string} - ID da mudança
   */
  generateChangeId() {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Gerar ID único para comentário
   * @returns {string} - ID do comentário
   */
  generateCommentId() {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Obter usuários ativos
   * @returns {Array} - Lista de usuários ativos
   */
  getActiveUsers() {
    return Array.from(this.activeUsers.values())
  }

  /**
   * Obter cursors de outros usuários
   * @returns {Array} - Lista de cursors
   */
  getOtherCursors() {
    return Array.from(this.cursors.entries())
      .filter(([userId]) => userId !== this.currentUser?.id)
      .map(([userId, cursor]) => ({ userId, ...cursor }))
  }

  /**
   * Obter seleções de outros usuários
   * @returns {Array} - Lista de seleções
   */
  getOtherSelections() {
    return Array.from(this.selections.entries())
      .filter(([userId]) => userId !== this.currentUser?.id)
      .map(([userId, selection]) => ({ userId, ...selection }))
  }

  /**
   * Obter comentários do projeto
   * @returns {Array} - Lista de comentários
   */
  getComments() {
    return Array.from(this.comments.values())
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Obter estatísticas da colaboração
   * @returns {Object} - Estatísticas
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      activeUsersCount: this.activeUsers.size,
      totalChanges: this.changeHistory.length,
      totalComments: this.comments.size,
      reconnectAttempts: this.reconnectAttempts,
      currentUser: this.currentUser
    }
  }

  /**
   * Limpar dados da colaboração
   */
  cleanup() {
    this.disconnect()
    this.activeUsers.clear()
    this.cursors.clear()
    this.selections.clear()
    this.comments.clear()
    this.changes = []
    this.changeHistory = []
    this.removeAllListeners()
  }
}

// Instância singleton
const collaborationSystem = new CollaborationSystem()

// Hooks React para colaboração
export const useCollaboration = (projectId) => {
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState([])
  const [comments, setComments] = useState([])

  useEffect(() => {
    const handleConnected = () => setIsConnected(true)
    const handleDisconnected = () => setIsConnected(false)
    const handleUserJoined = () => setActiveUsers(collaborationSystem.getActiveUsers())
    const handleUserLeft = () => setActiveUsers(collaborationSystem.getActiveUsers())
    const handleCommentAdded = () => setComments(collaborationSystem.getComments())

    collaborationSystem.on('connected', handleConnected)
    collaborationSystem.on('disconnected', handleDisconnected)
    collaborationSystem.on('user-joined', handleUserJoined)
    collaborationSystem.on('user-left', handleUserLeft)
    collaborationSystem.on('comment-added', handleCommentAdded)

    return () => {
      collaborationSystem.off('connected', handleConnected)
      collaborationSystem.off('disconnected', handleDisconnected)
      collaborationSystem.off('user-joined', handleUserJoined)
      collaborationSystem.off('user-left', handleUserLeft)
      collaborationSystem.off('comment-added', handleCommentAdded)
    }
  }, [])

  const connect = useCallback((url, user) => {
    return collaborationSystem.connect(url, user, projectId)
  }, [projectId])

  const sendChange = useCallback((change) => {
    return collaborationSystem.sendChange(change)
  }, [])

  const addComment = useCallback((commentData) => {
    return collaborationSystem.sendComment(commentData)
  }, [])

  return {
    isConnected,
    activeUsers,
    comments,
    connect,
    disconnect: () => collaborationSystem.disconnect(),
    sendChange,
    addComment,
    sendCursorMove: (position) => collaborationSystem.sendCursorMove(position),
    sendSelectionChange: (selection) => collaborationSystem.sendSelectionChange(selection),
    getStats: () => collaborationSystem.getStats()
  }
}

export const useCollaborativeCursor = () => {
  const [cursors, setCursors] = useState([])

  useEffect(() => {
    const handleCursorUpdated = () => {
      setCursors(collaborationSystem.getOtherCursors())
    }

    collaborationSystem.on('cursor-updated', handleCursorUpdated)
    
    return () => {
      collaborationSystem.off('cursor-updated', handleCursorUpdated)
    }
  }, [])

  return cursors
}

export const useCollaborativeSelection = () => {
  const [selections, setSelections] = useState([])

  useEffect(() => {
    const handleSelectionUpdated = () => {
      setSelections(collaborationSystem.getOtherSelections())
    }

    collaborationSystem.on('selection-updated', handleSelectionUpdated)
    
    return () => {
      collaborationSystem.off('selection-updated', handleSelectionUpdated)
    }
  }, [])

  return selections
}

export default collaborationSystem

// Funções de conveniência
export const connectToProject = (url, user, projectId) => {
  return collaborationSystem.connect(url, user, projectId)
}

export const disconnectFromProject = () => {
  collaborationSystem.disconnect()
}

export const sendProjectChange = (change) => {
  return collaborationSystem.sendChange(change)
}

export const addProjectComment = (commentData) => {
  return collaborationSystem.sendComment(commentData)
}
