import { buildContextString } from "./utils.js";

export const chat = (question, context, metadata) => {
    const contextObj = {
        metadata: metadata || {},
        transcript: context,
        lyrics: null,
        comments: [],
        sponsorBlockSegments: [],
    };

    return `
    Role: You are a helpful AI assistant for a YouTube video.

    ${buildContextString(contextObj)}

    Video Transcript Context: ${context}

    User Question: ${question}

    Instructions:
    - Answer based ONLY on the video context provided.
    - Be concise and helpful.
    - If the answer is not in the video, state that clearly.
    - Reference timestamps or community segments when relevant.
    `;
};
