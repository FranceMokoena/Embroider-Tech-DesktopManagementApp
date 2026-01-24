// Helper utilities used by dashboard and department views to extract
// department scan totals from raw session data.
export const normalizeDepartmentKey = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  try {
    return value.toString().trim().toLowerCase();
  } catch {
    return '';
  }
};

export const resolveSessionScans = (session = {}) => {
  if (!session) return 0;
  if (typeof session.totalScans === 'number') return session.totalScans;
  if (typeof session.scanCount === 'number') return session.scanCount;
  if (typeof session.scans === 'number') return session.scans;
  if (Array.isArray(session.scans)) return session.scans.length;
  if (typeof session.screenCount === 'number') return session.screenCount;
  if (session.screenCount) {
    const parsed = Number(session.screenCount);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

export const extractSessionDepartmentLabel = (session = {}) => {
  if (!session) return '';
  const candidates = [
    session.department,
    session.departmentName,
    session.department?.name,
    session.department?.department,
    session.department?.label,
    session.department?.code,
    session.departmentCode,
    session.techDepartment,
    session.departmentLabel,
    session.team,
    session.division,
    session.user?.department,
    session.technician?.department,
    session.departmentId,
    session.departmentDisplay
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate.toString();
    }
  }
  return '';
};

export const extractSessionsFromResponse = (response = {}) => {
  const candidates = [
    response?.data?.sessions,
    response?.sessions,
    response?.data,
    response
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && Array.isArray(candidate.sessions)) return candidate.sessions;
  }
  return [];
};

export const buildUsersLookup = (users = []) => {
  const lookup = {};
  users.forEach((user) => {
    ['_id', 'id', 'username', 'email'].forEach((field) => {
      const value = user?.[field];
      if (!value) return;
      const key = value.toString().trim();
      lookup[key] = lookup[key] || user;
      lookup[key.toLowerCase()] = lookup[key.toLowerCase()] || user;
    });
  });
  return lookup;
};

export const findUserForSession = (session, usersLookup = {}) => {
  if (!session) return null;
  const identifiers = [
    session.technician,
    session.technicianId,
    session.userId,
    session.sessionTechnician,
    session.technicianEmail,
    session.technicianName,
    session.technicianUsername,
    session.technicianDisplay,
    session.operatorId,
    session.techId,
    session.scanner,
    session.scannerId,
    session.scannerUsername,
    session.scannerEmail
  ];
  if (session.technician && typeof session.technician === 'object') {
    identifiers.push(
      session.technician._id,
      session.technician.id,
      session.technician.username,
      session.technician.email
    );
  }
  if (session.user) {
    identifiers.push(session.user._id, session.user.id, session.user.username, session.user.email);
  }

  for (const identifier of identifiers) {
    if (!identifier) continue;
    const key = identifier.toString().trim();
    if (!key) continue;
    if (usersLookup[key]) return usersLookup[key];
    if (usersLookup[key.toLowerCase()]) return usersLookup[key.toLowerCase()];
  }
  return null;
};

export const resolveSessionDepartmentLabel = (session, usersLookup = {}) => {
  const user = findUserForSession(session, usersLookup);
  if (user?.department) return user.department;
  if (user?.dept) return user.dept;
  if (user?.division) return user.division;
  return extractSessionDepartmentLabel(session);
};

export const buildDepartmentScanTotals = (sessions = [], users = []) => {
  const totals = {};
  const usersLookup = buildUsersLookup(users);
  sessions.forEach((session) => {
    const label = resolveSessionDepartmentLabel(session, usersLookup);
    if (!label) return;
    const key = normalizeDepartmentKey(label);
    if (!key) return;
    const value = resolveSessionScans(session);
    const existing = totals[key] ?? { name: label, scans: 0 };
    totals[key] = {
      name: existing.name || label,
      scans: existing.scans + (Number.isFinite(value) ? value : 0)
    };
  });
  return totals;
};

const flattenScans = (session = {}) => {
  if (!session) return [];
  if (Array.isArray(session.scans) && session.scans.length) return session.scans;
  if (Array.isArray(session.scanItems) && session.scanItems.length) return session.scanItems;
  return [];
};

const resolveScanBarcode = (scan) => scan?.barcode ?? scan?.id ?? scan?.screenId ?? 'Unknown';

export const buildScanRows = (sessions = [], usersLookup = {}) => {
  if (!Array.isArray(sessions)) return [];
  const rows = [];
  sessions.forEach((session) => {
    const technician = findUserForSession(session, usersLookup);
    const departmentLabel =
      technician?.department ||
      technician?.division ||
      technician?.dept ||
      extractSessionDepartmentLabel(session, usersLookup) ||
      'Unassigned';
    flattenScans(session).forEach((scan, index) => {
      const timestamp =
        scan?.timestamp ??
        scan?.date ??
        scan?.createdAt ??
        scan?.scannedAt ??
        session.start ??
        session.startTime ??
        '';
      rows.push({
        id: scan?._id ?? scan?.id ?? `${session._id ?? session.id}-scan-${index}`,
        barcode: resolveScanBarcode(scan),
        status: scan?.status ?? scan?.state ?? 'Unknown',
        technician:
          technician?.name ||
          technician?.username ||
          technician?.displayName ||
          session.technician ||
          session.technicianName ||
          'Unknown Technician',
        technicianId:
          session.technician ??
          session.technicianId ??
          scan?.technician ??
          scan?.technicianId ??
          null,
        department: departmentLabel,
        sessionId: session._id ?? session.id ?? 'unknown',
        timestamp,
        scanTotal: resolveSessionScans(session)
      });
    });
  });
  return rows.sort((a, b) => {
    const aTime = Date.parse(a.timestamp) || 0;
    const bTime = Date.parse(b.timestamp) || 0;
    return bTime - aTime;
  });
};
