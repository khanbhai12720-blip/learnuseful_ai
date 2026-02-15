// ========================================
// BILINGUAL RESPONSE HANDLER
// ========================================

/**
 * Handles bilingual (Hindi + English) responses
 * Splits, formats, and presents dual-language answers
 */

class BilingualResponseHandler {
    /**
     * Split bilingual response from OpenAI
     */
    splitBilingualResponse(rawResponse) {
        // Try to find Hindi and English sections (assume they're separated by markers)
        const hindiMatch = rawResponse.match(/Hindi Answer:\s*([\s\S]*?)(?:English Answer:|$)/i);
        const englishMatch = rawResponse.match(/English Answer:\s*([\s\S]*?)$/i);

        // If both sections found
        if (hindiMatch && englishMatch) {
            return {
                hindi: hindiMatch[1]?.trim() || rawResponse.substring(0, rawResponse.length / 2),
                english: englishMatch[1]?.trim() || rawResponse.substring(rawResponse.length / 2)
            };
        }

        // Fallback: use half-half split
        const mid = Math.floor(rawResponse.length / 2);
        return {
            hindi: rawResponse.substring(0, mid),
            english: rawResponse.substring(mid)
        };
    }

    /**
     * Format bilingual response for API response
     */
    formatForAPI(hindi, english) {
        return {
            hindi: {
                text: hindi,
                language: 'hi'
            },
            english: {
                text: english,
                language: 'en'
            },
            bilingual: true
        };
    }

    /**
     * Format bilingual response for frontend display
     */
    formatForFrontend(hindi, english) {
        return {
            sections: [
                {
                    language: 'Hindi',
                    content: hindi,
                    code: 'hi'
                },
                {
                    language: 'English',
                    content: english,
                    code: 'en'
                }
            ],
            displayMode: 'tab' // or 'side-by-side'
        };
    }

    /**
     * Create combined response (for single language request)
     */
    createMonolingualResponse(text, language) {
        return {
            [language]: {
                text: text,
                language: language
            },
            bilingual: false
        };
    }

    /**
     * Add language labels to response
     */
    addLanguageLabels(response) {
        const labels = {\n            hindi: 'Hindi Answer:',\n            english: 'English Answer:'\n        };

        if (response.hindi) {
            response.hindi = `${labels.hindi}\n\n${response.hindi}`;
        }
        if (response.english) {
            response.english = `${labels.english}\n\n${response.english}`;
        }

        return response;
    }
}

module.exports = new BilingualResponseHandler();


