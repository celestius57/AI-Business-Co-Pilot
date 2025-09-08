import { GoogleGenAI, Type, Part, Content } from "@google/genai";
import type { ChatMessage, Company, Team, Employee, HiringProposal, InitialStructureProposal, OceanProfile, ToolOutput, MoveAnalysis, MeetingMinute, SoftwareAsset, AssetAction, Client, Project, ProjectPhase, ProjectBudget, ProjectExpense, Task, RichTextBlock, RichTableBlockContent } from '../types';
import { JOB_PROFILES, JobProfile } from "../constants";
import { ServiceError } from "./errors";
import { buildBrainstormingRosterString, buildCompanyContextString, buildToolsInstructions, getToolsForJobProfile, buildProjectContextString, buildMeetingMinutesContextString } from "../utils";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleGeminiError = (error: unknown, context: string): never => {
    if (error instanceof ServiceError) {
        throw error; // Re-throw if it's a specific error we've already handled
    }

    console.error(`Gemini service error during ${context}:`, error);
    // Default user-friendly message
    let userMessage = `I encountered an unexpected issue while ${context}. Please try again in a moment.`;

    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('safety')) {
            userMessage = "I'm unable to process that request as it seems to go against my safety guidelines. Could you please try rephrasing your request more clearly and professionally?";
        } else if (errorMessage.includes('json')) {
            userMessage = `I received a response for ${context}, but it was in a format I couldn't understand. This might be a temporary issue with my response generation. Please try again.`;
        } else if (errorMessage.includes('429')) {
            // Specific message for rate limiting
            userMessage = "I'm currently handling a lot of requests. Please wait a moment and try again.";
        } else if (errorMessage.includes('400')) {
            userMessage = `I'm having a little trouble understanding the request for ${context}. Could you please be more specific or phrase it differently?`;
        } else if (errorMessage.includes('500') || errorMessage.includes('503')) {
            // Specific message for server errors
            userMessage = `It seems I'm having trouble connecting to my core systems right now. This is likely a temporary issue on my end. Please try again shortly. (Context: ${context})`;
        } else if (errorMessage.includes('rpc') || errorMessage.includes('xhr') || errorMessage.includes('network')) {
            // Specific message for network errors
             userMessage = `I'm having trouble with the connection. Please check your network and try again. (Context: ${context})`;
        }
    }
    
    throw new ServiceError(userMessage, error);
};

const convertChatMessageToParts = (message: ChatMessage): Part[] => {
    const parts: Part[] = [];
    if (message.file) {
        parts.push({
            inlineData: {
                mimeType: message.file.mimeType,
                data: message.file.data,
            }
        });
    }
    if (message.text || !message.file) { 
        parts.push({ text: message.text || '' });
    }
    return parts;
};

const convertChatHistoryToGeminiHistory = (history: ChatMessage[]): Content[] => {
    return history.map(msg => ({
        role: msg.role,
        parts: convertChatMessageToParts(msg),
    }));
};

const getSystemInstructionForCompanyChat = (): string => {
    return `You are an AI business consultant. Your goal is to help a user create a profile for their new company.
    Ask one question at a time to gather the necessary information. Start by asking for the company name.
    Then, ask about its industry, core products/services, target audience, and finally, its mission or core values.
    After gathering all information, say "Thank you! I have everything I need to create the company profile." and nothing else.
    Keep your questions concise and professional.`;
};

export const continueConversation = async (history: ChatMessage[], systemInstruction: string) => {
    try {
        const lastMessage = history[history.length - 1];
        const historyForChat = history.slice(0, -1);
        
        const geminiHistory = convertChatHistoryToGeminiHistory(historyForChat);
        const lastMessageParts = convertChatMessageToParts(lastMessage);

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
            history: geminiHistory
        });

        const result = await chat.sendMessage({ message: lastMessageParts });
        return result.text;
    } catch (error) {
        handleGeminiError(error, 'continuing the conversation');
    }
};


