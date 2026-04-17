import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App_v2.jsx'
import Test from './Test.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/*<Test />*/}
  </StrictMode>,
)
