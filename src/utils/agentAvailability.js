export const parseAgentStateReport = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return {};
    }
};

export const getAgentAvailabilityStatus = (report) => {
    const detailedStates = parseAgentStateReport(report?.not_available_detailed_report);
    const hasNotAvailable = Number(report?.not_available_time || 0) > 0
        || Object.values(detailedStates).some((seconds) => Number(seconds || 0) > 0);

    return hasNotAvailable ? 'not-available' : 'available';
};

export const buildAgentStatusByExtension = (reports = []) => {
    const latestStatuses = {};

    (Array.isArray(reports) ? reports : []).forEach((report) => {
        const extension = String(report?.extension || '').trim();
        if (!extension || latestStatuses[extension]) return;

        latestStatuses[extension] = getAgentAvailabilityStatus(report);
    });

    return latestStatuses;
};
