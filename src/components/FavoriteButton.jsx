import { Star } from 'lucide-react'
import { useFavoriteIds, toggleFavorite } from '../data/favorites'

export default function FavoriteButton({ cameraId, withLabel = false, className = '' }) {
  const favorites = useFavoriteIds()
  const saved = favorites.includes(cameraId)
  const label = saved ? 'นำออกจากกล้องของฉัน' : 'บันทึกไว้ในกล้องของฉัน'

  return (
    <button
      type="button"
      className={`fav-btn ${saved ? 'is-saved' : ''} ${withLabel ? 'btn btn-outline btn-sm' : 'btn btn-ghost btn-icon'} ${className}`}
      onClick={(e) => {
        e.stopPropagation()
        toggleFavorite(cameraId)
      }}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <Star size={16} strokeWidth={1.8} />
      {withLabel && (saved ? 'บันทึกแล้ว' : 'บันทึกกล้อง')}
    </button>
  )
}
