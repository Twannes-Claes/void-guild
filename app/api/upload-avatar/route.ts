import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

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
    const fileName = file.name || 'avatar.png'
    uploadFormData.append('file', file, fileName)

    const apiKey = process.env.VOID_WIKI_API_KEY
    if (!apiKey) {
      console.error('VOID_WIKI_API_KEY environment variable is not configured')
      return NextResponse.json(
        { error: 'Server configuration error: Upload service is not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://void.tarragon.be/api/upload', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: uploadFormData,
    })

    const contentType = response.headers.get('content-type') || ''

    if (!response.ok) {
      let errorMessage = 'Failed to upload image to Void Wiki'
      if (contentType.includes('application/json')) {
        const errData = await response.json().catch(() => null)
        if (errData?.error) errorMessage = errData.error
      } else {
        const text = await response.text().catch(() => '')
        if (text) {
          errorMessage = `Wiki error (${response.status}): ${text.slice(0, 100).trim()}`
        }
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status === 413 ? 400 : (response.status >= 400 && response.status < 600 ? response.status : 500) }
      )
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '')
      console.error('Unexpected non-JSON response from Void Wiki:', text)
      return NextResponse.json(
        { error: 'Invalid response format received from Void Wiki' },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in avatar upload route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
