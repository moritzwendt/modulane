type BrandLogoProps = {
  className?: string
}

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return <img className={`brand-logo-image ${className}`.trim()} src="/modulane-logo.png" alt="" />
}
