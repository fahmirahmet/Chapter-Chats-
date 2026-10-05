/**
 * Helper to normalize and resolve member avatar URLs across the platform.
 * Supports absolute URLs, relative Django /media/ paths, blob URLs, and fallback UI-Avatars.
 */

export const isPhoneNumber = (val) => {
  if (!val || typeof val !== 'string') return false;
  const clean = val.replace(/[\s\-\+\(\)]/g, '');
  return /^\d{9,15}$/.test(clean);
};

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return "R";
  const trimmed = name.trim();
  if (!trimmed || isPhoneNumber(trimmed)) return "R";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts.length > 1 
    ? (parts[0][0] + parts[1][0]).toUpperCase() 
    : trimmed.slice(0, 2).toUpperCase();
};

export const getAuthorDisplayName = (item) => {
  if (!item) return "Reader";
  if (typeof item === 'string') {
    return isPhoneNumber(item) ? "Reader" : item;
  }
  const candidates = [
    item.author_name,
    item.author_username,
    item.full_name,
    item.user?.full_name,
    item.user?.username,
    item.proposer_name,
    item.proposer,
    item.author,
    item.uploaded_by_name,
    item.uploaded_by_username
  ];
  for (const cand of candidates) {
    if (cand && typeof cand === 'string' && cand.trim() && !isPhoneNumber(cand.trim())) {
      return cand.trim();
    }
  }
  return "Reader";
};

export const getAuthorProfileTarget = (item) => {
  if (!item) return "/profile";
  if (typeof item === 'string') {
    return isPhoneNumber(item) ? "/profile" : `/profile/${encodeURIComponent(item.trim())}`;
  }
  // Try username first (if not phone number)
  const usernameCandidates = [
    item.author_username,
    item.user?.username,
    item.proposer,
    item.uploaded_by_username,
    item.username,
    item.author
  ];
  for (const u of usernameCandidates) {
    if (u && typeof u === 'string' && u.trim() && !isPhoneNumber(u.trim())) {
      return `/profile/${encodeURIComponent(u.trim())}`;
    }
  }
  // Try id next
  const idCandidates = [
    item.author_id,
    item.user?.id,
    item.user_id,
    item.proposer_id,
    item.uploaded_by_id
  ];
  for (const id of idCandidates) {
    if (id !== undefined && id !== null && typeof id !== 'object') {
      return `/profile/${id}`;
    }
  }
  return "/profile";
};

export function getAvatarUrl(avatarOrUrl, fallbackName = 'Reader') {
  if (!avatarOrUrl) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'Reader')}&background=A35C33&color=fff&size=200&bold=true`;
  }

  if (typeof avatarOrUrl === 'string') {
    const trimmed = avatarOrUrl.trim();
    if (!trimmed) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'Reader')}&background=A35C33&color=fff&size=200&bold=true`;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    if (trimmed.startsWith('/media/') || trimmed.startsWith('media/')) {
      const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `http://localhost:8000${path}`;
    }

    return trimmed;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'Reader')}&background=A35C33&color=fff&size=200&bold=true`;
}

export default getAvatarUrl;
