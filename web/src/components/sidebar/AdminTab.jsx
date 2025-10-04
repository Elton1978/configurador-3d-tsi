import React, { useState } from 'react'
import useStore from '../../lib/store'

const AdminTab = () => {
  const { catalog, addCatalogVariant, ui, setUI } = useStore()
  const [activeSection, setActiveSection] = useState('products')
  const [newProduct, setNewProduct] = useState({
    name: '',
    model_code: '',
    family_id: '',
    description: '',
    price_base: '',
    dimensions: { length: '', width: '', height: '' },
    weight_kg: '',
    power_kw: '',
    capacity_per_hour: '',
    specifications: {},
    image_url: ''
  })
  const [productImage, setProductImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const families = [
    { id: 'fam_tratadora_batelada', name: 'Tratadora por Batelada (TSI)' },
    { id: 'fam_tratadora_laboratorio', name: 'Tratadora de Laboratório' },
    { id: 'fam_tratadora_fertilizantes', name: 'Tratadora de Fertilizantes' },
    { id: 'fam_aspiracao_filtragem', name: 'Aspiração e Filtragem' },
    { id: 'fam_secagem', name: 'Túnel de Secagem' },
    { id: 'fam_transporte', name: 'Sistemas de Transporte' },
    { id: 'fam_embalagem', name: 'Embalagem e Paletização' },
    { id: 'fam_acessorios', name: 'Acessórios de Processo' },
    { id: 'fam_plantas_completas', name: 'Plantas Completas' }
  ]

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProductImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSpecificationChange = (key, value) => {
    setNewProduct(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }))
  }

  const handleSubmitProduct = async () => {
    setUI({ loading: true })
    try {
      // Validações básicas
      if (!newProduct.name || !newProduct.model_code || !newProduct.family_id) {
        throw new Error('Nome, código do modelo e família são obrigatórios')
      }

      // Simular upload da imagem (implementar API depois)
      let imageUrl = ''
      if (productImage) {
        // Aqui seria feito o upload real da imagem
        imageUrl = `/images/products/${newProduct.model_code}.jpg`
      }

      const productData = {
        ...newProduct,
        id: `var_${newProduct.model_code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        price_base: parseFloat(newProduct.price_base) || 0,
        weight_kg: parseFloat(newProduct.weight_kg) || 0,
        power_kw: parseFloat(newProduct.power_kw) || 0,
        capacity_per_hour: parseFloat(newProduct.capacity_per_hour) || 0,
        dimensions: {
          length: parseFloat(newProduct.dimensions.length) || 0,
          width: parseFloat(newProduct.dimensions.width) || 0,
          height: parseFloat(newProduct.dimensions.height) || 0
        },
        image_url: imageUrl,
        created_at: new Date().toISOString()
      }

      // Adicionar ao catálogo
      addCatalogVariant(productData)

      // Limpar formulário
      setNewProduct({
        name: '',
        model_code: '',
        family_id: '',
        description: '',
        price_base: '',
        dimensions: { length: '', width: '', height: '' },
        weight_kg: '',
        power_kw: '',
        capacity_per_hour: '',
        specifications: {},
        image_url: ''
      })
      setProductImage(null)
      setImagePreview(null)

      setUI({ success: 'Produto cadastrado com sucesso!' })
    } catch (error) {
      setUI({ error: error.message })
    } finally {
      setUI({ loading: false })
    }
  }

  const renderProductForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cadastrar Novo Produto
        </h3>

        {/* Informações Básicas */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Informações Básicas</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={newProduct.name || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: LS-B18 Industrial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código do Modelo *
              </label>
              <input
                type="text"
                value={newProduct.model_code || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, model_code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: LS-B18"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Família *
              </label>
              <select
                value={newProduct.family_id || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, family_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione uma família</option>
                {families.map(family => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={newProduct.description || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Descrição detalhada do produto..."
              />
            </div>
          </div>
        </div>

        {/* Especificações Técnicas */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Especificações Técnicas</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Base (R$)
              </label>
              <input
                type="number"
                value={newProduct.price_base || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price_base: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidade (t/h)
              </label>
              <input
                type="number"
                value={newProduct.capacity_per_hour || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, capacity_per_hour: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                value={newProduct.weight_kg || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, weight_kg: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potência (kW)
              </label>
              <input
                type="number"
                value={newProduct.power_kw || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, power_kw: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Dimensões */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Dimensões (metros)</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comprimento (L)
              </label>
              <input
                type="number"
                value={newProduct.dimensions.length || ''}
                onChange={(e) => setNewProduct(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, length: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Largura (W)
              </label>
              <input
                type="number"
                value={newProduct.dimensions.width || ''}
                onChange={(e) => setNewProduct(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, width: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Altura (H)
              </label>
              <input
                type="number"
                value={newProduct.dimensions.height || ''}
                onChange={(e) => setNewProduct(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, height: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Upload de Imagem */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Imagem do Produto</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Imagem
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Especificações Adicionais */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Especificações Adicionais</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosagem de Líquidos
              </label>
              <input
                type="text"
                value={newProduct.specifications.dosagem_liquidos || ''}
                onChange={(e) => handleSpecificationChange('dosagem_liquidos', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Peristáltica com calibração automática"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosagem de Pó
              </label>
              <input
                type="text"
                value={newProduct.specifications.dosagem_po || ''}
                onChange={(e) => handleSpecificationChange('dosagem_po', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Dosador tornillo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Automação
              </label>
              <input
                type="text"
                value={newProduct.specifications.automacao || ''}
                onChange={(e) => handleSpecificationChange('automacao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: PLC + HMI, receitas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aplicações
              </label>
              <input
                type="text"
                value={newProduct.specifications.aplicacoes || ''}
                onChange={(e) => handleSpecificationChange('aplicacoes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Sementes diversas, TSI industrial"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex space-x-3">
          <button
            onClick={handleSubmitProduct}
            disabled={ui.loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {ui.loading ? 'Cadastrando...' : 'Cadastrar Produto'}
          </button>

          <button
            onClick={() => {
              setNewProduct({
                name: '',
                model_code: '',
                family_id: '',
                description: '',
                price_base: '',
                dimensions: { length: '', width: '', height: '' },
                weight_kg: '',
                power_kw: '',
                capacity_per_hour: '',
                specifications: {},
                image_url: ''
              })
              setProductImage(null)
              setImagePreview(null)
            }}
            className="px-6 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  )

  const renderProductList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Produtos Cadastrados
        </h3>
        <span className="text-sm text-gray-500">
          {catalog.variants?.length || 0} produtos
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {catalog.variants?.map(variant => (
          <div key={variant.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{variant.name}</h4>
                <p className="text-sm text-gray-600">{variant.model_code}</p>
                <p className="text-xs text-gray-500 mt-1">{variant.description}</p>
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>R$ {variant.price_base?.toLocaleString('pt-BR')}</span>
                  <span>{variant.capacity_per_hour} t/h</span>
                  <span>{variant.power_kw} kW</span>
                </div>
              </div>
              
              {variant.image_url && (
                <img
                  src={variant.image_url}
                  alt={variant.name}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-300 ml-4"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      {/* Navegação */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveSection('products')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'products'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Cadastrar Produto
        </button>
        <button
          onClick={() => setActiveSection('list')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'list'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Lista de Produtos
        </button>
      </div>

      {/* Conteúdo */}
      {activeSection === 'products' && renderProductForm()}
      {activeSection === 'list' && renderProductList()}

      {/* Mensagens de Status */}
      {ui.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{ui.error}</p>
        </div>
      )}

      {ui.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-600">{ui.success}</p>
        </div>
      )}
    </div>
  )
}

export default AdminTab
