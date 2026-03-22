export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ');

export const estimateReadingTimeFromHtml = (html: string) => {
  const text = stripHtml(html || '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return { minutes: 0, words: 0 };
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { minutes, words };
};
