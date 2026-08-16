import { useMemo, useState } from "react"
import { createInitialsPng } from "../../utils/identityImage"

export function IdentityImage({ name, imageUrl, color, className = "" }: { name: string; imageUrl?: string; color: string; className?: string }) {
  const fallback = useMemo(() => createInitialsPng(name, color), [color, name])
  const [failedUrl, setFailedUrl] = useState("")
  const source = imageUrl && imageUrl !== failedUrl ? imageUrl : fallback

  return <img className={`identity-image ${className}`.trim()} src={source} alt="" onError={() => setFailedUrl(imageUrl ?? "")} />
}
