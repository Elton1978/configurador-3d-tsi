import React, { useState } from 'react'
import useStore from '../../lib/store'

const BarracaoTab = () => {
  const { barracao, setBarracao } = useStore()
  const [dimensions, setDimensions] = useState(barracao.dimensions)

  const handleDimensionChange = (key, value) => {
    const newDimensions = { ...dimensions, [key]: parseFloat(value) || 0 }
    setDimensions(newDimensions)
    setBarracao({ ...barracao, dimensions: newDimensions })
  }

  return (
    <div className="p-4 space-y-6">
      {/* Dimensões do Barracão */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dimensões do Barracão
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comprimento (m)
            </label>
            <input
              type="number"
              value={dimensions.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="100"
              step="0.5"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Largura (m)
            </label>
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="50"
              step="0.5"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altura (m)
            </label>
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="4"
              max="15"
              step="0.5"
            />
          </div>
        </div>
      </div>

      {/* Informações Calculadas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informações
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Área Total</span>
            <span className="text-sm font-medium text-gray-900">
              {(dimensions.length * dimensions.width).toFixed(1)} m²
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Volume</span>
            <span className="text-sm font-medium text-gray-900">
              {(dimensions.length * dimensions.width * dimensions.height).toFixed(1)} m³
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Perímetro</span>
            <span className="text-sm font-medium text-gray-900">
              {(2 * (dimensions.length + dimensions.width)).toFixed(1)} m
            </span>
          </div>
        </div>
      </div>

      {/* Pilares */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pilares
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Espaçamento (m)</span>
            <input
              type="number"
              defaultValue={6}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="4"
              max="10"
              step="0.5"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Seção (cm)</span>
            <select className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="30x30">30x30</option>
              <option value="40x40">40x40</option>
              <option value="50x50">50x50</option>
            </select>
          </div>
          
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm">
            Gerar Pilares Automaticamente
          </button>
        </div>
      </div>

      {/* Portas e Aberturas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Portas e Aberturas
        </h3>
        
        <div className="space-y-3">
          <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm">
            + Adicionar Porta
          </button>
          
          <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors text-sm">
            + Adicionar Janela
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            Nenhuma abertura definida
          </div>
        </div>
      </div>

      {/* Validações */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Validações
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Dimensões válidas</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Área suficiente</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Pilares não definidos</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarracaoTab
