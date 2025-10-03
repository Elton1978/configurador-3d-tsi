import React from 'react'
import useStore from '../lib/store'
import ProjectTab from './sidebar/ProjectTab'
import BarracaoTab from './sidebar/BarracaoTab'
import BlocksTab from './sidebar/BlocksTab'
import ProposalsTab from './sidebar/ProposalsTab'
import BOMTab from './sidebar/BOMTab'

const Sidebar = () => {
  const { ui, setUI } = useStore()

  const tabs = [
    { id: 'projeto', label: 'Projeto', icon: '📋' },
    { id: 'barracao', label: 'Barracão', icon: '🏭' },
    { id: 'blocos', label: 'Blocos', icon: '🧱' },
    { id: 'propostas', label: 'Propostas', icon: '💡' },
    { id: 'bom', label: 'BOM/Preço', icon: '💰' }
  ]

  const renderTabContent = () => {
    switch (ui.activeTab) {
      case 'projeto':
        return <ProjectTab />
      case 'barracao':
        return <BarracaoTab />
      case 'blocos':
        return <BlocksTab />
      case 'propostas':
        return <ProposalsTab />
      case 'bom':
        return <BOMTab />
      default:
        return <ProjectTab />
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setUI({ activeTab: tab.id })}
              className={`
                flex-1 px-3 py-3 text-xs font-medium text-center border-b-2 transition-colors
                ${ui.activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default Sidebar
