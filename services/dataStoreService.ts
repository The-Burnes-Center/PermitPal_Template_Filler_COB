
/**
 * Represents the expected JSON response from the backend data store API.
 */
export interface DataStoreResponse {
    sourceUrl: string;
    /** The IANA media type of the content. 'application/pdf' for PDFs, 'text/plain' for pre-cleaned webpage text. */
    mimeType: 'application/pdf' | 'text/plain';
    /** For PDFs, this is the base64-encoded string of the file. For webpages, this is the cleaned plain text content. */
    content: string;
}

/**
 * Fetches content for a given URL by calling a secure backend proxy (Google Cloud Function).
 * This proxy uses Application Default Credentials (ADC) to securely authenticate with Vertex AI Search.
 *
 * @param url The URL to fetch content for.
 * @returns A promise that resolves to the content from the data store.
 * @throws An error if the fetch fails or the URL is not found in the data store.
 */
export const fetchContentFromDataStore = async (url: string): Promise<DataStoreResponse> => {
    // !!! IMPORTANT !!!
    // REPLACE THIS WITH THE TRIGGER URL OF YOUR DEPLOYED GOOGLE CLOUD FUNCTION
    // Example: https://us-central1-vertex-ai-poc-406419.cloudfunctions.net/vertex-ai-search-proxy
    const PROXY_ENDPOINT = 'YOUR_CLOUD_FUNCTION_TRIGGER_URL_HERE';

    if (PROXY_ENDPOINT === 'YOUR_CLOUD_FUNCTION_TRIGGER_URL_HERE') {
        console.warn("Proxy endpoint not set. Please update services/dataStoreService.ts");
        throw new Error("Cloud Function Proxy URL not configured in code.");
    }
    
    try {
        const response = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Proxy API Error:", errorBody);
            throw new Error(`Data store proxy error (${response.status}): ${errorBody}`);
        }

        const data: DataStoreResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Network or Proxy Error:", error);
        throw error;
    }
};
