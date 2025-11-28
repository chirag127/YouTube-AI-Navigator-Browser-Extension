export function fillContentGaps(c, o) {
    // console.log("[Gaps] Filling gaps. Segments:", c?.length, "Transcript:", o?.length);
    if (!o || !o.length) {
        console.warn("[Gaps] No transcript provided to fillContentGaps");
        return [];
    }

    try {
        const lastItem = o[o.length - 1];
        if (!lastItem || typeof lastItem.start === "undefined") {
            console.warn("[Gaps] Invalid transcript format");
            return [];
        }

        const e = lastItem.start + (lastItem.duration || 0);
        const s = (c || []).sort((a, b) => a.start - b.start);
        const f = [];
        let t = 0;

        for (const seg of s) {
            if (seg.start > t + 1) {
                f.push({
                    label: "Content",
                    start: t,
                    end: seg.start,
                    text: "Main Content",
                });
            }
            f.push({ ...seg, text: seg.description || seg.label });
            t = Math.max(t, seg.end);
        }

        if (t < e - 1) {
            f.push({
                label: "Content",
                start: t,
                end: e,
                text: "Main Content",
            });
        }

        return f;
    } catch (err) {
        console.error("[Gaps] Error in fillContentGaps:", err);
        return [];
    }
}
