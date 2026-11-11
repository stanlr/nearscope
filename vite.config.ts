import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use relative asset URLs so the built app also works when hosted under a Space path.
export default defineConfig({ base: './', plugins: [react] })