export const summarizeConversationForProfile = async (history: ChatMessage[]): Promise<string> => {
    const conversationText = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Based on the following conversation, generate a concise company profile. Include the company name, industry, services, audience, and mission.
        Conversation:\n${conversationText}`;
    const context = `summarizing the conversation for a company profile`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        handleGeminiError(error, context);
    }
};

export const getHiringProposals = async (companyProfile: string, teams: Team[], employees: Employee[], clients: Client[], userNeed: string): Promise<HiringProposal[]> => {
    const existingEmployeesString = employees.length > 0
        ? employees.map(e => `- ${e.name} (${e.jobProfile})`).join('\n')
        : 'None';

    const existingClientsString = clients.length > 0
        ? clients.map(c => `- ${c.name} (${c.status})`).join('\n')
        : 'None';

    const systemInstruction = `You are an expert AI HR Specialist for a company.
Company Profile: "${companyProfile}"
Existing Teams: [${teams.map(d => d.name).join(', ')}]
Existing Clients:
${existingClientsString}
Existing Employees:
${existingEmployeesString}
Available Standard Job Profiles for inspiration: [${JOB_PROFILES.join(', ')}]

**Note on special roles:**
- **Asset Manager:** This is a crucial role responsible for managing the company's software licenses and SaaS subscriptions. Their primary interface for this will be conversational. If the user's need involves tracking software, licenses, subscriptions, or digital assets, this is the perfect role to propose.
- **Data Analyst:** A specialist role for analyzing data and creating visual reports (charts). If the user's need involves data visualization, analysis of trends (financial, sales, marketing, etc.), propose this role.

Your task is to analyze the user's hiring need and propose one or more candidates.

**Analysis of User Request:**
1.  **Specificity Check:** First, determine if the user's request is specific (e.g., "hire a senior backend developer") or vague (e.g., "we need help with marketing and getting new customers").
2.  **Specific Requests:** If the request is specific, generate a single, perfectly tailored employee proposal.
3.  **Vague Requests:** If the request is vague, generate up to three distinct and relevant job profile proposals that could address the user's need. Each proposal must be a complete, hireable candidate.

**Proposal Requirements (for each candidate):**
-   **Team:** Determine the best team. If an existing one fits, use it. If not, create a new team name.
-   **New Team Description:** If you create a new team, you MUST provide a concise, one-sentence description for it in the \`teamDescription\` field. Omit this field if using an existing team.
-   **Job Profile:** Invent a specific and descriptive job title.
-   **Candidate Details:** Suggest a plausible name and gender ('Male' or 'Female').
-   **System Instruction:** Generate a detailed system instruction for the AI's persona, responsibilities, and how it should interact within the company context.
-   **Reasoning:** Provide a brief explanation for your choices, highlighting how this role addresses the user's need.
-   **OCEAN Profile:** Assign a psychological OCEAN personality profile with scores from 0-100 for each trait.
-   **Existing Employee Check:** You MUST check if a similar employee already exists. If so, mention this in your reasoning and justify the new hire.

You MUST respond with ONLY a valid JSON object matching the provided schema. The response must be an object with a "proposals" key, which contains an array of 1 to 3 candidate proposal objects.`;
    
    const oceanProperties = {
        type: Type.OBJECT,
        description: "The employee's OCEAN personality profile. All scores must be integers between 0 and 100.",
        properties: {
            openness: { type: Type.INTEGER, description: "Score for Openness (inventive/curious vs. consistent/cautious)." },
            conscientiousness: { type: Type.INTEGER, description: "Score for Conscientiousness (efficient/organized vs. easy-going/careless)." },
            extraversion: { type: Type.INTEGER, description: "Score for Extraversion (outgoing/energetic vs. solitary/reserved)." },
            agreeableness: { type: Type.INTEGER, description: "Score for Agreeableness (friendly/compassionate vs. challenging/detached)." },
            neuroticism: { type: Type.INTEGER, description: "Score for Neuroticism (sensitive/nervous vs. secure/confident)." }
        },
        required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
    };

    const proposalSchema = {
        type: Type.OBJECT,
        properties: {
            teamName: { type: Type.STRING, description: "The name of the team for this employee. Use an existing team if it fits, otherwise create a new, relevant team name." },
            teamDescription: { type: Type.STRING, description: "A concise, one-sentence description of the new team's purpose. ONLY include this field if you are creating a new team." },
            jobProfile: { type: Type.STRING, description: "A specific and descriptive job title for the new employee." },
            employeeName: { type: Type.STRING, description: "A plausible first and last name for the new employee." },
            gender: { type: Type.STRING, description: "The gender of the employee. Must be 'Male' or 'Female' and should align with the name.", enum: ["Male", "Female"]},
            systemInstruction: { type: Type.STRING, description: "A detailed system instruction for the AI model. It should define its role, personality, responsibilities, and how it should interact as if it IS the employee, within the context of the company." },
            reasoning: { type: Type.STRING, description: "A brief, one-sentence explanation for your choices of team and job role. IMPORTANT: If a similar employee already exists, mention it here." },
            oceanProfile: oceanProperties,
        },
        required: ["teamName", "jobProfile", "employeeName", "gender", "systemInstruction", "reasoning", "oceanProfile"],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Here is the hiring need: "${userNeed}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        proposals: {
                            type: Type.ARRAY,
                            description: "An array of 1 to 3 hiring proposals.",
                            items: proposalSchema
                        }
                    },
                    required: ["proposals"]
                },
            },
        });

        let jsonText = response.text.trim();
        // The model can sometimes wrap the JSON in markdown backticks despite the MIME type.
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonText = match[1];
        }

        try {
            const parsed = JSON.parse(jsonText);
            return parsed.proposals as HiringProposal[];
        } catch (parseError) {
            console.error('Failed to parse hiring proposal JSON:', jsonText, parseError);
            throw new Error("Invalid JSON response from model.");
        }
    } catch (error) {
        handleGeminiError(error, 'creating a hiring proposal');
    }
}

