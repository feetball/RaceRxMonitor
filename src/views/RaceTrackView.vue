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
            attribution="&copy; OpenStreetMap contributors"
          />
          <l-polyline
            :lat-lngs="pathCoordinates"
            color="red"
            :weight="4"
          />
          <l-marker
            v-if="latestPosition"
            :lat-lng="latestPosition"
          >
            <l-icon>
              <v-icon color="red" size="32">mdi-car</v-icon>
            </l-icon>
          </l-marker>
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
import { LMap, LTileLayer, LMarker, LPolyline, LIcon } from 'vue3-leaflet'

export default {
  name: 'RaceTrackView',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPolyline,
    LIcon
  },

  setup() {
    const map = ref(null)
    const connected = ref(false)
    const latestPosition = ref(null)
    const pathCoordinates = ref([])
    const center = ref([0, 0]) // Initial center, will update with first coordinate
    let client = null
    const MAX_POINTS = 54 // 54 seconds of data

    const connectMQTT = () => {
      client = mqtt.connect('mqtt://your-mqtt-broker-url', {
        // Add your MQTT connection options here
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
      center
    }
  }
}
</script>

<style>
/* Add any custom styles here */
</style>
