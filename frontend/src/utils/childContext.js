const CACHED_CHILD_KEYS = ['children', 'childProfiles', 'daycareChildren', 'kids'];

const parseCachedList = (raw) => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.children)) return parsed.children;
    if (Array.isArray(parsed?.items)) return parsed.items;
    return [];
  } catch {
    return [];
  }
};

const normalizeChild = (child, index) => {
  const childId = child?.child_id ?? child?.childId ?? child?.id;

  if (childId === undefined || childId === null || String(childId).trim() === '') {
    return null;
  }

  const childName = child?.full_name || child?.name || child?.display_name || `الطفل ${index + 1}`;
  const roomId = child?.room_id ?? child?.roomId ?? child?.classroom_id ?? child?.classroomId ?? child?.zone_id;
  const householdId = child?.household_id ?? child?.householdId ?? child?.family_id;
  const customerId = child?.customer_id ?? child?.customerId;
  const guardianName = child?.guardian_name ?? child?.guardianName ?? child?.parent_name;

  return {
    childId: String(childId),
    childName,
    roomId: roomId === undefined || roomId === null || String(roomId).trim() === '' ? null : String(roomId),
    householdId: householdId === undefined || householdId === null || String(householdId).trim() === '' ? null : String(householdId),
    customerId: customerId === undefined || customerId === null || String(customerId).trim() === '' ? null : String(customerId),
    guardianName: guardianName || null,
  };
};

export const readCachedChildContexts = () => {
  for (const key of CACHED_CHILD_KEYS) {
    const list = parseCachedList(localStorage.getItem(key));
    if (list.length === 0) continue;

    const normalized = list.map(normalizeChild).filter(Boolean);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [];
};

export const resolveCachedChildContext = (targetChildId) => {
  const children = readCachedChildContexts();
  if (children.length === 0) return null;

  if (targetChildId !== undefined && targetChildId !== null && String(targetChildId).trim() !== '') {
    const exactMatch = children.find((child) => child.childId === String(targetChildId));
    if (exactMatch) return exactMatch;
  }

  return children[0];
};
