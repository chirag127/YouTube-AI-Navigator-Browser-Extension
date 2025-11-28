// Timestamp Validation for Segment UI
// Ensures: Highlight = ONE timestamp, Others = TWO timestamps (both clickable)

export const validateSegments = (segments) => {
    if (!Array.isArray(segments)) return [];

    return segments
        .map((seg) => {
            // Ensure start is a number
            let start = parseFloat(seg.start);
            if (isNaN(start)) start = 0;

            // Ensure end is a number
            let end = parseFloat(seg.end);
            if (isNaN(end) || end === -1) {
                // Try to derive end from duration or next segment logic (simplified here)
                end = start + (parseFloat(seg.duration) || 0);
                // If still 0/invalid and it's not a highlight, we might have a problem,
                // but we'll let the UI handle or hide it.
            }

            const validated = {
                ...seg,
                start,
                end,
            };

            // Highlight: Only start timestamp
            if (seg.label === "Highlight") {
                validated.timestamps = [{ type: "start", time: start }];
                validated.hasEndTimestamp = false;
            }
            // All others: Start AND End timestamps (both clickable)
            else {
                validated.timestamps = [
                    { type: "start", time: start },
                    { type: "end", time: end },
                ];
                validated.hasEndTimestamp = true;
            }

            return validated;
        })
        .filter((s) => s); // Remove nulls if any
};

export const formatTimestamp = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const pad = (n) => n.toString().padStart(2, "0");

export const createClickableTimestamp = (time, type, onClick) => ({
    time,
    type,
    formatted: formatTimestamp(time),
    clickable: true,
    onClick: () => onClick(time),
});
