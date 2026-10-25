import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getProfile } from './db'

// Make sure the profile row exists before the first render: useProfile() runs inside a
// Dexie liveQuery, which cannot write, so seeding the default here avoids a ReadOnlyError
// on a fresh database (and lets the theme apply without a flash).
getProfile()
  .catch(() => undefined)
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
