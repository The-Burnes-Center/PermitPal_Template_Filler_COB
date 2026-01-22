export interface CustomSectionContent {
    title: string;
    content: string;
}

export interface ExtractedContent {
  shortSummary: string;
  whoCanApply: string[];
  associatedPermitsAndFees: {
    name: string;
    link: string;
    fee: string;
  }[];
  processTimeline: {
    step: string;
    duration: string;
  }[];
  processSteps: string[];
  departmentContact: string;
  relatedResources: {
    title: string;
    link: string;
    description: string;
  }[];
  whoIsInvolved: {
    department: string;
    link: string;
  }[];
  customSections?: CustomSectionContent[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Self-defined types to replace @google/genai dependencies
export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GenerateContentResponse {
  text: string;
}
