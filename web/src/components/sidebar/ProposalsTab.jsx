import React from 'react'
import useStore from '../../lib/store'

const ProposalsTab = () => {
  const { 
    proposals, 
    selectedProposal, 
    setSelectedProposal, 
    generateProposals, 
    projectBlocks,
    ui 
  } = useStore()

  const handleGenerateProposals = () => {
    if (projectBlocks.length === 0) {
      alert('Adicione pelo menos um bloco ao projeto antes de gerar propostas.')
      return
    }
    generateProposals()
  }

  const handleApplyProposal = (proposal) => {
    setSelectedProposal(proposal)
    // Implementar aplicação do layout da proposta
    console.log('Aplicando proposta:', proposal)
  }

  const getKPIColor = (kpi, value) => {
    switch (kpi) {
      case 'violations':
        return value === 0 ? 'text-green-600' : 'text-red-600'
      case 'efficiency':
        return value >= 0.9 ? 'text-green-600' : value >= 0.8 ? 'text-yellow-600' : 'text-red-600'
      default:
        return 'text-gray-900'
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Geração de Propostas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Auto-Propostas
        </h3>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Gere automaticamente 3 propostas otimizadas com diferentes estratégias:
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span><strong>Melhor Desempenho:</strong> Maximiza capacidade e eficiência</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span><strong>Menor Custo:</strong> Minimiza investimento total</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span><strong>Ajuste ao Local:</strong> Otimiza uso do espaço</span>
            </div>
          </div>
          
          <button
            onClick={handleGenerateProposals}
            disabled={ui.loading || projectBlocks.length === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {ui.loading ? 'Gerando Propostas...' : 'Gerar Propostas'}
          </button>
          
          {projectBlocks.length === 0 && (
            <p className="text-xs text-red-500 text-center">
              Adicione blocos ao projeto primeiro
            </p>
          )}
        </div>
      </div>

      {/* Lista de Propostas */}
      {proposals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Propostas Geradas ({proposals.length})
          </h3>
          
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <div
                key={proposal.id}
                className={`
                  proposal-card border rounded-lg p-4 cursor-pointer
                  ${selectedProposal?.id === proposal.id 
                    ? 'selected border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedProposal(proposal)}
              >
                {/* Header da Proposta */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`
                      w-3 h-3 rounded-full
                      ${proposal.proposal_type === 'performance_optimized' ? 'bg-blue-500' :
                        proposal.proposal_type === 'cost_optimized' ? 'bg-green-500' :
                        'bg-purple-500'}
                    `}></div>
                    <h4 className="font-medium text-gray-900">
                      {proposal.proposal_name}
                    </h4>
                  </div>
                  
                  <span className="text-sm text-gray-500">
                    #{index + 1}
                  </span>
                </div>

                {/* KPIs */}
                {proposal.kpis && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {proposal.kpis.capacity || 0}
                      </div>
                      <div className="text-xs text-gray-500">Capacidade (t/h)</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${getKPIColor('efficiency', proposal.kpis.efficiency)}`}>
                        {proposal.kpis.efficiency ? (proposal.kpis.efficiency * 100).toFixed(0) : 0}%
                      </div>
                      <div className="text-xs text-gray-500">Eficiência</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {proposal.kpis.area || 0}
                      </div>
                      <div className="text-xs text-gray-500">Área (m²)</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${getKPIColor('violations', proposal.kpis.violations)}`}>
                        {proposal.kpis.violations || 0}
                      </div>
                      <div className="text-xs text-gray-500">Violações</div>
                    </div>
                  </div>
                )}

                {/* Preço */}
                <div className="border-t pt-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Custo Total:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      R$ {proposal.total_price.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleApplyProposal(proposal)
                    }}
                    className="flex-1 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Aplicar
                  </button>
                  
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposta Selecionada */}
      {selectedProposal && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Proposta Ativa
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">
                {selectedProposal.proposal_name}
              </h4>
              <span className="text-sm text-blue-600">
                Aplicada
              </span>
            </div>
            
            <p className="text-sm text-blue-700 mb-3">
              Esta proposta está sendo exibida no viewport 3D. 
              Você pode fazer ajustes manuais ou gerar novas propostas.
            </p>
            
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                Salvar Layout
              </button>
              
              <button className="flex-1 bg-white text-blue-600 border border-blue-600 py-1 px-3 rounded text-sm hover:bg-blue-50 transition-colors">
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configurações
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Algoritmo</span>
            <select className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="simulated_annealing">Simulated Annealing</option>
              <option value="genetic">Algoritmo Genético</option>
              <option value="greedy">Busca Gulosa</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Iterações Máx.</span>
            <input
              type="number"
              defaultValue={1000}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Timeout (s)</span>
            <input
              type="number"
              defaultValue={30}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalsTab
