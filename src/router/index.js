// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import RaceTrackView from '../views/RaceTrackView.vue'

const routes = [
  {
    path: '/',
    name: 'RaceTrack',
    component: RaceTrackView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
