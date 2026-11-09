import type { RequiredField } from '../../domain/metadata/requiredFields'

/** DOM id of the "Required for interpretation" section on the Details tab (scroll target). */
export const REQUIRED_FIELDS_ID = 'required-for-interpretation'

/** Search param that asks the Details tab to focus a required field, e.g. `?focus=tumorContent`. */
export const FOCUS_PARAM = 'focus'

/** Marks the input of a required field (`data-required-field="tumorType"`). */
export const requiredFieldAttr = (field: RequiredField) => ({ 'data-required-field': field })

/** Scrolls to and focuses the input of a required field on the Details tab. Returns false if not rendered. */
export function focusRequiredField(field: RequiredField): boolean {
  const el = document.querySelector<HTMLElement>(`[data-required-field="${field}"]`)
  if (!el) return false
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el.focus({ preventScroll: true })
  return true
}