export const getInitialStructureProposal = async (companyProfile: string): Promise<InitialStructureProposal> => {
    const systemInstruction = `You are "Alex", a highly efficient Personal Assistant AI for a new company.
Your first task is to analyze the company's profile and propose an initial organizational structure.
This includes suggesting key teams and essential employee roles within them.
The proposed roles should be operational and foundational. Avoid creating high-level executive positions like CEO, CTO, or "Head of" roles for this initial setup. Focus on the doers who perform the core tasks.
For each team, provide a name and a brief description of its function.
For each employee, provide a plausible name, a gender ('Male' or 'Female') that aligns with the name, a specific job title, a detailed system instruction for their AI persona, and a unique OCEAN personality profile with scores from 0-100 for each of the five traits. The system instruction should define their role, responsibilities, and personality, written from the perspective of the AI employee.
The goal is to create a foundational team that can hit the ground running.
Company Profile: "${companyProfile}"

You MUST respond with ONLY a valid JSON object matching the provided schema. Do not include any other text, comments, or markdown formatting.`;

    const oceanProperties = {
        type: Type.OBJECT,
        description: "The employee's OCEAN personality profile. All scores must be integers between 0 and 100.",
        properties: {
            openness: { type: Type.INTEGER, description: "Score for Openness (inventive/curious vs. consistent/cautious)." },
            conscientiousness: { type: Type.INTEGER, description: "Score for Conscientiousness (efficient/organized vs. easy-going/careless)." },
            extraversion: { type: Type.INTEGER, description: "Score for Extraversion (outgoing/energetic vs. solitary/reserved)." },
            agreeableness: { type: Type.INTEGER, description: "Score for Agreeableness (friendly/compassionate vs. challenging/detached)." },
            neuroticism: { type: Type.INTEGER, description: "Score for Neuroticism (sensitive/nervous vs. secure/confident)." }
        },
        required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Please generate the initial organizational structure proposal.",
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        teams: {
                            type: Type.ARRAY,
                            description: "A list of proposed teams.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "The name of the team." },
                                    description: { type: Type.STRING, description: "A brief description of the team's function and goals." },
                                    employees: {
                                        type: Type.ARRAY,
                                        description: "A list of essential employees for this team.",
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING, description: "A plausible first and last name for the employee." },
                                                jobProfile: { type: Type.STRING, description: "A specific job title for the employee." },
                                                gender: { type: Type.STRING, description: "The gender of the employee. Must be 'Male' or 'Female' and should align with the name.", enum: ["Male", "Female"]},
                                                systemInstruction: { type: Type.STRING, description: "A detailed system instruction for the AI model, written from the perspective of the employee." },
                                                oceanProfile: oceanProperties,
                                            },
                                            required: ["name", "jobProfile", "gender", "systemInstruction", "oceanProfile"]
                                        }
                                    }
                                },
                                required: ["name", "description", "employees"]
                            }
                        }
                    },
                    required: ["teams"]
                },
            },
        });
        let jsonText = response.text.trim();
        // The model can sometimes wrap the JSON in markdown backticks despite the MIME type.
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonText = match[1];
        }
        
        try {
            const parsed = JSON.parse(jsonText);
            // We'll rename the key here to match the new type
            if (parsed.departments) {
                parsed.teams = parsed.departments;
                delete parsed.departments;
            }
            return parsed as InitialStructureProposal;
        } catch (parseError) {
            console.error('Failed to parse initial structure proposal JSON:', jsonText, parseError);
            throw new Error("Invalid JSON response from model.");
        }
    } catch (error) {
        handleGeminiError(error, 'proposing an initial company structure');
    }
}

