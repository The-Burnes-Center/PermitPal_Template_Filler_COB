import { GoogleGenAI, Type, FunctionDeclaration, Part as GenAiPart } from "@google/genai";
import type { Part, GenerateContentResponse, ChatMessage } from "../types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const API_KEY = process.env.API_KEY;
const PROJECT_ID = 'vertex-ai-poc-406419';
const LOCATION = 'us-central1';
const MODEL_NAME_VERTEX = 'gemini-3-pro-preview';
const MODEL_NAME_GENAI = 'gemini-3-pro-preview';

const getVertexApiEndpoint = (model: string, stream: boolean = false) => {
    const streamAction = stream ? ':streamGenerateContent' : ':generateContent';
    let url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}${streamAction}?key=${API_KEY}`;
    if (stream) {
        url += '&alt=sse';
    }
    return url;
};

export interface CustomSectionInput {
    title: string;
    description: string;
}

// #region Vertex AI REST API specific code
// Schema for Vertex AI REST API, using string literals for types.
const vertexContentExtractorSchema = {
    type: 'object',
    properties: {
        shortSummary: { type: 'string', description: "In 2-3 short, simple sentences, summarize the project and what the applicant can expect. Write in plain language for a general audience." },
        whoCanApply: { type: 'array', items: { type: 'string' }, description: "A list of who is eligible to apply. Use simple terms." },
        associatedPermitsAndFees: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    link: { type: 'string', description: "Full URL to the permit page." },
                    fee: { type: 'string', description: "The cost of the permit." },
                },
                required: ["name", "link", "fee"],
            },
            description: "A list of any permits and fees needed."
        },
        processTimeline: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    step: { type: 'string', description: "Name of the process step, written in plain language." },
                    duration: { type: 'string', description: "Expected time for this step (e.g., '2-3 weeks')." },
                },
                required: ["step", "duration"],
            },
            description: "Expected timeline for each step of the process."
        },
        processSteps: { type: 'array', items: { type: 'string' }, description: "A list of the specific steps to follow, written as clear, actionable instructions in plain language. Use active voice." },
        departmentContact: { type: 'string', description: "The best contact information for questions. For example, a phone number, email, or office name." },
        relatedResources: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    link: { type: 'string' },
                    description: { type: 'string', description: "A short, plain-language description of what the resource is." },
                },
                required: ["title", "link", "description"],
            },
            description: "List of helpful but non-essential resources."
        },
        whoIsInvolved: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    department: { type: 'string' },
                    link: { type: 'string', description: "Full URL to the department page." },
                },
                required: ["department", "link"],
            },
            description: "A list of departments involved. Use the official department name but link to their main page."
        },
    },
    required: ["shortSummary", "whoCanApply", "associatedPermitsAndFees", "processTimeline", "processSteps", "departmentContact", "relatedResources", "whoIsInvolved"],
};
// #endregion

// #region @google/genai SDK specific code
// Schema for @google/genai SDK, using the Type enum.
const genAiContentExtractorSchema: FunctionDeclaration = {
    name: "information_extractor",
    description: "Extracts structured information from the provided document.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            shortSummary: { type: Type.STRING, description: "In 2-3 short, simple sentences, summarize the project and what the applicant can expect. Write in plain language for a general audience." },
            whoCanApply: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of who is eligible to apply. Use simple terms." },
            associatedPermitsAndFees: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        link: { type: Type.STRING, description: "Full URL to the permit page." },
                        fee: { type: Type.STRING, description: "The cost of the permit." },
                    },
                    required: ["name", "link", "fee"],
                },
                description: "A list of any permits and fees needed."
            },
            processTimeline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        step: { type: Type.STRING, description: "Name of the process step, written in plain language." },
                        duration: { type: Type.STRING, description: "Expected time for this step (e.g., '2-3 weeks')." },
                    },
                    required: ["step", "duration"],
                },
                description: "Expected timeline for each step of the process."
            },
            processSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the specific steps to follow, written as clear, actionable instructions in plain language. Use active voice." },
            departmentContact: { type: Type.STRING, description: "The best contact information for questions. For example, a phone number, email, or office name." },
            relatedResources: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        link: { type: Type.STRING },
                        description: { type: Type.STRING, description: "A short, plain-language description of what the resource is." },
                    },
                    required: ["title", "link", "description"],
                },
                description: "List of helpful but non-essential resources."
            },
            whoIsInvolved: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        department: { type: Type.STRING },
                        link: { type: Type.STRING, description: "Full URL to the department page." },
                    },
                    required: ["department", "link"],
                },
                description: "A list of departments involved. Use the official department name but link to their main page."
            },
        },
        required: ["shortSummary", "whoCanApply", "associatedPermitsAndFees", "processTimeline", "processSteps", "departmentContact", "relatedResources", "whoIsInvolved"],
    }
};
// #endregion

const buildDynamicTool = (baseSchema: any, customSections: CustomSectionInput[], forVertex: boolean) => {
    const validCustomSections = customSections.filter(s => s.title && s.description);
    const dynamicSchema = JSON.parse(JSON.stringify(baseSchema));

    if (validCustomSections.length > 0) {
        const customSectionProps = {
            type: forVertex ? 'array' : Type.ARRAY,
            description: "An array containing the extracted content for the custom-defined sections.",
            items: {
                type: forVertex ? 'object' : Type.OBJECT,
                properties: {
                    title: { type: forVertex ? 'string' : Type.STRING, description: "The title of the custom section, exactly as provided in the prompt." },
                    content: { type: forVertex ? 'string' : Type.STRING, description: "The extracted content for this section, based on its description." }
                },
                required: ["title", "content"]
            }
        };

        if (forVertex) {
            dynamicSchema.properties.customSections = customSectionProps;
        } else {
            dynamicSchema.parameters.properties.customSections = customSectionProps;
        }
    }
    
    if (forVertex) {
        return {
            functionDeclarations: [
                {
                    name: "information_extractor",
                    description: "Extracts structured information from the provided document.",
                    parameters: dynamicSchema
                }
            ]
        };
    }
    return { functionDeclarations: [dynamicSchema] };
};

const getCustomSectionInstructions = (customSections: CustomSectionInput[]): string => {
    const validCustomSections = customSections.filter(s => s.title && s.description);
    if (validCustomSections.length === 0) return '';

    let instructions = `\n\n**Custom Sections to Extract:**\nFor each of the following custom sections, extract the relevant information and populate it in the 'customSections' array in the final JSON. Each object in the array should have a 'title' field matching the section title exactly, and a 'content' field with the extracted information.\nIf you cannot find information for a custom section, create an entry for it with the content stating "Information not available in the provided documents."\n`;
    
    validCustomSections.forEach(section => {
        instructions += `- Title: "${section.title}", Description: "${section.description}"\n`;
    });

    return instructions;
};

const PROMPT_TEMPLATE = `Your task is to analyze the content of the provided document(s) and extract information by calling the "information_extractor" function.

