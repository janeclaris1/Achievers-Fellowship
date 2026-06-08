export interface BiblePassage {
  reference: string;
  text: string;
  translation: string;
}

export async function fetchBiblePassage(reference: string): Promise<BiblePassage> {
  const trimmed = reference.trim();
  if (!trimmed) {
    throw new Error('Enter a scripture reference (e.g. John 3:16 or Psalm 23:1-4).');
  }

  const encoded = encodeURIComponent(trimmed);
  const resp = await fetch(`https://bible-api.com/${encoded}?translation=kjv`);

  if (!resp.ok) {
    throw new Error('Could not find that passage. Try a format like John 3:16.');
  }

  const data = await resp.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    reference: data.reference || trimmed,
    text: (data.text || '').trim(),
    translation: data.translation_name || 'KJV',
  };
}
