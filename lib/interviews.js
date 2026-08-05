/**
 * lib/interviews.js
 *
 * Interview videos, recorded during the tournament.
 *
 * Add one entry per interview. Two ways to host a clip, so whichever is easier
 * on the day works:
 *
 *   1. A file in public/entrevistas/ —
 *        { title: 'Rocío y Carla', src: '/entrevistas/rocio-carla.mp4',
 *          poster: '/entrevistas/rocio-carla.jpg', duration: '2:14' }
 *
 *   2. An embed (YouTube, Vimeo, Instagram) —
 *        { title: 'La final', embed: 'https://www.youtube.com/embed/XXXX' }
 *
 * Optional on both: `subtitle`, `division` (1–4) and `day`.
 * `poster` is worth adding for local files — without one the browser shows a
 * black rectangle until the viewer presses play.
 */
export const INTERVIEWS = []

/** Where to drop video files, shown in the empty state. */
export const INTERVIEW_DIR = 'public/entrevistas/'