**CRITICAL INSTRUCTIONS:**
1.  **Source Restriction:** You MUST base your entire response exclusively on the information contained within the provided document(s). Do not use any external knowledge.
2.  **Function Call:** You MUST call the "information_extractor" function with the extracted data. Do not respond with plain text.
3.  **Missing Information:** If you cannot find specific information for a field within the provided document(s), the value for that field must be a string stating "Information not available in the provided document(s)."

**Plain Language Mandate:**
All generated text within the JSON fields MUST be in plain language, targeting a 6th-8th grade reading level. Adhere strictly to these guidelines:
- **Tone:** Use a welcoming, helpful, and direct tone. Address the reader as "you".
- **Voice:** Use the active voice. For example, write "You need to complete this form" instead of "This form must be completed."
- **Word Choice:** Use simple, common words. Avoid jargon, acronyms, and bureaucratic terms. If a technical term is absolutely necessary, explain it clearly on its first use.
- **Sentences & Paragraphs:** Keep sentences and paragraphs short.
- **Lists:** For any fields that are lists (like 'processSteps'), write each item as a clear, concise statement or an actionable instruction.`;


export const extractContentFromFileWithGenaiSDK = async (fileParts: GenAiPart[], customSections: CustomSectionInput[]): Promise<GenerateContentResponse> => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const customInstructions = getCustomSectionInstructions(customSections);
    const tool = buildDynamicTool(genAiContentExtractorSchema, customSections, false);
    
    const prompt = `${PROMPT_TEMPLATE}${customInstructions}`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME_GENAI,
        contents: { role: 'user', parts: [{ text: prompt }, ...fileParts] },
        config: {
            tools: [tool],
            toolConfig: {
                functionCallingConfig: {
                    mode: 'ANY',
                    allowedFunctionNames: ['information_extractor']
                }
            },
            temperature: 0.5
        }
    });

    const functionCall = response.functionCalls?.[0];
    
    if (!functionCall || !functionCall.args) {
        console.error("Invalid GenAI SDK Response:", response);
        throw new Error('Invalid response structure from GenAI SDK. Expected a function call.');
    }
    
    return {
        text: JSON.stringify(functionCall.args)
    };
};

export const extractContentFromPartsWithVertexAI = async (contentParts: Part[], customSections: CustomSectionInput[]): Promise<GenerateContentResponse> => {
    const customInstructions = getCustomSectionInstructions(customSections);
    const tool = buildDynamicTool(vertexContentExtractorSchema, customSections, true);
    
    const prompt = `${PROMPT_TEMPLATE}${customInstructions}`;

    const contents = [{ role: 'user', parts: [{ text: prompt }, ...contentParts] }];

    const apiEndpoint = getVertexApiEndpoint(MODEL_NAME_VERTEX);

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            tools: [tool],
            toolConfig: {
                functionCallingConfig: {
                    mode: 'ANY',
                    allowedFunctionNames: ['information_extractor']
                }
            },
            generationConfig: { temperature: 0.5 },
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Vertex AI API Error:", errorBody);
        throw new Error(`Failed to extract content from Vertex AI (Status: ${response.status}).`);
    }

    const data = await response.json();
    const functionCall = data.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (!functionCall || !functionCall.args) {
        console.error("Invalid Vertex AI Response:", data);
        throw new Error('Invalid response structure from Vertex AI. Expected a function call.');
    }

    return {
        text: JSON.stringify(functionCall.args)
    };
};

export const streamChat = async (history: ChatMessage[]): Promise<ReadableStream<string>> => {
    const endpoint = getVertexApiEndpoint(MODEL_NAME_VERTEX, true);
    
    const contents = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
    }));

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.5 } })
    });

    if (!response.ok || !response.body) {
        const errorBody = await response.text();
        console.error("Vertex AI Chat Error:", errorBody);
        throw new Error(`Failed to stream chat from Vertex AI (Status: ${response.status}).`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(line.substring(6));
                                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    controller.enqueue(text);
                                }
                            } catch (e) {
                                // Ignore JSON parse errors on partial data chunks
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error in chat stream:", error);
                controller.error(error);
            } finally {
                controller.close();
            }
        }
    });
};

export const analyzeImageAndText = async (prompt: string, imagePart: Part): Promise<GenerateContentResponse> => {
    const contents = [{ role: 'user', parts: [imagePart, { text: prompt }] }];
    const apiEndpoint = getVertexApiEndpoint('gemini-3-pro-image-preview');

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.5 },
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Vertex AI Image Analysis Error:", errorBody);
        throw new Error(`Failed to analyze image with Vertex AI (Status: ${response.status}).`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (typeof text !== 'string') {
        console.error("Invalid Vertex AI Response:", data);
        throw new Error('Invalid response structure from Vertex AI for image analysis.');
    }

    return { text };
};