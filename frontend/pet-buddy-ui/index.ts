import { registerRootComponent } from 'expo'
import { Platform } from 'react-native'
import App from './App'

// Expose API base for chat fetch fallbacks; will be set by apiService on first call
;(global as any).API_BASE = Platform.select({ default: '' })

registerRootComponent(App)
