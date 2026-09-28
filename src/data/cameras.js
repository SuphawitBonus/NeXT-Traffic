const CAMERA_FEED_URL = 'https://traffic.longdo.com/camera.json'

let cached = null

// Only hls_url carries real video: Longdo's jpeg/mjpeg endpoints return empty
// bodies, and Bangkok cameras without hls_url only show "No signal".
// Titles are prefixed with the province; matching "กรุงเทพ" anywhere in the
// title also picks up upcountry highway cameras "heading to/from Bangkok".
function toBangkokCameras(data) {
  const cameras = data.item
    .filter((c) => c.title.startsWith('(กรุงเทพมหานคร)') && c.hls_url)
    .map((c) => ({
      id: c.camid,
      name: c.title.replace('(กรุงเทพมหานคร)', '').replace(/\s+/g, ' ').trim(),
      lat: parseFloat(c.latitude),
      lng: parseFloat(c.longitude),
      district: c.organization || 'BMA',
      url: c.hls_url,
    }))

  // Several cameras share one title (different angles at the same junction)
  const totals = {}
  for (const c of cameras) totals[c.name] = (totals[c.name] || 0) + 1
  const seen = {}
  for (const c of cameras) {
    if (totals[c.name] > 1) {
      seen[c.name] = (seen[c.name] || 0) + 1
      c.name = `${c.name} · มุม ${seen[c.name]}`
    }
  }
  return cameras
}

export function fetchBangkokCameras() {
  if (!cached) {
    cached = fetch(CAMERA_FEED_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`camera feed HTTP ${res.status}`)
        return res.json()
      })
      .then(toBangkokCameras)
      .catch((err) => {
        cached = null
        throw err
      })
  }
  return cached
}
