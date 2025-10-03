import React, { useState } from 'react'
import useStore from '../../lib/store'

const BlocksTab = () => {
  const { blockCatalog, projectBlocks, addProjectBlock, selectedBlock, setSelectedBlock } = useStore()
  const [selectedFamily, setSelectedFamily] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar variantes baseado na família selecionada e termo de busca
  const filteredVariants = blockCatalog.variants.filter(variant => {
    const matchesFamily = !selectedFamily || variant.family_id === selectedFamily
    const matchesSearch = !searchTerm || 
      variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.model_code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFamily && matchesSearch
  })

  const handleAddBlock = (variant) => {
    const newBlock = {
      id: Date.now().toString(),
      variant_id: variant.id,
      variant: variant,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      instance_name: `${variant.name} ${projectBlocks.length + 1}`
    }
    addProjectBlock(newBlock)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Filtros */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Catálogo de Blocos
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome ou código do modelo..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Família
            </label>
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as famílias</option>
              {blockCatalog.families.map(family => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Variantes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Equipamentos Disponíveis
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredVariants.map(variant => {
            const family = blockCatalog.families.find(f => f.id === variant.family_id)
            return (
              <div
                key={variant.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {variant.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {family?.name} • {variant.model_code}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {variant.capacity && (
                        <div>
                          <span className="text-gray-500">Capacidade:</span>
                          <span className="ml-1 font-medium">{variant.capacity} t/h</span>
                        </div>
                      )}
                      {variant.efficiency && (
                        <div>
                          <span className="text-gray-500">Eficiência:</span>
                          <span className="ml-1 font-medium">{(variant.efficiency * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Preço:</span>
                        <span className="ml-1 font-medium">
                          R$ {variant.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {variant.dimensions && (
                        <div>
                          <span className="text-gray-500">Dimensões:</span>
                          <span className="ml-1 font-medium">
                            {variant.dimensions.length}×{variant.dimensions.width}×{variant.dimensions.height}m
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddBlock(variant)}
                    className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )
          })}
          
          {filteredVariants.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>Nenhum equipamento encontrado</p>
              <p className="text-sm">Tente ajustar os filtros</p>
            </div>
          )}
        </div>
      </div>

      {/* Blocos no Projeto */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Blocos no Projeto ({projectBlocks.length})
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {projectBlocks.map(block => (
            <div
              key={block.id}
              onClick={() => setSelectedBlock(block)}
              className={`
                border rounded-lg p-2 cursor-pointer transition-all text-sm
                ${selectedBlock?.id === block.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-medium text-gray-900">
                {block.instance_name}
              </div>
              <div className="text-xs text-gray-500">
                {block.variant.model_code}
              </div>
              <div className="text-xs text-gray-500">
                Posição: ({block.position.x.toFixed(1)}, {block.position.y.toFixed(1)}, {block.position.z.toFixed(1)})
              </div>
            </div>
          ))}
          
          {projectBlocks.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">Nenhum bloco adicionado</p>
            </div>
          )}
        </div>
      </div>

      {/* Propriedades do Bloco Selecionado */}
      {selectedBlock && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Propriedades
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Instância
              </label>
              <input
                type="text"
                value={selectedBlock.instance_name}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">X (m)</label>
                <input
                  type="number"
                  value={selectedBlock.position.x}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Y (m)</label>
                <input
                  type="number"
                  value={selectedBlock.position.y}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Z (m)</label>
                <input
                  type="number"
                  value={selectedBlock.position.z}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  step="0.1"
                />
              </div>
            </div>
            
            <button className="w-full bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition-colors">
              Remover Bloco
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlocksTab
