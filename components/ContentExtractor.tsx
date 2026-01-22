import React, { useState } from 'react';
import { extractContentFromFileWithGenaiSDK, extractContentFromPartsWithVertexAI } from '../services/geminiService';
import type { CustomSectionInput } from '../services/geminiService';
import { ExtractedContent } from '../types';
import Spinner from './ui/Spinner';
import { fileToGenerativePart } from '../utils/fileUtils';
import { fetchContentFromDataStore } from '../services/dataStoreService';
import type { Part } from '../types';
import { Packer, Document, Paragraph, HeadingLevel, AlignmentType, WidthType, Table, TableRow, TableCell, TextRun, ExternalHyperlink, UnderlineType, LevelFormat } from 'docx';


const ResultDisplay: React.FC<{ content: ExtractedContent }> = ({ content }) => {
    const [showTimeline, setShowTimeline] = useState(true);

    return (
        <div className="space-y-6 text-slate-600">
            <section>
                <h3 className="text-xl font-semibold text-[#091f2f] border-b border-slate-200 pb-2 mb-3">Short Summary</h3>
                <p>{content.shortSummary}</p>
            </section>

            <section>
                <h3 className="text-xl font-semibold text-[#091f2f] border-b border-slate-200 pb-2 mb-3">Who Can Apply</h3>
                <ul className="list-disc list-inside space-y-1">
                     {Array.isArray(content.whoCanApply) ? (
                        content.whoCanApply.length > 0 ? (
                            content.whoCanApply.map((item, i) => <li key={i}>{item}</li>)
                        ) : (
                            <li>No information provided.</li>
                        )
                    ) : (
                        <li>{String(content.whoCanApply)}</li>
                    )}
                </ul>
            </section>
            
            <section>
                <h3 className="text-xl font-semibold text-[#091f2f] border-b border-slate-200 pb-2 mb-3">Associated Permits and Fees</h3>
                <div className="space-y-2">
                    {Array.isArray(content.associatedPermitsAndFees) ? (
                        content.associatedPermitsAndFees.length > 0 ? (
                            content.associatedPermitsAndFees.map((item, i) => (
                                <div key={i} className="p-3 bg-slate-100 rounded-md flex justify-between items-center">
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 hover:underline">{item.name}</a>
                                    <span className="text-sm font-mono bg-white border border-slate-200 px-2 py-1 rounded">{item.fee}</span>
                                </div>
                            ))
                        ) : (
                            <p>No information provided.</p>
                        )
                    ) : (
                        <p>{String(content.associatedPermitsAndFees)}</p>
                    )}
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <h3 className="text-xl font-semibold text-[#091f2f]">Process Timeline</h3>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={showTimeline} onChange={() => setShowTimeline(!showTimeline)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                </div>
                {showTimeline && (
                    <>
                        {Array.isArray(content.processTimeline) ? (
                            content.processTimeline.length > 0 ? (
                                <ol className="relative border-l border-slate-300 ml-2">                  
                                    {content.processTimeline.map((item, i) => (
                                        <li key={i} className="mb-6 ml-4">
                                            <div className="absolute w-3 h-3 bg-slate-400 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                                            <time className="mb-1 text-sm font-normal leading-none text-sky-600">{item.duration}</time>
                                            <h4 className="text-lg font-semibold text-slate-800">{item.step}</h4>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p>No timeline information provided.</p>
                            )
                        ) : (
                            <p>{String(content.processTimeline)}</p>
                        )}
                    </>
                )}
            </section>
            
            <section>
                <h3 className="text-xl font-semibold text-[#091f2f] border-b border-slate-200 pb-2 mb-3">Process Steps</h3>
                <div className="space-y-3">
                    {Array.isArray(content.processSteps) ? (
                        content.processSteps.length > 0 ? (
                            content.processSteps.map((step, i) => (
                                <div key={i} className="flex items-start">
                                    <div className="flex-shrink-0 bg-sky-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-4">{i + 1}</div>
                                    <p className="flex-1 pt-1">{step}</p>
                                </div>
                            ))
                        ) : (
                            <p>No information provided.</p>
                        )
                    ) : (
                        <p>{String(content.processSteps)}</p>
                    )}
                </div>
                <p className="mt-4 text-sm text-slate-500">If you are unsure of which steps apply to your project, please contact: <span className="font-medium text-slate-700">{content.departmentContact}</span></p>
            </section>

            {content.customSections && content.customSections.length > 0 && (
                <section>
                    <h3 className="text-xl font-semibold text-[#091f2f] border-b border-slate-200 pb-2 mb-3">Custom Sections</h3>
                    <div className="space-y-4">
                        {content.customSections.map((section, i) => (
                            <div key={i}>
                                <h4 className="font-semibold text-slate-800">{section.title}</h4>
                                <p className="mt-1">{section.content}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                    <h3 className="text-xl font-semibold text-[#091f2f] border-b border-slate-200 pb-2 mb-3">Related Resources</h3>
                     <div className="space-y-3">
                        {Array.isArray(content.relatedResources) ? (
                            content.relatedResources.length > 0 ? (
                                content.relatedResources.map((res, i) => (
                                     <a href={res.link} key={i} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                        <h4 className="font-bold text-slate-800">{res.title}</h4>
                                        <p className="text-sm text-slate-500">{res.description}</p>
                                    </a>
                                ))
                            ) : (
                                <p>No information provided.</p>
                            )
                        ) : (
                            <p>{String(content.relatedResources)}</p>
                        )}
                    </div>
                </section>
                 <section>
                    <h3 className="text-xl font-semibold text-[#091f2f] border-b border-slate-200 pb-2 mb-3">Who is Involved</h3>
                     <div className="space-y-3">
                        {Array.isArray(content.whoIsInvolved) ? (
                            content.whoIsInvolved.length > 0 ? (
                                content.whoIsInvolved.map((dept, i) => (
                                    <a href={dept.link} key={i} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium text-center text-slate-700">
                                        {dept.department}
                                    </a>
                                ))
                            ) : (
                                <p>No information provided.</p>
                            )
                        ) : (
                            <p>{String(content.whoIsInvolved)}</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

const UrlInputList: React.FC<{
    urls: string[];
    setUrls: (urls: string[]) => void;
    label: string;
    placeholder: string;
    idPrefix: string;
    disabled: boolean;
}> = ({ urls, setUrls, label, placeholder, idPrefix, disabled }) => {
    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const addUrl = () => {
        setUrls([...urls, '']);
    };

    const removeUrl = (index: number) => {
        const newUrls = urls.filter((_, i) => i !== index);
        setUrls(newUrls);
    };

    return (
        <div className={`${disabled ? 'opacity-50' : ''}`}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                {label}
            </label>
            <div className="space-y-2">
                {urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <input
                            id={`${idPrefix}-${index}`}
                            type="url"
                            value={url}
                            onChange={(e) => handleUrlChange(index, e.target.value)}
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                            placeholder={placeholder}
                            disabled={disabled}
                        />
                        {urls.length > 1 && (
                            <button
                                onClick={() => removeUrl(index)}
                                className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Remove URL"
                                disabled={disabled}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
             <button
                onClick={addUrl}
                className="mt-2 flex items-center space-x-2 text-sky-600 hover:text-sky-500 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Add another URL</span>
            </button>
        </div>
    );
};

const CustomSectionInputList: React.FC<{
    sections: CustomSectionInput[];
    setSections: (sections: CustomSectionInput[]) => void;
    disabled: boolean;
}> = ({ sections, setSections, disabled }) => {
    const handleSectionChange = (index: number, field: 'title' | 'description', value: string) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    const addSection = () => {
        setSections([...sections, { title: '', description: '' }]);
    };

    const removeSection = (index: number) => {
        const newSections = sections.filter((_, i) => i !== index);
        setSections(newSections);
    };

    return (
        <div className="space-y-3">
            {sections.map((section, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative">
                     {sections.length > 1 && (
                        <button
                            onClick={() => removeSection(index)}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Remove Section"
                            disabled={disabled}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                        placeholder="Section Title (e.g., Project Cost)"
                        disabled={disabled}
                    />
                    <textarea
                        value={section.description}
                        onChange={(e) => handleSectionChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                        placeholder="Description (e.g., 'Extract the total estimated cost of the project.')"
                        disabled={disabled}
                    />
                </div>
            ))}
            <button
                onClick={addSection}
                className="flex items-center space-x-2 text-sky-600 hover:text-sky-500 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Add Custom Section</span>
            </button>
        </div>
    );
};


const formatContentAsText = (content: ExtractedContent): string => {
    const sections: string[] = [];
    const h1 = (title: string) => `${title.toUpperCase()}\n========================================`;
    const h2 = (title: string) => `${title}\n----------------------------------------`;

    sections.push(`${h1('Summary')}\n${content.shortSummary}`);

    if (Array.isArray(content.whoCanApply) && content.whoCanApply.length > 0) {
        const list = content.whoCanApply.map(item => `- ${item}`).join('\n');
        sections.push(`${h2('Who Can Apply')}\n${list}`);
    } else if (!Array.isArray(content.whoCanApply) && content.whoCanApply) {
        sections.push(`${h2('Who Can Apply')}\n${String(content.whoCanApply)}`);
    }

    if (Array.isArray(content.associatedPermitsAndFees) && content.associatedPermitsAndFees.length > 0) {
        const list = content.associatedPermitsAndFees
            .map(item => `• ${item.name}\n  Fee: ${item.fee}\n  Link: ${item.link}`)
            .join('\n\n');
        sections.push(`${h2('Associated Permits and Fees')}\n${list}`);
    } else if (!Array.isArray(content.associatedPermitsAndFees) && content.associatedPermitsAndFees) {
         sections.push(`${h2('Associated Permits and Fees')}\n${String(content.associatedPermitsAndFees)}`);
    }

    if (Array.isArray(content.processTimeline) && content.processTimeline.length > 0) {
        const list = content.processTimeline
            .map(item => `- ${item.step} (${item.duration})`)
            .join('\n');
        sections.push(`${h2('Process Timeline')}\n${list}`);
    } else if (!Array.isArray(content.processTimeline) && content.processTimeline) {
        sections.push(`${h2('Process Timeline')}\n${String(content.processTimeline)}`);
    }

    if (Array.isArray(content.processSteps) && content.processSteps.length > 0) {
        const list = content.processSteps
            .map((step, i) => `${i + 1}. ${step}`)
            .join('\n');
        sections.push(`${h2('Process Steps')}\n${list}`);
    } else if (!Array.isArray(content.processSteps) && content.processSteps) {
        sections.push(`${h2('Process Steps')}\n${String(content.processSteps)}`);
    }
    
    if (Array.isArray(content.customSections) && content.customSections.length > 0) {
        const list = content.customSections
            .map(section => `• ${section.title}\n  ${section.content}`)
            .join('\n\n');
        sections.push(`${h2('Custom Sections')}\n${list}`);
    }

    if (content.departmentContact) {
        sections.push(`${h2('Department Contact')}\n${content.departmentContact}`);
    }

    if (Array.isArray(content.whoIsInvolved) && content.whoIsInvolved.length > 0) {
        const list = content.whoIsInvolved
            .map(dept => `• ${dept.department}\n  Link: ${dept.link}`)
            .join('\n\n');
        sections.push(`${h2('Who is Involved')}\n${list}`);
    } else if (!Array.isArray(content.whoIsInvolved) && content.whoIsInvolved) {
        sections.push(`${h2('Who is Involved')}\n${String(content.whoIsInvolved)}`);
    }
    
    if (Array.isArray(content.relatedResources) && content.relatedResources.length > 0) {
        const list = content.relatedResources
            .map(res => `• ${res.title}\n  ${res.description}\n  Link: ${res.link}`)
            .join('\n\n');
        sections.push(`${h2('Related Resources')}\n${list}`);
    } else if (!Array.isArray(content.relatedResources) && content.relatedResources) {
        sections.push(`${h2('Related Resources')}\n${String(content.relatedResources)}`);
    }

    return sections.join('\n\n\n');
};

const isValidUrl = (urlString: string): boolean => {
    if (!urlString.trim()) return false;
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        return false;
    }
};

const generateFilename = (summary: string): string => {
    if (!summary) {
      return 'permit-information.docx';
    }
  
    const sanitized = summary
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters (except hyphens)
      .substring(0, 50); // Truncate to 50 chars
  
    if (!sanitized) {
        return 'permit-information.docx';
    }
  
    return `${sanitized}.docx`;
};

const ContentExtractor: React.FC = () => {
    const [pdfUrls, setPdfUrls] = useState(['']);
    const [pageUrls, setPageUrls] = useState(['']);
    const [files, setFiles] = useState<File[]>([]);
    const [customSections, setCustomSections] = useState<CustomSectionInput[]>([{ title: '', description: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ExtractedContent | null>(null);
    const [extractionTime, setExtractionTime] = useState<number | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleCopy = () => {
        if (!result) return;
        const formattedText = formatContentAsText(result);
        navigator.clipboard.writeText(formattedText).then(() => {
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleDownloadDocx = async () => {
        if (!result) return;
        setIsDownloading(true);

        try {
            const sections: any[] = [];

            const createHeading = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { after: 200, before: 400 } });
            const createBullet = (text: string) => new Paragraph({ text, bullet: { level: 0 } });
            
            sections.push(new Paragraph({ text: "Extracted Information", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 600 } }));
            sections.push(createHeading("Short Summary"));
            sections.push(new Paragraph({ text: result.shortSummary, spacing: { after: 200 } }));

            if (Array.isArray(result.whoCanApply) && result.whoCanApply.length > 0) {
                sections.push(createHeading("Who Can Apply"));
                result.whoCanApply.forEach(item => sections.push(createBullet(item)));
            } else if (!Array.isArray(result.whoCanApply)) {
                sections.push(createHeading("Who Can Apply"));
                sections.push(new Paragraph(String(result.whoCanApply)));
            }

            if (Array.isArray(result.associatedPermitsAndFees) && result.associatedPermitsAndFees.length > 0) {
                sections.push(createHeading("Associated Permits and Fees"));
                const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Fee", bold: true })] })] }),
                            ],
                            tableHeader: true,
                        }),
                        ...result.associatedPermitsAndFees.map(item => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [
                                    new ExternalHyperlink({
                                        children: [new TextRun({ text: item.name, style: "Hyperlink" })],
                                        link: item.link
                                    })
                                ] })] }),
                                new TableCell({ children: [new Paragraph(item.fee)] }),
                            ]
                        }))
                    ],
                });
                sections.push(table);
            } else if (!Array.isArray(result.associatedPermitsAndFees)) {
                sections.push(createHeading("Associated Permits and Fees"));
                sections.push(new Paragraph(String(result.associatedPermitsAndFees)));
            }

            if (Array.isArray(result.processTimeline) && result.processTimeline.length > 0) {
                sections.push(createHeading("Process Timeline"));
                result.processTimeline.forEach(item => sections.push(createBullet(`${item.step} (${item.duration})`)));
            } else if (!Array.isArray(result.processTimeline)) {
                sections.push(createHeading("Process Timeline"));
                sections.push(new Paragraph(String(result.processTimeline)));
            }

            if (Array.isArray(result.processSteps) && result.processSteps.length > 0) {
                sections.push(createHeading("Process Steps"));
                result.processSteps.forEach(step => sections.push(new Paragraph({ text: step, numbering: { reference: "numbered-list", level: 0 } })));
            } else if (!Array.isArray(result.processSteps)) {
                sections.push(createHeading("Process Steps"));
                sections.push(new Paragraph(String(result.processSteps)));
            }
            
            if (Array.isArray(result.customSections) && result.customSections.length > 0) {
                sections.push(createHeading("Custom Sections"));
                result.customSections.forEach(section => {
                    sections.push(new Paragraph({ children: [new TextRun({ text: section.title, bold: true })], spacing: { after: 100 } }));
                    sections.push(new Paragraph({ text: section.content, indent: { left: 400 }, spacing: { after: 200 }}));
                });
            }

            if(result.departmentContact) {
                sections.push(createHeading("Department Contact"));
                sections.push(new Paragraph(result.departmentContact));
            }

            if (Array.isArray(result.whoIsInvolved) && result.whoIsInvolved.length > 0) {
                sections.push(createHeading("Who is Involved"));
                 result.whoIsInvolved.forEach(dept => {
                    sections.push(new Paragraph({
                        children: [ new ExternalHyperlink({
                                children: [new TextRun({ text: dept.department, style: "Hyperlink" })],
                                link: dept.link
                            })
                        ],
                        bullet: { level: 0 }
                    }))
                });
            } else if (!Array.isArray(result.whoIsInvolved)) {
                sections.push(createHeading("Who is Involved"));
                sections.push(new Paragraph(String(result.whoIsInvolved)));
            }

            if (Array.isArray(result.relatedResources) && result.relatedResources.length > 0) {
                sections.push(createHeading("Related Resources"));
                result.relatedResources.forEach(res => {
                    sections.push(new Paragraph({
                        children: [
                            new ExternalHyperlink({
                                children: [new TextRun({ text: res.title, bold: true, style: "Hyperlink" })],
                                link: res.link
                            })
                        ],
                        spacing: { after: 100 }
                    }));
                    sections.push(new Paragraph({ text: res.description, indent: { left: 400 }, spacing: { after: 200 }}));
                });
            } else if (!Array.isArray(result.relatedResources)) {
                sections.push(createHeading("Related Resources"));
                sections.push(new Paragraph(String(result.relatedResources)));
            }
            
            const doc = new Document({
                numbering: {
                    config: [{
                        reference: "numbered-list",
                        levels: [{
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            alignment: AlignmentType.START,
                        }],
                    }],
                },
                styles: {
                    default: {
                        heading1: { run: { size: "28pt", bold: true, color: "091f2f" } },
                        heading2: { run: { size: "20pt", bold: true, color: "091f2f" } },
                    },
                    characterStyles: [{
                        id: 'Hyperlink',
                        name: 'Hyperlink',
                        run: {
                            color: "0563C1",
                            underline: { type: UnderlineType.SINGLE }
                        },
                    }],
                },
                sections: [{ children: sections }],
            });

            const blob = await Packer.toBlob(doc);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = generateFilename(result.shortSummary);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Failed to generate DOCX file:", error);
            setError("Could not generate the .docx file.");
        } finally {
            setIsDownloading(false);
        }
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
            setPdfUrls(['']);
            setPageUrls(['']);
        }
        e.target.value = ''; // Reset file input
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handlePdfUrlsChange = (urls: string[]) => {
        setPdfUrls(urls);
        if (urls.some(u => u.trim())) {
            setFiles([]);
        }
    };

    const handlePageUrlsChange = (urls: string[]) => {
        setPageUrls(urls);
        if (urls.some(u => u.trim())) {
            setFiles([]);
        }
    };

    const handleExtract = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setExtractionTime(null);
        setIsCopied(false);

        const hasFiles = files.length > 0;
        const allProvidedUrls = [...pdfUrls, ...pageUrls]
            .map(url => url.trim())
            .filter(Boolean);
        const hasUrls = allProvidedUrls.length > 0;

        if (!hasFiles && !hasUrls) {
            setError('Please provide at least one URL or upload a file.');
            setIsLoading(false);
            return;
        }

        const startTime = performance.now();

        try {
            let response;
            if (hasFiles) {
                // Use the @google/genai SDK path for file uploads
                const fileParts = await Promise.all(files.map(fileToGenerativePart));
                response = await extractContentFromFileWithGenaiSDK(fileParts, customSections);
            } else {
                // Use the Vertex AI REST API path for URLs
                const invalidUrls = allProvidedUrls.filter(url => !isValidUrl(url));
                if (invalidUrls.length > 0) {
                    setError(
                        'The following URL(s) are malformed. Please ensure they start with http:// or https:// and are valid URLs.\n\n' +
                        invalidUrls.join('\n')
                    );
                    setIsLoading(false);
                    return;
                }
                const allUrls = [...new Set(allProvidedUrls)];
                
                // Fetch content from the data store
                const dataStoreResponses = await Promise.all(
                    allUrls.map(url => fetchContentFromDataStore(url))
                );

                // Convert data store responses to Gemini Parts for Vertex AI
                const contentParts: Part[] = dataStoreResponses.map(res => {
                    if (res.mimeType === 'application/pdf') {
                        return {
                            inlineData: {
                                data: res.content,
                                mimeType: res.mimeType,
                            }
                        };
                    }
                    return { text: res.content };
                });

                response = await extractContentFromPartsWithVertexAI(contentParts, customSections);
            }
            
            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7);
                if (jsonString.endsWith('```')) {
                    jsonString = jsonString.slice(0, -3);
                }
            }

            const parsedResult = JSON.parse(jsonString);
            setResult(parsedResult);

        } catch (err: any) {
            console.error('Error in extraction process:', err);
            setError(err.message || 'Failed to extract content. An API error occurred.');
        } finally {
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
            setExtractionTime(duration);
            setIsLoading(false);
        }
    };

    const hasUrls = pdfUrls.some(u => u.trim()) || pageUrls.some(u => u.trim());


    return (
        <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm h-full overflow-y-auto">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Input */}
                <div className="lg:col-span-1 flex flex-col space-y-4">
                    <h2 className="text-2xl font-bold text-[#091f2f]">Content Extractor</h2>
                    <p className="text-sm text-slate-600">Provide URL(s) or upload file(s). The AI will extract information exclusively from the content you provide.</p>
                    
                    <UrlInputList
                        urls={pdfUrls}
                        setUrls={handlePdfUrlsChange}
                        label="URL(s) to public PDF documents"
                        placeholder="https://example.com/document.pdf"
                        idPrefix="pdf-url"
                        disabled={files.length > 0}
                    />
                    
                    <UrlInputList
                        urls={pageUrls}
                        setUrls={handlePageUrlsChange}
                        label="URL(s) to webpages"
                        placeholder="https://example.com/article.html"
                        idPrefix="page-url"
                        disabled={files.length > 0}
                    />

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="flex-shrink mx-4 text-slate-400 font-semibold">OR</span>
                        <div className="flex-grow border-t border-slate-300"></div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-2">
                            Import file(s) from your computer
                        </label>
                         {files.length > 0 && (
                            <div className="space-y-2 mb-2">
                                {files.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium text-slate-700 text-sm truncate" title={file.name}>
                                                {file.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 transition-colors"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <label
                            htmlFor="file-upload"
                            className={`relative cursor-pointer bg-white rounded-lg border-2 border-dashed border-slate-300 flex flex-col justify-center items-center p-6 text-center hover:border-sky-400 transition-colors ${hasUrls ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="mt-2 block text-sm font-semibold text-sky-600">
                                {files.length > 0 ? 'Upload more files' : 'Upload file(s)'}
                            </span>
                            <span className="block text-xs text-slate-500">PDF, DOCX up to 10MB</span>
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                disabled={hasUrls}
                                multiple
                            />
                        </label>
                    </div>

                    <div className="border-t border-slate-200 pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">Custom Headers (Optional)</h3>
                        <p className="text-sm text-slate-600 mb-3">Define additional sections you want the AI to extract. Provide a clear title and a description of what information to look for.</p>
                        <CustomSectionInputList
                            sections={customSections}
                            setSections={setCustomSections}
                            disabled={isLoading}
                        />
                    </div>
                    
                     <button
                        onClick={handleExtract}
                        disabled={isLoading || (files.length === 0 && !hasUrls)}
                        className="w-full px-4 py-3 bg-[#fb4d42] text-white rounded-lg hover:bg-[#e9453a] disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg mt-4"
                     >
                        {isLoading ? <><Spinner /> Extracting...</> : 'Extract & Populate'}
                    </button>
                </div>

                {/* Right Column: Output */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                            <h3 className="text-xl font-semibold text-[#091f2f]">Extracted Information</h3>
                            {extractionTime !== null && (
                                <span className="ml-3 text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                    {extractionTime.toFixed(2)}s
                                </span>
                            )}
                        </div>
                        {result && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleCopy}
                                    className={`px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center space-x-2 transition-all ${
                                        isCopied
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                                    }`}
                                    disabled={isCopied}
                                >
                                    {isCopied ? (
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                    <span>{isCopied ? 'Copied!' : 'Copy Info'}</span>
                                </button>
                                <button
                                    onClick={handleDownloadDocx}
                                    disabled={isDownloading}
                                    className="px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    {isDownloading ? (
                                        <Spinner className="h-4 w-4 text-slate-700" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    )}
                                    <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                     <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 min-h-[300px]">
                         {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                                <Spinner className="h-8 w-8 mb-4 text-slate-500"/>
                                <p className="text-lg">Analyzing content...</p>
                                <p className="text-sm">This may take a moment.</p>
                            </div>
                        )}
                        {error && <p className="text-red-500 p-4 bg-red-500/10 rounded-md whitespace-pre-wrap">{error}</p>}
                        {result && <ResultDisplay content={result} />}
                        {!isLoading && !result && !error && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-slate-400">Provide a document URL or upload a file and click "Extract" to see the populated template.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentExtractor;