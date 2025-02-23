<!-- src/views/RaceTrackView.vue -->
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1>Race Track Monitor</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <l-map
          ref="map"
          :zoom="15"
          :center="center"
          style="height: 600px; width: 100%"
        >
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <l-polyline
            :lat-lngs="pathCoordinates"
            color="red"
            :weight="4"
          />
          <l-marker
            v-if="latestPosition"
            :lat-lng="latestPosition"
            :icon="carIcon"
          />
        </l-map>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-chip :color="connected ? 'green' : 'red'">
          {{ connected ? 'Connected' : 'Disconnected' }}
        </v-chip>
        <div v-if="latestPosition">
          Lat: {{ latestPosition[0].toFixed(6) }}
          Lng: {{ latestPosition[1].toFixed(6) }}
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import mqtt from 'mqtt'
import { LMap, LTileLayer, LMarker, LPolyline } from 'vue3-leaflet'
import L from 'leaflet'

export default {
  name: 'RaceTrackView',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPolyline
  },

  setup() {
    const map = ref(null)
    const connected = ref(false)
    const latestPosition = ref(null)
    const pathCoordinates = ref([])
    const center = ref([0, 0]) // Initial center, will update with first coordinate
    let client = null
    const MAX_POINTS = 54 // 54 seconds of data

    // Define a simple custom car icon using Leaflet’s default marker or a custom image
    const carIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', // Default Leaflet marker
      iconSize: [25, 41], // Size of the icon
      iconAnchor: [12, 41], // Point of the icon that corresponds to marker’s location
      popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    })

    const connectMQTT = () => {
      client = mqtt.connect('mqtt://your-mqtt-broker-url', {
        clientId: 'race_track_' + Math.random().toString(16).substr(2, 8),
        username: 'your-username', // if required
        password: 'your-password'  // if required
      })

      client.on('connect', () => {
        connected.value = true
        client.subscribe('raceData/dataLog', (err) => {
          if (err) console.error('Subscription error:', err)
        })
      })

      client.on('message', (topic, message) => {
        try {
          const data = JSON.parse(message.toString())
          if (data.latitude && data.longitude) {
            const newPos = [data.latitude, data.longitude]
            latestPosition.value = newPos

            // Add to path
            pathCoordinates.value.push(newPos)

            // Keep only last 54 seconds of data
            if (pathCoordinates.value.length > MAX_POINTS) {
              pathCoordinates.value.shift()
            }

            // Update map center if it's the first point
            if (pathCoordinates.value.length === 1) {
              center.value = newPos
            }
          }
        } catch (e) {
          console.error('Error parsing message:', e)
        }
      })

      client.on('error', (error) => {
        console.error('MQTT Error:', error)
        connected.value = false
      })
    }

    onMounted(() => {
      connectMQTT()
    })

    onUnmounted(() => {
      if (client) {
        client.end()
      }
    })

    return {
      map,
      connected,
      latestPosition,
      pathCoordinates,
      center,
      carIcon
    }
  }
}
</script>

<style>
/* Ensure Leaflet styles are loaded */
@import 'leaflet/dist/leaflet.css';
</style>
