import { redirect } from 'next/navigation'

/**
 * The bracket now lives inside /partidos as its second tab. This route is kept
 * so older links, and anything already shared in the group chat, still land in
 * the right place.
 */
export default function CuadroPage() {
  redirect('/partidos?vista=cuadro')
}