export const generateTeamDescription = async (companyProfile: string, teamName: string): Promise<string> => {
    const systemInstruction = `You are an expert business consultant. Your task is to generate a concise, one-sentence description for a company team based on the company's profile and the team's name. The description should clearly state the team's primary function and goals.`;

    const prompt = `
Company Profile: "${companyProfile}"
Team Name: "${teamName}"

Generate the team description now.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text.trim();
    } catch (error) {
        handleGeminiError(error, 'generating a team description');
    }
};

export type InitialIdea = {
    employee: Employee;
    status: 'fulfilled' | 'rejected';
    response?: string;
    error?: string;
    toolTriggered?: ToolOutput;
}

export const getBrainstormResponsesStream = async (
    history: ChatMessage[],
    teamEmployees: Employee[],
    company: Company,
    onResponseReceived: (response: InitialIdea) => void,
    projectContext?: string,
    meetingMinutes?: MeetingMinute[],
    filesContext?: string
): Promise<InitialIdea[]> => {
    const conversationPromises = teamEmployees.map(employee => {
        const companyContext = buildCompanyContextString(company);
        const tools = getToolsForJobProfile(employee.jobProfile);
        const toolsInstruction = buildToolsInstructions(tools);
        const rosterContext = buildBrainstormingRosterString(teamEmployees, employee);
        const minutesContext = meetingMinutes ? buildMeetingMinutesContextString(meetingMinutes) : '';

        const isPersonalAssistant = employee.jobProfile === JobProfile.PersonalAssistant;

        const alexBrainstormInstruction = `You are "Alex", the Personal Assistant, participating in a brainstorming session. Your role is to be the meeting facilitator.
- Keep the discussion on track with the meeting's topic.
- If the conversation stalls, ask probing questions to encourage new ideas from your colleagues. (e.g., "That's a great point, Jane. How do you think that would affect our timeline?").
- You can summarize points to ensure clarity.
- Your responses should be helpful and concise, aimed at guiding the conversation productively. Do not generate long paragraphs.
- You will NOT be responsible for taking minutes during the conversation. A summary will be generated later.
`;

        let finalInstruction: string;
        if (isPersonalAssistant) {
            // Alex doesn't use tools in this context, just provides the framework.
            finalInstruction = `${alexBrainstormInstruction}\n\n${companyContext}\n\n${rosterContext}`;
        } else {
            finalInstruction = `${employee.systemInstruction}\n\n${companyContext}\n\n${projectContext || ''}\n\n${minutesContext}\n\n${filesContext || ''}\n\n${rosterContext}\n\n${toolsInstruction}`;
        }
        
        const lastMessage = history[history.length - 1];
        const historyForChat = history.slice(0, -1);
        
        const geminiHistory = convertChatHistoryToGeminiHistory(historyForChat);
        const lastMessageParts = convertChatMessageToParts(lastMessage);

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: finalInstruction },
            history: geminiHistory,
        });


        const promise = chat.sendMessage({ message: lastMessageParts })
            .then(result => {
                const modelResponse = result.text;
                let toolTriggered: ToolOutput | undefined;
                let text = modelResponse;

                // Robustly find and parse a JSON tool call from the model's response.
                let jsonString: string | undefined;
                const markdownMatch = modelResponse.match(/```json\s*([\s\S]*?)\s*```/);
                if (markdownMatch && markdownMatch[1]) {
                    jsonString = markdownMatch[1];
                } else {
                    const startIndex = modelResponse.indexOf('{');
                    const endIndex = modelResponse.lastIndexOf('}');
                    if (startIndex !== -1 && endIndex > startIndex) {
                        jsonString = modelResponse.substring(startIndex, endIndex + 1);
                    }
                }

                if (jsonString) {
                    try {
                        const parsed = JSON.parse(jsonString);
                        if (parsed.tool && parsed.data && parsed.text) {
                            toolTriggered = { tool: parsed.tool, data: parsed.data, text: parsed.text };
                            text = parsed.text; // Use only the text from the tool call.
                        }
                    } catch (e) { 
                        /* Failed to parse, so we treat the whole response as plain text. */ 
                        // console.warn('Could not parse potential tool JSON in brainstorm, treating as text.', e);
                        // 'text' remains the full modelResponse
                    }
                }

                return {
                    employee,
                    status: 'fulfilled' as const,
                    response: text,
                    toolTriggered,
                };
            })
            .catch(error => ({
                employee,
                status: 'rejected' as const,
                error: error instanceof ServiceError ? error.userMessage : "An error occurred.",
            }));
            
        promise.then(onResponseReceived);
        
        return promise;
    });
    
    return Promise.all(conversationPromises);
};

export const getCollaboratorResponse = async (
    collaborator: Employee,
    question: string,
    company: Company,
): Promise<string> => {
    const context = `getting a response from collaborator ${collaborator.name}`;
    try {
        const companyContext = buildCompanyContextString(company);
        const systemInstruction = `
You are being consulted by a colleague. Please provide a concise and direct answer to their question.
Your persona is defined by your system instruction: "${collaborator.systemInstruction}"

${companyContext}

Provide a direct answer to the following question from your colleague:
        `.trim();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: question,
            config: { systemInstruction }
        });

        return response.text;
    } catch (error) {
        handleGeminiError(error, context);
    }
}

export const getEmployeeMoveAnalysis = async (
    company: Company,
    teams: Team[],
    employees: Employee[],
    employeeToMove: Employee,
    destinationTeamId: string
): Promise<MoveAnalysis> => {
    const sourceTeam = teams.find(t => t.id === employeeToMove.teamId);
    const destinationTeam = teams.find(t => t.id === destinationTeamId);

    if (!sourceTeam || !destinationTeam) {
        throw new ServiceError("Source or destination team not found.");
    }
    
    const formatTeamForContext = (team: Team) => {
        const teamMembers = employees.filter(e => e.teamId === team.id && e.id !== employeeToMove.id);
        const memberList = teamMembers.length > 0 ? teamMembers.map(e => `- ${e.name} (${e.jobProfile})`).join('\n') : 'None';
        return `- **Name:** ${team.name}\n- **Description:** ${team.description}\n- **Current Members:**\n${memberList}`;
    };

    const context = `
**Company Profile:** ${company.profile}
**Employee to Move:** ${employeeToMove.name} (${employeeToMove.jobProfile})

**Source Team (before move):**
${formatTeamForContext(sourceTeam)}

**Destination Team (before move):**
${formatTeamForContext(destinationTeam)}
    `;

    const systemInstruction = `You are an expert organizational consultant AI. Your task is to analyze the strategic impact of moving an employee from one team to another.
Based on the provided context, you must:
1.  **Analyze the Impact:** Write a concise, one-paragraph analysis explaining the consequences, both positive and negative, of this move. Consider skill distribution, team focus, potential bottlenecks, and synergies.
2.  **Suggest Source Team Changes:** Based on its new composition (without the moved employee), suggest an OPTIONAL new name and description for the source team. If the original name and description are still perfectly suitable, omit these fields.
3.  **Suggest Destination Team Changes:** Based on its new composition (with the new employee), suggest an OPTIONAL new name and description for the destination team. If the original name and description are still perfectly suitable, omit these fields.

You MUST respond with ONLY a valid JSON object matching the provided schema. Do not include any other text or comments.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the following employee move:\n${context}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        impactAnalysis: { type: Type.STRING, description: "A one-paragraph analysis of the move's consequences." },
                        sourceTeamSuggestions: {
                            type: Type.OBJECT,
                            properties: {
                                newName: { type: Type.STRING, description: "An optional new name for the source team." },
                                newDescription: { type: Type.STRING, description: "An optional new description for the source team." }
                            }
                        },
                        destinationTeamSuggestions: {
                            type: Type.OBJECT,
                            properties: {
                                newName: { type: Type.STRING, description: "An optional new name for the destination team." },
                                newDescription: { type: Type.STRING, description: "An optional new description for the destination team." }
                            }
                        }
                    },
                    required: ["impactAnalysis", "sourceTeamSuggestions", "destinationTeamSuggestions"]
                },
            },
        });
        
        let jsonText = response.text.trim();
        // The model can sometimes wrap the JSON in markdown backticks despite the MIME type.
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonText = match[1];
        }
        
        try {
            return JSON.parse(jsonText) as MoveAnalysis;
        } catch (parseError) {
            console.error('Failed to parse move analysis JSON:', jsonText, parseError);
            throw new Error("Invalid JSON response from model.");
        }
    } catch(error) {
        handleGeminiError(error, 'analyzing employee move');
    }
}


