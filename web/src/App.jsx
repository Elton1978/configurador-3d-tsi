import React, { useEffect } from 'react'
import Layout from './components/Layout'
import useStore from './lib/store'
import './App.css'

function App() {
  const { loadProject, setBlockCatalog } = useStore()

  useEffect(() => {
    // Carregar catálogo inicial
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/catalog')
        const catalog = await response.json()
        setBlockCatalog(catalog)
      } catch (error) {
        console.error('Erro ao carregar catálogo:', error)
      }
    }

    loadCatalog()
  }, [setBlockCatalog])

  return (
    <div className="App">
      <Layout />
    </div>
  )
}

export default App
