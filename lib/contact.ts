/** Canonical public contact details for Klumit. */
export const CONTACT = {
  whatsappDisplay: '054-990-3139',
  whatsappE164: '972549903139',
  email: 'klumitltd@gmail.com',
  address: 'גאולה 45, תל אביב',
  hours: "א׳–ה׳ 10:00–17:00",
  instagramUrl: 'https://www.instagram.com/klumit_bags/',
} as const;

export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappE164}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(subject?: string): string {
  if (!subject) return `mailto:${CONTACT.email}`;
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
}
