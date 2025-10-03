import React from 'react'
import Sidebar from './Sidebar'
import Viewport from './Viewport'
import StatusBar from './StatusBar'
import useStore from '../lib/store'

const Layout = () => {
  const { ui } = useStore()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`
        sidebar-container sidebar-transition
        ${ui.sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}
        w-80 bg-white shadow-lg z-20 flex-shrink-0
      `}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => useStore.getState().setUI({ sidebarOpen: !ui.sidebarOpen })}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Configurador 3D TSI
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">LS DO BRASIL</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 relative">
          <Viewport />
        </div>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  )
}

export default Layout
