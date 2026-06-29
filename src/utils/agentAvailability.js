export const parseAgentStateReport = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return {};
    }
};

const toSeconds = (value) => Number(value || 0);

const getDelta = (report, previousReport, field) => (
    toSeconds(report?.[field]) - toSeconds(previousReport?.[field])
);

const getCurrentStateFromTrend = (report, previousReport) => {
    if (!previousReport) return null;

    const stateDeltas = [
        { state: 'available', seconds: getDelta(report, previousReport, 'idle_time') },
        { state: 'not-available', seconds: getDelta(report, previousReport, 'not_available_time') },
        { state: 'not-available', seconds: getDelta(report, previousReport, 'on_call_time') },
        { state: 'not-available', seconds: getDelta(report, previousReport, 'wrap_up_time') },
        { state: 'not-available', seconds: getDelta(report, previousReport, 'hold_time') }
    ].filter(({ seconds }) => seconds > 0);

    if (stateDeltas.length === 0) return null;

    return stateDeltas.reduce((largest, current) => (
        current.seconds > largest.seconds ? current : largest
    )).state;
};

export const getAgentAvailabilityStatus = (report, previousReport = null) => {
    const currentState = getCurrentStateFromTrend(report, previousReport);
    if (currentState) return currentState;

    const detailedStates = parseAgentStateReport(report?.not_available_detailed_report);
    const hasNotAvailable = toSeconds(report?.not_available_time) > 0
        || Object.values(detailedStates).some((seconds) => toSeconds(seconds) > 0);

    return hasNotAvailable ? 'not-available' : 'available';
};

export const buildAgentStatusByExtension = (reports = []) => {
    const latestStatuses = {};
    const reportsByExtension = {};

    (Array.isArray(reports) ? reports : []).forEach((report) => {
        const extension = String(report?.extension || '').trim();
        if (!extension) return;

        if (!reportsByExtension[extension]) {
            reportsByExtension[extension] = [];
        }

        reportsByExtension[extension].push(report);
    });

    Object.entries(reportsByExtension).forEach(([extension, extensionReports]) => {
        const sortedReports = [...extensionReports].sort((first, second) => (
            new Date(second?.fetched_at || 0).getTime() - new Date(first?.fetched_at || 0).getTime()
        ));
        const latestReport = sortedReports[0];
        const previousReport = sortedReports[1] || null;

        latestStatuses[extension] = getAgentAvailabilityStatus(latestReport, previousReport);
    });

    return latestStatuses;
};
