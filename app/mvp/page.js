import { redirect } from 'next/navigation'

/** The MVP vote is now one part of the wider awards page. */
export default function MvpPage() {
  redirect('/premios')
}
