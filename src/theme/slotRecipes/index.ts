import { classificationRowRecipe } from './classificationRow'
import { fileBrowserRecipe } from './fileBrowser'
import { glassCardRecipe } from './glassCard'
import { sidebarNavRecipe } from './sidebarNav'
import { tooltipRecipe } from './tooltip'
import { variantListItemRecipe } from './variantListItem'

export const slotRecipes = {
  sidebarNav: sidebarNavRecipe,
  variantListItem: variantListItemRecipe,
  classificationRow: classificationRowRecipe,
  glassCard: glassCardRecipe,
  fileBrowser: fileBrowserRecipe,
  /** Override of the built-in tooltip (larger text). */
  tooltip: tooltipRecipe,
}
