import { allPhotos } from '@/lib/photos'
import GaleriaClient from './GaleriaClient'

export const metadata = { title: 'Galería' }

/**
 * Thin server wrapper: reads the photo folders and hands the lists to the
 * gallery UI, which stays a client component because of the lightbox and its
 * keyboard navigation.
 */
export default function GaleriaPage() {
  return <GaleriaClient photosByYear={allPhotos()} />
}
