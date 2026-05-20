import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NutritionProvider } from './NutritionContext'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <NutritionProvider>
      <App />
    </NutritionProvider>
  </BrowserRouter>
)
