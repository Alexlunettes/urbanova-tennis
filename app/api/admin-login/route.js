import { NextResponse } from 'next/server'

export async function POST(request) {
  const { password } = await request.json()

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD no configurado en el servidor' },
      { status: 500 }
    )
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,                                       // JS can't read it
    secure: process.env.NODE_ENV === 'production',        // HTTPS only in prod
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,                            // 7 days
    path: '/',
  })
  return response
}