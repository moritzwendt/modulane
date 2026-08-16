export function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "M"
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? ""
  return `${first}${last}`.toLocaleUpperCase("de")
}

export function createInitialsPng(name: string, color: string, size = 128) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) return ""
  context.fillStyle = color
  context.fillRect(0, 0, size, size)
  context.fillStyle = "#ffffff"
  context.font = `600 ${Math.round(size * 0.36)}px ui-sans-serif, system-ui, sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(initialsForName(name), size / 2, size / 2 + size * 0.02)
  return canvas.toDataURL("image/png")
}

export async function prepareSquarePng(file: File, size = 512) {
  if (!file.type.startsWith("image/")) throw new Error("Bitte wähle eine Bilddatei aus.")
  if (file.size > 8 * 1024 * 1024) throw new Error("Das Bild darf höchstens acht MB groß sein.")

  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error("Das Bild konnte nicht gelesen werden."))
      element.src = sourceUrl
    })
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Das Bild konnte nicht verarbeitet werden.")
    const cropSize = Math.min(image.naturalWidth, image.naturalHeight)
    const sourceX = (image.naturalWidth - cropSize) / 2
    const sourceY = (image.naturalHeight - cropSize) / 2
    context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, size, size)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Das Bild konnte nicht gespeichert werden.")), "image/png", 0.92))
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}
