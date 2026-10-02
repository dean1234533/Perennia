type ConnectionHeartsIconProps = {
  className?: string
}

export function ConnectionHeartsIcon({ className = '' }: ConnectionHeartsIconProps) {
  return (
    <img
      src="/perennia-double-heart-connection.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`connection-hearts-icon ${className}`}
    />
  )
}
