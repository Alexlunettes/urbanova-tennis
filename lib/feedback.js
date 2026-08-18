/**
 * lib/feedback.js
 *
 * The post-tournament feedback form, and the words used to ask for it.
 *
 * Both the hero call-to-action and the floating prompt read from here, so the
 * invitation reads the same wherever a visitor meets it — and changing the
 * wording (or the form) is a one-line edit rather than a hunt through the app.
 */

export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSewAy_qbUQAjjltjMlwUELCqlE0a-LVLLyDM4ZN90-R16OlWQ/viewform?usp=sharing&ouid=110800555888343312949'

export const FEEDBACK = {
  title: 'Queremos tu opinión',
  /* Long form, for the homepage where there is room to be warm about it. */
  body:  'Cuéntanos qué te ha parecido el torneo. Tu opinión nos ayuda a mejorar la próxima edición y solo te llevará un minuto.',
  /* Short form, for the floating prompt. */
  short: 'Tu opinión nos ayuda a mejorar la próxima edición. Solo te llevará un minuto.',
  cta:   'Rellenar el formulario',
}
