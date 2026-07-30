import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
// 800/900 back the `fw={800}`/`fw={900}` figures on the stat cards. Without
// these the browser caps at 700 and fakes the rest, which looks smeared at
// 40px — the exact size those figures render at.
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import './index.css'
import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
