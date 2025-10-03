import React, { useMemo } from 'react'
import useStore from '../../lib/store'

const BOMTab = () => {
  const { projectBlocks, selectedProposal } = useStore()

  // Calcular totais do BOM
  const bomData = useMemo(() => {
    const items = projectBlocks.map(block => ({
      id: block.id,
      name: block.instance_name,
      model: block.variant.model_code,
      family: block.variant.family_name || 'N/A',
      quantity: 1,
      unitPrice: block.variant.price,
      totalPrice: block.variant.price,
      weight: block.variant.weight || 0,
      dimensions: block.variant.dimensions
    }))

    const totals = items.reduce((acc, item) => ({
      totalPrice: acc.totalPrice + item.totalPrice,
      totalWeight: acc.totalWeight + item.weight,
      totalItems: acc.totalItems + item.quantity
    }), { totalPrice: 0, totalWeight: 0, totalItems: 0 })

    return { items, totals }
  }, [projectBlocks])

  const handleExport = (format) => {
    console.log(`Exportando BOM em formato ${format}`)
    // Implementar exportação
  }

  return (
    <div className="p-4 space-y-6">
      {/* Resumo */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo do Orçamento
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total de Itens:</span>
            <span className="font-semibold text-gray-900">
              {bomData.totals.totalItems}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Peso Total:</span>
            <span className="font-semibold text-gray-900">
              {bomData.totals.totalWeight.toFixed(0)} kg
            </span>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-900">Valor Total:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {bomData.totals.totalPrice.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bill of Materials (BOM)
        </h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bomData.items.map(item => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {item.model} • {item.family}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    R$ {item.totalPrice.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.quantity}x R$ {item.unitPrice.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                {item.weight > 0 && (
                  <div>
                    <span>Peso: {item.weight} kg</span>
                  </div>
                )}
                {item.dimensions && (
                  <div>
                    <span>
                      {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height}m
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {bomData.items.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>Nenhum item no projeto</p>
              <p className="text-sm">Adicione blocos para gerar o BOM</p>
            </div>
          )}
        </div>
      </div>

      {/* Análise de Custos */}
      {bomData.items.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Análise de Custos
          </h3>
          
          <div className="space-y-3">
            {/* Distribuição por Família */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">
                Distribuição por Família
              </h4>
              
              <div className="space-y-1">
                {Object.entries(
                  bomData.items.reduce((acc, item) => {
                    acc[item.family] = (acc[item.family] || 0) + item.totalPrice
                    return acc
                  }, {})
                ).map(([family, total]) => {
                  const percentage = (total / bomData.totals.totalPrice * 100).toFixed(1)
                  return (
                    <div key={family} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{family}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900">
                          R$ {total.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Margem e Impostos */}
            <div className="bg-yellow-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">
                Custos Adicionais (Estimativa)
              </h4>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Instalação (15%)</span>
                  <span className="text-gray-900">
                    R$ {(bomData.totals.totalPrice * 0.15).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Comissionamento (5%)</span>
                  <span className="text-gray-900">
                    R$ {(bomData.totals.totalPrice * 0.05).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Impostos (12%)</span>
                  <span className="text-gray-900">
                    R$ {(bomData.totals.totalPrice * 0.12).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="border-t pt-1 mt-2">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-gray-900">Total Estimado</span>
                    <span className="text-gray-900">
                      R$ {(bomData.totals.totalPrice * 1.32).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ações de Exportação */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Exportar Documentos
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => handleExport('pdf')}
            disabled={bomData.items.length === 0}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <span>📄</span>
            <span>Exportar Orçamento (PDF)</span>
          </button>
          
          <button
            onClick={() => handleExport('xlsx')}
            disabled={bomData.items.length === 0}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <span>📊</span>
            <span>Exportar BOM (XLSX)</span>
          </button>
          
          <button
            onClick={() => handleExport('glb')}
            disabled={bomData.items.length === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <span>🎯</span>
            <span>Exportar Modelo 3D (GLB)</span>
          </button>
        </div>
      </div>

      {/* Informações da Proposta */}
      {selectedProposal && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Proposta Ativa
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">
                {selectedProposal.proposal_name}
              </div>
              <div className="text-blue-700">
                Valor da Proposta: R$ {selectedProposal.total_price.toLocaleString('pt-BR')}
              </div>
              {selectedProposal.kpis && (
                <div className="text-blue-600 text-xs mt-1">
                  Capacidade: {selectedProposal.kpis.capacity} t/h • 
                  Eficiência: {(selectedProposal.kpis.efficiency * 100).toFixed(0)}% • 
                  Violações: {selectedProposal.kpis.violations}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BOMTab
