import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Deploy from './pages/Deploy'
import Deploys from './pages/Deploys'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/deploy" element={<Deploy />} />
      <Route path="/deploys" element={<Deploys />} />
    </Routes>
  )
}

export default App
