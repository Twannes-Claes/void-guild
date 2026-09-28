import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: You must be signed in to upload avatars' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Forward to void.tarragon.be
    const uploadFormData = new FormData()
    uploadFormData.append('file', file, file.name)

    const apiKey = process.env.VOID_WIKI_API_KEY || '4ad0c9f9390ac19aad574367e6fbcf026210fc99a137b984'
    const response = await fetch('https://void.tarragon.be/api/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: uploadFormData,
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Upload failed' }))
      return NextResponse.json(
        { error: errData.error || 'Failed to upload image to Void Wiki' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in avatar upload route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
