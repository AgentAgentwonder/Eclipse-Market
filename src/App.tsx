import { Layout } from './Layout'
import { Routes, Route } from 'react-router-dom'
import { Trading } from './pages/Trading'
import { Market } from './pages/Market'
import { AIAnalysis } from './pages/AIAnalysis'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Trading />} />
        <Route path="/market" element={<Market />} />
        <Route path="/ai" element={<AIAnalysis />} />
      </Routes>
    </Layout>
  );
}
