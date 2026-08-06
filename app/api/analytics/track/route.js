import { NextResponse }  from 'next/server'
import { headers }       from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  shouldTrack, isBot, visitorHash,
  parseDevice, parseBrowser, parseOS, parseReferrer, clientIp,
} from '@/lib/analytics'

/**
 * Records one page view.
 *
 * Public by necessity — it is called from the browser — so it takes only a
 * path from the client and derives everything else server-side from request
 * headers. Nothing the caller sends is trusted or stored verbatim beyond the
 * path, which is validated against the site's own routes by shape.
 *
 * Always answers 204 so a failure here can never surface as a console error on
 * a visitor's page; analytics must not be able to break the site.
 */
export async function POST(request) {
  try {
    const { path } = await request.json().catch(() => ({}))
    if (!shouldTrack(path)) return new NextResponse(null, { status: 204 })

    const h  = await headers()
    const ua = h.get('user-agent') ?? ''
    if (isBot(ua)) return new NextResponse(null, { status: 204 })

    const host = h.get('host') ?? ''

    await supabaseAdmin.from('page_views').insert({
      // Query strings are dropped: /grupos?cat=3 is still /grupos.
      path:         path.split('?')[0].slice(0, 200),
      referrer:     parseReferrer(h.get('referer'), host),
      device:       parseDevice(ua),
      browser:      parseBrowser(ua),
      os:           parseOS(ua),
      // Vercel sets this at the edge; absent locally.
      country:      h.get('x-vercel-ip-country') ?? null,
      visitor_hash: visitorHash(
        clientIp(h), ua,
        process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'urbanova',
      ),
    })
  } catch {
    // Swallow: a missing table or a transient network blip must not bubble up.
  }
  return new NextResponse(null, { status: 204 })
}
