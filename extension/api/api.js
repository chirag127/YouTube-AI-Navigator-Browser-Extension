export class GeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    }

    async call(prompt, model) {
        const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || response.statusText);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    async callStream(prompt, model, onChunk) {
        const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || response.statusText);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            // Process all complete lines, keep the last one in buffer if it's incomplete
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("data:")) {
                    const jsonStr = trimmedLine.substring(5).trim();
                    if (!jsonStr) continue;

                    try {
                        const data = JSON.parse(jsonStr);
                        const textChunk =
                            data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textChunk) {
                            console.log(
                                `[GeminiAPI] Received chunk: ${textChunk.substring(
                                    0,
                                    50
                                )}...`
                            );
                            fullText += textChunk;
                            if (onChunk) onChunk(textChunk, fullText);
                        }
                    } catch (e) {
                        console.warn("Failed to parse SSE chunk:", e);
                    }
                }
            }
        }

        return fullText;
    }
}
