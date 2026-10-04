/**
 * Client-side image optimization utilities for avatar and media uploads.
 */

export interface OptimizedImageResult {
  file: File | Blob
  filename: string
}

/**
 * Optimizes an image file before upload:
 * - Checks file format
 * - Downscales resolution to a max dimension (default 2048px)
 * - Compresses large raster images using an offscreen canvas to WebP/JPEG
 * - Keeps uploads comfortably below serverless payload limits (< 4MB)
 */
export async function optimizeImageForUpload(
  file: File,
  maxDimension = 2048,
  quality = 0.85
): Promise<OptimizedImageResult> {
  // If not a standard raster image (e.g. SVG or unknown), return as-is
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return { file, filename: file.name }
  }

  // If already under 1.5MB and not an excessively large file, check dimensions or return
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      const needsResize = width > maxDimension || height > maxDimension
      const needsCompression = file.size > 2 * 1024 * 1024 // > 2MB

      // If neither resize nor compression is needed, keep the original file
      if (!needsResize && !needsCompression) {
        resolve({ file, filename: file.name })
        return
      }

      // Calculate constrained dimensions
      if (needsResize) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve({ file, filename: file.name })
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        const safeName = baseName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'image'

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, filename: file.name })
              return
            }
            resolve({
              file: blob,
              filename: `${safeName}.webp`,
            })
          },
          'image/webp',
          quality
        )
      } catch (err) {
        console.warn('Canvas optimization failed, falling back to original file:', err)
        resolve({ file, filename: file.name })
      }
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      console.warn('Failed to load image for canvas optimization:', err)
      resolve({ file, filename: file.name })
    }

    img.src = objectUrl
  })
}
