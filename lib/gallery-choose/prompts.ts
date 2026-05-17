export const FACE_PROMPT =
  'Reply with JSON only, no markdown. ' +
  'Format: {"count": <integer number of people clearly visible>, ' +
  '"desc": "<one short Hebrew sentence describing what you see>"}';

export const SCORE_PROMPT =
  'You help curate ~200 photos for a high-school reunion album (מפגש מחזור) to print and share.\n' +
  'Reply with JSON only, no markdown: {"score": <int 1-100>}\n\n' +
  'Score = how much this photo deserves a slot among ~200 printed picks:\n' +
  '90-100: excellent — clear faces, strong moment, good composition, sharp enough to print\n' +
  '70-89: good — include-worthy, minor flaws (lighting, crop, blur)\n' +
  '50-69: mediocre — filler only; distant faces, dull or average quality\n' +
  '30-49: weak — backs of heads, very dark/blurry, cluttered, little reunion value\n' +
  '1-29: reject for print — unusable, accidental, inappropriate, or no clear people\n' +
  'Weigh: visible faces, print quality, warmth/story, group energy, uniqueness.';