export const getAssetManagerResponse = async (
    prompt: string,
    assets: SoftwareAsset[],
    companyId: string
): Promise<AssetAction> => {
    const assetsString = assets.length > 0 ? JSON.stringify(assets, null, 2) : 'No assets are currently being tracked.';
    const today = new Date().toISOString().split('T')[0];

    const systemInstruction = `You are an expert AI Software Asset Manager. Your sole responsibility is to manage the company's software and SaaS assets based on user commands. You will be provided with the current list of assets in JSON format. Your responses MUST be a JSON object that dictates the action to be taken.

**Current Date:** ${today}

**Actions & Response Schema:**
You have four primary actions: \`add\`, \`update\`, \`remove\`, and \`query\`.

1.  **add**: When the user wants to add a new asset.
    -   You MUST infer all required fields for a new asset from the user's prompt: \`name\`, \`type\`, \`seats\`, \`cost\`, \`costFrequency\`, \`renewalDate\`, and \`assignedTo\`. The \`description\`, \`version\`, and \`website\` fields are optional.
    -   If a required field is missing, you MUST ask the user for it in your \`responseText\` and set the action to \`query\`.
    -   For renewal dates, if the user says "next year", calculate the date one year from today.
    -   The \`payload\` should contain the complete new asset object.

2.  **update**: When the user wants to change an existing asset.
    -   You MUST identify the asset to update by its name from the user's prompt (use the \`assetName\` field for this).
    -   The \`payload\` should contain ONLY the fields that need to be changed.
    -   If you cannot uniquely identify the asset, ask for clarification.

3.  **remove**: When the user wants to delete an asset.
    -   You MUST identify the asset to remove by its name (use the \`assetName\` field).
    -   The \`payload\` is not needed for this action.

4.  **query**: For questions, greetings, or when you need more information from the user.
    -   Use this for answering questions about the asset list (e.g., "How much do we spend monthly?", "When is the Figma renewal?").
    -   Use this if the user's command is ambiguous or incomplete.

**Error Handling:**
-   If you cannot fulfill a request, set the action to \`error\` and explain why in the \`responseText\`.

You MUST ALWAYS respond with ONLY a valid JSON object matching the provided schema. Do not include any other text, comments, or markdown formatting.`;

    const assetPayloadSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the software or SaaS subscription." },
            description: { type: Type.STRING, description: "An optional, brief description of what the software is used for." },
            version: { type: Type.STRING, description: "An optional version number for the software." },
            website: { type: Type.STRING, description: "An optional official website link for the asset." },
            type: { type: Type.STRING, description: "The type of asset.", enum: ['SaaS Subscription', 'Software License', 'Other'] },
            seats: { type: Type.INTEGER, description: "The number of users or seats for the license/subscription." },
            cost: { type: Type.NUMBER, description: "The cost of the asset." },
            costFrequency: { type: Type.STRING, description: "The frequency of the cost.", enum: ['monthly', 'annually'] },
            renewalDate: { type: Type.STRING, description: "The renewal date in YYYY-MM-DD format." },
            assignedTo: { type: Type.STRING, description: "The team name the asset is assigned to, or 'Company-Wide'." },
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
Current Assets:
${assetsString}

User Command: "${prompt}"
            `,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        action: {
                            type: Type.STRING,
                            description: "The action to perform.",
                            enum: ['add', 'update', 'remove', 'query', 'error']
                        },
                        payload: {
                            ...assetPayloadSchema,
                            description: "The data for the asset. Required for 'add', partial for 'update'."
                        },
                        assetName: {
                            type: Type.STRING,
                            description: "The name of the asset to target for 'update' or 'remove' actions."
                        },
                        responseText: {
                            type: Type.STRING,
                            description: "The natural language response to display to the user in the chat."
                        },
                    },
                    required: ["action", "responseText"]
                },
            },
        });

        let jsonText = response.text.trim();
        // The model can sometimes wrap the JSON in markdown backticks despite the MIME type.
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonText = match[1];
        }

        try {
            return JSON.parse(jsonText) as AssetAction;
        } catch (parseError) {
            console.error('Failed to parse asset manager response JSON:', jsonText, parseError);
            throw new Error("Invalid JSON response from model.");
        }
    } catch (error) {
        handleGeminiError(error, 'getting asset manager response');
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    const context = 'generating an image';
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("Image generation returned no images.");
        }
    } catch (error) {
        handleGeminiError(error, context);
    }
};

export const generateProjectCompletionReport = async (
    project: Project,
    phases: ProjectPhase[],
    budget: ProjectBudget | null,
    expenses: ProjectExpense[],
    tasks: Task[],
    meetingMinutes: MeetingMinute[]
): Promise<RichTextBlock[]> => {
    const systemInstruction = `You are an expert AI Project Manager tasked with writing a final, comprehensive project completion report.
    Analyze all the provided data for the project and generate a structured, professional report.
    The report should be clear, concise, and suitable for executive review. It should include sections for:
    1.  Executive Summary: A brief overview of the project and its outcome.
    2.  Project Objectives: A restatement of the project's goals.
    3.  Timeline Summary: A comparison of the planned phases versus actual completion.
    4.  Financial Summary: A breakdown of the budget, actual spending, and variance.
    5.  Key Outcomes & Deliverables: A bulleted list of major achievements and completed items.

    You MUST respond with ONLY a valid JSON array matching the RichTextBlock schema. Do not include any other text, comments, or markdown formatting.`;

    const projectDataPrompt = `
    Project Data: ${JSON.stringify(project, null, 2)}
    Phases: ${JSON.stringify(phases, null, 2)}
    Budget: ${JSON.stringify(budget, null, 2)}
    Expenses: ${JSON.stringify(expenses, null, 2)}
    Tasks: ${JSON.stringify(tasks.map(({id, title, status}) => ({id, title, status})), null, 2)}
    Meeting Minutes (summary): ${JSON.stringify(meetingMinutes.map(({title, timestamp}) => ({title, timestamp})), null, 2)}
    `;

    const richTableBlockContentSchema = {
        type: Type.OBJECT,
        properties: {
            rows: {
                type: Type.ARRAY,
                description: "Rows of the table, each row is an array of strings.",
                items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        },
        required: ["rows"]
    };
    
    const richTextBlockSchema = {
        type: Type.OBJECT,
        properties: {
            type: {
                type: Type.STRING,
                description: "The type of the rich text block.",
                enum: ['heading1', 'heading2', 'paragraph', 'bulletList', 'numberedList', 'checkList', 'codeBlock', 'blockQuote', 'horizontalRule', 'table']
            },
            content: {
                oneOf: [
                    { type: Type.STRING },
                    richTableBlockContentSchema
                ],
                description: "The content of the block. A string for most types, or a table object for the 'table' type."
            }
        },
        required: ["type", "content"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please generate the final project report based on this data:\n${projectDataPrompt}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: richTextBlockSchema
                },
            },
        });

        let jsonText = response.text.trim();
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonText = match[1];
        }

        try {
            return JSON.parse(jsonText) as RichTextBlock[];
        } catch (parseError) {
            console.error('Failed to parse project report JSON:', jsonText, parseError);
            throw new Error("Invalid JSON response from model for project report.");
        }
    } catch (error) {
        handleGeminiError(error, 'generating project completion report');
    }
};

export const performTextAction = async (
    text: string,
    action: 'improve' | 'summarize' | 'formal' | 'casual' | 'translate',
    targetLanguage: string = 'English'
): Promise<string> => {
    let systemInstruction = '';
    const context = `performing text action: ${action}`;

    switch (action) {
        case 'improve':
            systemInstruction = `You are an expert copy editor. Your task is to revise the following text to improve its clarity, grammar, and flow. Retain the original meaning and tone. Respond with only the improved text, without any additional comments or explanations.`;
            break;
        case 'summarize':
            systemInstruction = `You are a text summarization engine. Condense the following text into its most essential points. The summary should be concise and capture the core message. Respond with only the summarized text, without any introductory phrases.`;
            break;
        case 'formal':
            systemInstruction = `You are a professional writing assistant. Rewrite the following text to adopt a more formal and professional tone, suitable for a business or academic context. Respond with only the rewritten text.`;
            break;
        case 'casual':
            systemInstruction = `You are a writing assistant who specializes in a friendly, conversational style. Rewrite the following text to sound more casual, approachable, and relaxed. Respond with only the rewritten text.`;
            break;
        case 'translate':
            systemInstruction = `You are a language translator. Translate the following text into ${targetLanguage}. Respond with only the translated text.`;
            break;
        default:
            throw new ServiceError('Invalid text action provided.');
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: { systemInstruction },
        });
        return response.text.trim();
    } catch (error) {
        handleGeminiError(error, context);
    }
};


export const summarizeBrainstormSession = async (
    history: ChatMessage[],
    topic: string,
    participants: Employee[],
    companyProfile: string
): Promise<{ title: string, content: string }> => {
    const context = `summarizing a brainstorm session`;
    
    const transcript = history
        .filter(msg => !msg.isTyping && msg.employeeId !== 'facilitator') // Exclude typing indicators and system messages
        .map(msg => {
            if (msg.role === 'user') {
                return `User: ${msg.text}`;
            }
            return `${msg.employeeName}: ${msg.text}`;
        }).join('\n');

    const participantList = participants.map(p => `${p.name} (${p.jobProfile})`).join(', ');

    const systemInstruction = `You are an expert AI assistant specializing in summarizing meeting transcripts into formal meeting minutes.
Analyze the provided meeting transcript and company profile.
Your output must be a single, structured markdown document.

The meeting minutes should include the following sections:
1.  **Attendees**: List all participants.
2.  **Objective**: A brief, one-sentence summary of the meeting's goal based on the topic and discussion.
3.  **Key Discussion Points**: A bulleted list summarizing the main topics and ideas discussed.
4.  **Decisions Made**: A bulleted list of any concrete decisions that were reached. If no decisions were made, state that clearly.
5.  **Action Items**: A bulleted list of all tasks or follow-ups assigned during the meeting. Each item should clearly state WHO is responsible and WHAT the task is.

Company Profile for context: "${companyProfile}"
Meeting Topic: "${topic}"
Attendees: ${participantList}

Transcript is provided in the user prompt.

Generate the meeting minutes now. Your response should ONLY be the markdown content of the minutes.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is the transcript of the meeting:\n\n${transcript}`,
            config: { systemInstruction }
        });

        const title = `Meeting Minutes: ${topic} - ${new Date().toLocaleDateString('en-CA')}`;
        const content = response.text.trim();
        return { title, content };
    } catch (error) {
        handleGeminiError(error, context);
    }
};


export { getSystemInstructionForCompanyChat };