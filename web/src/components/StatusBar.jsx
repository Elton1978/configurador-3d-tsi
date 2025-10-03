import React from 'react'
import useStore from '../lib/store'

const StatusBar = () => {
  const { 
    currentProject, 
    projectBlocks, 
    selectedProposal, 
    ui 
  } = useStore()

  // Calcular estatísticas do projeto
  const stats = {
    totalBlocks: projectBlocks.length,
    totalCost: projectBlocks.reduce((sum, block) => sum + (block.variant?.price || 0), 0),
    totalWeight: projectBlocks.reduce((sum, block) => sum + (block.variant?.weight || 0), 0),
    violations: 0 // Implementar detecção de violações
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between">
        {/* Informações do Projeto */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Projeto:</span>
            <span className="font-medium text-gray-900">
              {currentProject?.name || 'Sem projeto'}
            </span>
            {currentProject && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${currentProject.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  currentProject.status === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'}
              `}>
                {currentProject.status === 'draft' ? 'Rascunho' :
                 currentProject.status === 'active' ? 'Ativo' : 'Concluído'}
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Blocos:</span>
            <span className="font-medium text-gray-900">{stats.totalBlocks}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Custo:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(stats.totalCost)}
            </span>
          </div>

          {stats.totalWeight > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Peso:</span>
              <span className="font-medium text-gray-900">
                {stats.totalWeight.toFixed(0)} kg
              </span>
            </div>
          )}
        </div>

        {/* Status e Validações */}
        <div className="flex items-center space-x-4 text-sm">
          {/* Proposta Ativa */}
          {selectedProposal && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Proposta:</span>
              <span className="font-medium text-blue-600">
                {selectedProposal.proposal_name}
              </span>
            </div>
          )}

          <div className="h-4 w-px bg-gray-300"></div>

          {/* Validações */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className={`
                w-2 h-2 rounded-full
                ${stats.violations === 0 ? 'bg-green-500' : 'bg-red-500'}
              `}></div>
              <span className="text-gray-500">Colisões:</span>
              <span className={`
                font-medium
                ${stats.violations === 0 ? 'text-green-600' : 'text-red-600'}
              `}>
                {stats.violations}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-500">Limites:</span>
              <span className="font-medium text-green-600">OK</span>
            </div>

            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-gray-500">Clearances:</span>
              <span className="font-medium text-yellow-600">Aviso</span>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          {/* Performance */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">FPS:</span>
            <span className="font-medium text-gray-900">60</span>
          </div>

          {/* Loading Indicator */}
          {ui.loading && (
            <div className="flex items-center space-x-2">
              <div className="loading-spinner w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-blue-600">Processando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatusBar
