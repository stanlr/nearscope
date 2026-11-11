import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string }> {
  state = { error: '' }
  static getDerivedStateFromError(error: Error) { return { error: error.message || 'Unknown rendering error' } }
  componentDidCatch(error: Error) { console.error('NearScope rendering error:', error) }
  render() {
    if (this.state.error) return <main style={{minHeight:'100vh',background:'#090d18',color:'#e8edf7',padding:'40px',fontFamily:'sans-serif'}}><h1>NearScope hit a display error</h1><p style={{color:'#f5a5a5'}}>{this.state.error}</p><p>Please refresh the page. If this continues, share this error text with the NearScope team.</p></main>
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>,
)
