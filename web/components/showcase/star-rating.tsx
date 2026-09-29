import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  size?: number
  showCount?: boolean
  count?: number
}

export function StarRating({
  rating,
  size = 14,
  showCount = false,
  count,
}: StarRatingProps) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const isFull = i < full
          const isHalf = i === full && hasHalf
          return (
            <Star
              key={i}
              size={size}
              className={
                isFull || isHalf
                  ? "fill-safety-500 text-safety-500"
                  : "fill-industrial-200 text-industrial-200"
              }
            />
          )
        })}
      </div>
      <span className="text-xs font-medium text-industrial-500">
        {rating.toFixed(1)}
        {showCount && count !== undefined && ` (${count})`}
      </span>
    </div>
  )
}
