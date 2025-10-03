import React from 'react'
import useStore from '../../lib/store'

const ViewportControls = () => {
  const { ui, setUI, generateProposals, projectBlocks } = useStore()

  const controls = [
    {
      id: 'grid',
      label: 'Grid',
      icon: '⊞',
      active: ui.showGrid,
      onClick: () => setUI({ showGrid: !ui.showGrid })
    },
    {
      id: 'connectors',
      label: 'Conectores',
      icon: '🔗',
      active: ui.showConnectors,
      onClick: () => setUI({ showConnectors: !ui.showConnectors })
    },
    {
      id: 'ghost',
      label: 'Ghost Mode',
      icon: '👻',
      active: ui.ghostMode,
      onClick: () => setUI({ ghostMode: !ui.ghostMode })
    }
  ]

  const actions = [
    {
      id: 'validate',
      label: 'Validar Colisões',
      icon: '⚠️',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      onClick: () => console.log('Validando colisões...')
    },
    {
      id: 'calculate',
      label: 'Recalcular Orçamento',
      icon: '💰',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => console.log('Recalculando orçamento...')
    },
    {
      id: 'proposals',
      label: 'Gerar Propostas',
      icon: '💡',
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => generateProposals(),
      disabled: projectBlocks.length === 0
    }
  ]

  return (
    <>
      {/* Controles de Visualização - Canto Superior Esquerdo */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs text-gray-500 mb-2 px-1">Visualização</div>
          <div className="flex flex-col space-y-1">
            {controls.map(control => (
              <button
                key={control.id}
                onClick={control.onClick}
                className={`
                  control-button flex items-center space-x-2 px-3 py-2 text-sm
                  ${control.active ? 'active' : ''}
                `}
                title={control.label}
              >
                <span>{control.icon}</span>
                <span>{control.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ações Rápidas - Canto Superior Direito */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs text-gray-500 mb-2 px-1">Ações Rápidas</div>
          <div className="flex flex-col space-y-1">
            {actions.map(action => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  ${action.color} text-white px-3 py-2 rounded text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors flex items-center space-x-2
                `}
                title={action.label}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Informações da Câmera - Canto Inferior Esquerdo */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Câmera</div>
          <div className="text-xs text-gray-700 space-y-1">
            <div>Posição: (15, 15, 15)</div>
            <div>Alvo: (0, 0, 0)</div>
            <div>Zoom: 100%</div>
          </div>
        </div>
      </div>

      {/* Medições - Canto Inferior Direito */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="text-xs text-gray-500 mb-2">Ferramentas</div>
          <div className="flex space-x-2">
            <button className="control-button p-2" title="Medir Distância">
              📏
            </button>
            <button className="control-button p-2" title="Medir Área">
              📐
            </button>
            <button className="control-button p-2" title="Medir Volume">
              📦
            </button>
            <button className="control-button p-2" title="Screenshot">
              📷
            </button>
          </div>
        </div>
      </div>

      {/* Navegação 3D - Centro Direito */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs text-gray-500 mb-2 text-center">Navegação</div>
          <div className="grid grid-cols-3 gap-1">
            {/* Controles de Rotação */}
            <div></div>
            <button className="control-button p-2 text-xs" title="Rotacionar Para Cima">
              ↑
            </button>
            <div></div>
            
            <button className="control-button p-2 text-xs" title="Rotacionar Esquerda">
              ←
            </button>
            <button className="control-button p-2 text-xs" title="Reset Câmera">
              🎯
            </button>
            <button className="control-button p-2 text-xs" title="Rotacionar Direita">
              →
            </button>
            
            <div></div>
            <button className="control-button p-2 text-xs" title="Rotacionar Para Baixo">
              ↓
            </button>
            <div></div>
          </div>
          
          <div className="mt-2 flex space-x-1">
            <button className="control-button p-1 text-xs flex-1" title="Zoom In">
              +
            </button>
            <button className="control-button p-1 text-xs flex-1" title="Zoom Out">
              -
            </button>
          </div>
        </div>
      </div>

      {/* Vistas Predefinidas - Centro Inferior */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs text-gray-500 mb-2 text-center">Vistas</div>
          <div className="flex space-x-1">
            <button className="control-button px-3 py-1 text-xs" title="Vista Frontal">
              Frontal
            </button>
            <button className="control-button px-3 py-1 text-xs" title="Vista Superior">
              Superior
            </button>
            <button className="control-button px-3 py-1 text-xs" title="Vista Lateral">
              Lateral
            </button>
            <button className="control-button px-3 py-1 text-xs" title="Vista Isométrica">
              ISO
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ViewportControls
