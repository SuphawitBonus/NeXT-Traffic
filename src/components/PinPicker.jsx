import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BANGKOK_CENTER } from '../data/mockData'

const iconCache = new Map()

// Cached per color: a new icon object each render makes react-leaflet reset the marker
export function reportPinIcon(color = '#a9d4ff') {
  if (!iconCache.has(color)) {
    iconCache.set(
      color,
      L.divIcon({
        className: 'report-pin',
        html: `<div class="report-pin-dot" style="--c: ${color}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        popupAnchor: [0, -22],
      }),
    )
  }
  return iconCache.get(color)
}

const PICK_ICON = reportPinIcon('#b3feef')

function ClickToPick({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function FollowValue({ value, flyKey }) {
  const map = useMap()
  useEffect(() => {
    if (value && flyKey) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
    // only re-center when asked (e.g. "use my location"), not on every click
  }, [flyKey]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function PinPicker({ value, onChange, flyKey }) {
  return (
    <MapContainer center={BANGKOK_CENTER} zoom={12} className="pin-picker-map" zoomControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPick onChange={onChange} />
      <FollowValue value={value} flyKey={flyKey} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={PICK_ICON}
          draggable
          eventHandlers={{
            add: (e) => e.target.getElement()?.setAttribute('aria-label', 'หมุดตำแหน่งที่แจ้ง (ลากเพื่อย้าย)'),
            dragend: (e) => {
              const p = e.target.getLatLng()
              onChange({ lat: p.lat, lng: p.lng })
            },
          }}
        />
      )}
    </MapContainer>
  )
}
