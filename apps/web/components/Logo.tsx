import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
  textClassName?: string
}

export function Logo({ 
  className = "w-10 h-10", 
  size = 40, 
  showText = false, 
  textClassName = "text-xl font-bold text-foreground" 
}: LogoProps) {
  return (
    <div className="flex items-center">
      <Image
        src="/logo.png"
        alt="Preset"
        width={size}
        height={size}
        className={className}
        priority
      />
      {showText && (
        <span className={`ml-2 ${textClassName}`}>Preset</span>
      )}
    </div>
  )
}
