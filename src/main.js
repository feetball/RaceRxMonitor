// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  // No icon configuration needed since we’re not using Vuetify icons
})

const app = createApp(App)
app.use(vuetify)
app.mount('#app')
