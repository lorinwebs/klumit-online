/**
 * Optional homepage imagery. Leave empty string until assets are in /public.
 *
 * The hero has two crops of the same scene, because the copy sits in different places:
 * - `hero` (portrait 3:4) fills the photo half of the desktop hero.
 * - `heroMobile` (tall) is the full-bleed phone hero. The bags sit in the upper half and
 *   the lower half is a calm dark wall, so the headline never covers the product.
 * Each entry carries its pixel size so the browser can pick the right file per screen.
 *
 * Each crop also has a short silent loop (`video`) that starts on exactly the same frame
 * as the still, so it can fade in over it. Replace the still and the clip together, or
 * remove `video` to show the still only.
 *
 * The editorial (heritage) photo is 16:9 and has its own loop too.
 * Category and brand tiles use live product photos instead (see app/page.tsx).
 */
export const homeImages = {
  hero: { src: '/hero-bags-venice.jpg', width: 2160, height: 2880, video: '/hero-bags-venice.mp4' },
  heroMobile: {
    src: '/hero-bags-venice-mobile.jpg',
    width: 1440,
    height: 2038,
    video: '/hero-bags-venice-mobile.mp4',
  },
  editorial: { src: '/home-editorial.png', video: '/home-editorial.mp4' },
} as const;
