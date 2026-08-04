import { NextResponse } from 'next/server'
import {
  COOKIE_NAME,
  createSessionToken,
  passwordMatches,
  sessionCookieOptions,
} from '@/lib/auth'

export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD no configurado en el servidor' },
      { status: 500 },
    )
  }

  const { password } = await request.json().catch(() => ({}))

  if (!passwordMatches(password)) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, createSessionToken(), sessionCookieOptions())
  return response
}

/** Log out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}
