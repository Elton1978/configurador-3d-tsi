import React, { useState } from 'react'
import useStore from '../../lib/store'

const ProjectTab = () => {
  const { currentProject, setCurrentProject, ui, setUI } = useStore()
  const [projectName, setProjectName] = useState(currentProject?.name || 'Novo Projeto')
  const [description, setDescription] = useState(currentProject?.description || '')

  const handleCreateProject = async () => {
    setUI({ loading: true })
    try {
      const newProject = {
        name: projectName,
        description: description,
        barracao_dimensions: { length: 40, width: 20, height: 8 },
        requirements: { capacity: 12, efficiency_min: 0.9 }
      }
      
      // Simular criação do projeto (implementar API depois)
      const project = {
        id: Date.now().toString(),
        ...newProject,
        created_at: new Date().toISOString(),
        status: 'draft'
      }
      
      setCurrentProject(project)
    } catch (error) {
      setUI({ error: error.message })
    } finally {
      setUI({ loading: false })
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Informações do Projeto */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informações do Projeto
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Projeto
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome do projeto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o projeto..."
            />
          </div>
        </div>
      </div>

      {/* Requisitos */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Requisitos do Sistema
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Capacidade (t/h)</span>
            <input
              type="number"
              defaultValue={12}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Eficiência Mín. (%)</span>
            <input
              type="number"
              defaultValue={90}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Orçamento Máx. (R$)</span>
            <input
              type="number"
              defaultValue={500000}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Status do Projeto */}
      {currentProject && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ID</span>
              <span className="text-sm font-mono text-gray-900">
                {currentProject.id}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${currentProject.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                  currentProject.status === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'}
              `}>
                {currentProject.status === 'draft' ? 'Rascunho' :
                 currentProject.status === 'active' ? 'Ativo' : 'Concluído'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Criado em</span>
              <span className="text-sm text-gray-900">
                {new Date(currentProject.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="space-y-3">
        {!currentProject ? (
          <button
            onClick={handleCreateProject}
            disabled={ui.loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {ui.loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        ) : (
          <>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              Salvar Alterações
            </button>
            
            <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors">
              Duplicar Projeto
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectTab
