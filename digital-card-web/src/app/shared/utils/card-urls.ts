type QueryValue = string | string[] | null | undefined;

export function buildPublicCardUrl(
  origin: string,
  path: string,
  query: Record<string, QueryValue>
): string {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue == null) continue;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value) params.set(key, value);
  }

  params.delete('owner');
  params.delete('employee');

  const search = params.toString();
  return `${origin}${path}${search ? `?${search}` : ''}`;
}

export function withEmployeeQuery(publicUrl: string): string {
  if (!publicUrl) return '';
  return publicUrl.includes('?') ? `${publicUrl}&employee=1` : `${publicUrl}?employee=1`;
}