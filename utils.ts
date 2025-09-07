


import type { OceanProfile, Company, Employee, Project, UserSettings, DateFormat, MeetingMinute, Event, Task, TaskPriority, Client, ProjectPhase, ProjectBudget, ProjectExpense, AppFile, RichTextBlock, RichTableBlockContent } from './types';
import { JobProfile, Tool, JOB_PROFILE_TOOLS } from './constants';
import TurndownService from 'turndown';

export const DATE_FORMATS: DateFormat[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

export const TIMEZONES: string[] = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
];

export const GUEST_AVATARS: string[] = [
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%271.5%27 stroke=%27%23a5b4fc%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9%27 /%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%271.5%27 stroke=%27%23a5b4fc%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 12l4.179 2.25m0 0l5.571 3 5.571-3m0 0l4.179-2.25L12 9.75l-5.571 3z%27 /%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%271.5%27 stroke=%27%23a5b4fc%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 00-5.84-2.56m0 0a14.98 14.98 0 00-5.84 2.56m5.84-2.56V4.72a6 6 0 0112 0v2.65a6 6 0 01-12 0v-2.65z%27 /%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%271.5%27 stroke=%27%23a5b4fc%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z%27 /%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%271.5%27 stroke=%27%23a5b4fc%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c-1.355 0-2.705-.154-4.008-.43A9.005 9.005 0 0112 2.999a9.005 9.005 0 018.008 11.218C19.205 17.538 15.602 21 12 21z%27 /%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%271.5%27 stroke=%27%23a5b4fc%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5%27 /%3E%3C/svg%3E',
];


export const getLondonTimestamp = (): string => {
  return new Date().toISOString();
};

export const formatTimestamp = (isoTimestamp: string, settings?: UserSettings): string => {
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const { dateFormat, timezone } = settings || { dateFormat: 'DD/MM/YYYY', timezone: 'Europe/London' };

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(date);
    
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;

    let dateString = '';
    switch (dateFormat) {
        case 'MM/DD/YYYY':
            dateString = `${month}/${day}/${year}`;
            break;
        case 'YYYY-MM-DD':
            dateString = `${year}-${month}-${day}`;
            break;
        case 'DD/MM/YYYY':
        default:
            dateString = `${day}/${month}/${year}`;
            break;
    }

    const timeString = `${hour}:${minute}`;

    return `${dateString} ${timeString}`;
  } catch (error) {
    console.warn("Invalid timezone provided, falling back to default formatting:", timezone);
    const fallbackOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    return date.toLocaleString('en-GB', fallbackOptions).replace(',', '');
  }
};

export const formatDate = (isoTimestamp: string, settings?: UserSettings): string => {
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const { dateFormat, timezone } = settings || { dateFormat: 'DD/MM/YYYY', timezone: 'Europe/London' };

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(date);
    
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    switch (dateFormat) {
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'DD/MM/YYYY':
        default:
            return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.warn("Invalid timezone provided, falling back to default formatting:", timezone);
    const fallbackOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };
    return date.toLocaleString('en-GB', fallbackOptions).split(',')[0];
  }
};

export const formatTime = (isoTimestamp: string, settings?: UserSettings): string => {
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    return 'Invalid Time';
  }
  const { timezone } = settings || { timezone: 'Europe/London' };

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  };

  try {
    // Using en-US for consistent AM/PM formatting
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.warn("Invalid timezone provided, falling back to default formatting:", timezone);
    const fallbackOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    return date.toLocaleString('en-US', fallbackOptions);
  }
};

export const formatCurrency = (amount: number, settings?: UserSettings): string => {
  const { currency } = settings || { currency: 'USD' };
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.warn(`Invalid currency code: ${currency}. Falling back to USD.`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
};

export const generateRandomOceanProfile = (): OceanProfile => ({
  openness: Math.floor(Math.random() * 101),
  conscientiousness: Math.floor(Math.random() * 101),
  extraversion: Math.floor(Math.random() * 101),
  agreeableness: Math.floor(Math.random() * 101),
  neuroticism: Math.floor(Math.random() * 101),
});

export const generateAvatarUrl = (name: string, gender: Employee['gender']): string => {
  // Simple hash function to get a consistent number from the name string.
  // This ensures the same name always gets the same image.
  const hash = name.split('').reduce((acc, char) => {
    acc = ((acc << 5) - acc) + char.charCodeAt(0);
    return acc & acc; // Convert to 32bit integer
  }, 0);

  const number = Math.abs(hash) % 100; // Use a number between 0 and 99.

  let genderPath: 'men' | 'women';
  if (gender === 'Male') {
    genderPath = 'men';
  } else { // 'Female'
    genderPath = 'women';
  }

  return `https://randomuser.me/api/portraits/${genderPath}/${number}.jpg`;
};

export const richTextToHtml = (blocks: RichTextBlock[]): string => {
    if (!Array.isArray(blocks)) return `<p>${blocks}</p>`; // Fallback for old plain text
    return blocks.map(block => {
        if (block.type === 'table') {
            const tableContent = block.content as RichTableBlockContent;
            const rowsHtml = tableContent.rows.map(row => {
                const cellsHtml = row.map(cell => `<td>${cell}</td>`).join('');
                return `<tr>${cellsHtml}</tr>`;
            }).join('');
            return `<table><tbody>${rowsHtml}</tbody></table>`;
        }

        const content = block.content as string;
        switch (block.type) {
            case 'heading1': return `<h1>${content}</h1>`;
            case 'heading2': return `<h2>${content}</h2>`;
            case 'bulletList': return `<ul>${content.split('\n').map(item => `<li>${item}</li>`).join('')}</ul>`;
            case 'numberedList': return `<ol>${content.split('\n').map(item => `<li>${item}</li>`).join('')}</ol>`;
            case 'checkList': return `<ul style="list-style-type: none; padding-left: 0;">${content.split('\n').map(item => {
                const checked = item.startsWith('[x]');
                const text = item.replace(/\[[x ]\]\s*/, '');
                return `<li><input type="checkbox" ${checked ? 'checked' : ''} disabled /> ${text}</li>`;
            }).join('')}</ul>`;
            case 'codeBlock': return `<pre><code>${content}</code></pre>`;
            case 'blockQuote': return `<blockquote>${content.replace(/\n/g, '<br/>')}</blockquote>`;
            case 'horizontalRule': return `<hr />`;
            case 'paragraph':
            default: return `<p>${content}</p>`;
        }
    }).join('');
};

export const richTextToMarkdown = (blocks: RichTextBlock[]): string => {
    const html = richTextToHtml(blocks);
    const turndownService = new TurndownService({ headingStyle: 'atx' });
    
    // Configure turndown for checklists
    turndownService.addRule('checklist', {
        filter: (node) => {
            return node.nodeName === 'LI' && node.firstChild?.nodeName === 'INPUT' && (node.firstChild as HTMLInputElement).type === 'checkbox';
        },
        replacement: (content, node) => {
            const checkbox = node.firstChild as HTMLInputElement;
            // Ensure there's a space after the bracket.
            return (checkbox.checked ? '- [x] ' : '- [ ] ') + content;
        }
    });
    return turndownService.turndown(html);
};

export const downloadFileFromContent = (content: string, fileName: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const downloadFileFromBase64 = (base64: string, fileName: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const buildCompanyContextString = (company: Company): string => {
  const { objectives, policies, certifications } = company;
  
  const hasDirectives = objectives || policies || certifications;
  if (!hasDirectives) {
    return `
**Company Context:**
Company Profile: "${company.profile}"
    `.trim();
  }

  const contextParts = [];
  contextParts.push(`- **Company Profile:** ${company.profile}`);
  if (objectives) {
    contextParts.push(`- **Objectives:**\n${objectives}`);
  }
  if (policies) {
    contextParts.push(`- **Policies:**\n${policies}`);
  }
  if (certifications) {
    contextParts.push(`- **Certifications:**\n${certifications}`);
  }

  return `
**Company-Wide Directives:**
You must operate within the following company framework.
${contextParts.join('\n\n')}

**Operational Mandate:**
If a user's request appears to conflict with these directives, you must:
1. Acknowledge the user's request.
2. Gently and professionally point out the potential deviation from company objectives, policies, or certifications.
3. Explain the reasoning behind the relevant directive.
4. Propose an alternative solution that aligns with company guidelines.
5. If the user confirms they wish to proceed with their original request despite your counsel, you must comply with their final decision. Your primary role is to assist, not to block.
  `.trim();
};

export const buildProjectContextString = (project: Project, client?: Client): string => {
  const clientContext = client ? `\n**Client:** This project is for "${client.name}".` : '';
  return `
---
**CURRENT PROJECT CONTEXT:**
You are currently working on the "${project.name}" project.${clientContext}
**Project Description:** "${project.description}"
All your responses should be within the context of this project.
---
  `.trim();
}

export const buildProjectPhasesContextString = (phases: ProjectPhase[]): string => {
    if (phases.length === 0) {
        return `
---
**PROJECT TIMELINE:**
This project currently has no planned phases.
---
        `.trim();
    }
    const phaseList = phases
        .map(p => `- **${p.name}** (ID: \`${p.id}\`) (${p.status}): From ${p.startDate.split('T')[0]} to ${p.endDate.split('T')[0]}`)
        .join('\n');
    return `
---
**PROJECT TIMELINE & PHASE IDs:**
This is the current timeline for the project. **You MUST use the provided ID when targeting a specific phase for an update or deletion.**
${phaseList}
---
    `.trim();
};

export const buildProjectBudgetContextString = (budget: ProjectBudget | null, expenses: ProjectExpense[], currency: string): string => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetInfo = budget ? `Total Budget: ${budget.totalBudget.toLocaleString()} ${currency}` : 'No budget has been set for this project yet.';
    const remainingInfo = budget ? `Remaining Budget: ${(budget.totalBudget - totalSpent).toLocaleString()} ${currency}` : '';

    return `
---
**PROJECT BUDGET (in ${currency}):**
- ${budgetInfo}
- Total Spent So Far: ${totalSpent.toLocaleString()} ${currency}
${remainingInfo ? `- ${remainingInfo}` : ''}
---
    `.trim();
};

export const buildMeetingMinutesContextString = (minutes: MeetingMinute[]): string => {
    if (minutes.length === 0) return '';
    
    // Sort by most recent first and take the last 5
    const recentMinutes = minutes.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    const minutesText = recentMinutes.map(minute => {
        const date = new Date(minute.timestamp);
        const formattedDate = !isNaN(date.getTime()) ? date.toLocaleDateString('en-CA') : 'Invalid Date';
        return `
### Meeting on ${formattedDate}: ${minute.title}
${minute.content}
        `.trim();
    }).join('\n\n---\n\n');

    return `
---
**RECENT MEETING MINUTES SUMMARY:**
You have access to the minutes from recent meetings for this project. Use this information to inform your responses, maintain continuity, and understand past decisions.
${minutesText}
---
    `.trim();
};

export const buildEmployeeRosterString = (employees: Employee[]): string => {
    // Filter out the assistant themselves from the roster they see
    const otherEmployees = employees.filter(e => e.jobProfile !== JobProfile.PersonalAssistant);

    if (otherEmployees.length === 0) {
        return `
**Company Employee Roster:**
There are currently no other employees in the company.
        `.trim();
    }

    const employeeList = otherEmployees.map(e => `- **${e.name}** (${e.jobProfile}) | ID: \`${e.id}\``).join('\n');

    return `
**Company Employee Roster:**
This is the current list of employees in the company, along with their unique IDs. You can collaborate with them on tasks outside your expertise using the Collaboration tool.
${employeeList}
    `.trim();
};

export const buildBrainstormingRosterString = (employees: Employee[], self: Employee): string => {
  const otherEmployees = employees.filter(e => e.id !== self.id);

  let employeeList = "You are in this brainstorming session alone.";
  if (otherEmployees.length > 0) {
    employeeList = otherEmployees.map(e => `- ${e.name} (${e.jobProfile})`).join('\n');
  }

  return `
---
**GROUP BRAINSTORMING SESSION**
You are part of a group chat with your colleagues. The user can see messages from everyone.
You are **${self.name}**.
Your colleagues in this chat are:
${employeeList}
---
  `.trim();
}

export const getToolsForJobProfile = (profile: string): Tool[] => {
  const defaultTools = [Tool.Whiteboard, Tool.Collaboration, Tool.WordDocument, Tool.PowerPoint, Tool.ExcelSheet];
  const specificTools = JOB_PROFILE_TOOLS[profile as JobProfile] || [];
  
  // Use a Set to ensure tools are not duplicated
  const allTools = new Set([...defaultTools, ...specificTools]);

  return Array.from(allTools);
};

export const buildToolsInstructions = (tools: Tool[]): string => {
  if (tools.length === 0) return '';

  const toolDescriptions = tools.map(tool => {
    switch (tool) {
      case Tool.Whiteboard:
        return `- **${Tool.Whiteboard}**: You MUST use this tool for generating any diagrams like flowcharts or sequence diagrams. The \`data\` must be a string of valid Mermaid.js syntax. **CRITICAL**: To prevent errors, you MUST enclose all node text in double quotes. For example: \`graph TD; A["Node 1"] --> B["Node 2 (with details)"];\`. This is mandatory for all nodes.`;
      case Tool.Kanban:
        return `- **${Tool.Kanban}**: You MUST use this tool for visualizing tasks in a board format. The \`data\` must be a JSON object with the format: \`{"columns": [{"title": "Column Title", "tasks": [{"id": "task-1", "content": "Task description", "priority": "Medium"}]}]}\`. The \`priority\` field is optional and can be 'Low', 'Medium', 'High', or 'Urgent'.`;
      case Tool.Code:
        return `- **${Tool.Code}**: You MUST use this tool for displaying formatted code snippets. The \`data\` must be a JSON object with the format: \`{"language": "javascript", "code": "console.log(\\"hello\\")"}\`.`;
      case Tool.Collaboration:
        return `- **${Tool.Collaboration}**: To ask a colleague for help on a task outside your expertise. The \`data\` must be a JSON object with the format: \`{"employeeId": "emp_...", "question": "Your specific question for the colleague."}\`. The \`text\` field in the main JSON object should be used to inform the user who you are contacting (e.g., "That's a good question, let me check with Sarah in Marketing."). Use the employee roster to find the correct \`employeeId\`.`;
      case Tool.Document:
        return `- **${Tool.Document}**: When asked to create a new internal document from a template (e.g., "project brief", "meeting minutes template", "marketing plan"), you MUST use this tool. The \`data\` object MUST contain a \`"fileName"\` key and a \`"content"\` key. The \`"content"\` key MUST be a non-empty array of RichTextBlock objects, structured according to the requested template. For example: \`"content": [{"type": "heading1", "content": "Project Brief: New Website"}, {"type": "paragraph", "content": "This document outlines the goals..."}]\`. You are responsible for generating the full, structured content of the template.`;
      case Tool.WordDocument:
        return `- **${Tool.WordDocument}**: When asked to create any kind of text document, report, or written analysis, you MUST use this tool. DO NOT write the document content directly in the chat. **Exception**: If the user explicitly asks you to share the content as plain text for troubleshooting, you may output the document content inside a markdown code block. Otherwise, always use the tool. The \`data\` object MUST contain a \`"fileName"\` key and a \`"content"\` key. The \`"content"\` key MUST be a non-empty array of objects, for example: \`"content": [{"type": "heading1", "text": "My Report Title"}, {"type": "paragraph", "text": "This is the first paragraph."}]\`. This is not optional; the user needs to see a preview.`;
      case Tool.PowerPoint:
        return `- **${Tool.PowerPoint}**: When asked to create a presentation or slides, you MUST use this tool. DO NOT describe the slides in the chat. **Exception**: If the user explicitly asks you to share the content as plain text for troubleshooting, you may output a text representation of the slides inside a markdown code block. Otherwise, always use the tool. The \`data\` object MUST contain a \`"fileName"\` key and a \`"slides"\` key. The \`"slides"\` key MUST be a non-empty array of objects, for example: \`"slides": [{"title": "Slide 1 Title", "content": "Bullet point 1\\nBullet point 2"}]\`. Use '\\n' for new lines. This is not optional; the user needs to see a preview.`;
      case Tool.ExcelSheet:
        return `- **${Tool.ExcelSheet}**: When asked to create a spreadsheet or table of data, you MUST use this tool. DO NOT create a markdown table in the chat. **Exception**: If the user explicitly asks you to share the content as plain text (e.g., CSV format) for troubleshooting, you may output the data inside a markdown code block. Otherwise, always use the tool. The \`data\` object MUST contain a \`"fileName"\` key and a \`"sheets"\` key. The \`"sheets"\` key MUST be a non-empty array of objects, for example: \`"sheets": [{"name": "Sheet1", "data": [["Header1", "Header2"], ["A2", "B2"]]}]\`. The 'data' is an array of arrays representing rows. This is not optional; the user needs to see a preview.`;
      case Tool.Calendar:
        return `- **${Tool.Calendar}**: To PROPOSE creating a calendar event, task, or reminder for user approval. The \`data\` must be a JSON object with the format: \`{"type": "meeting" | "task" | "reminder", "title": "string", "description": "string", "start": "ISO 8601 string", "end": "ISO 8601 string", "participantIds": ["emp_..."]}\`. For 'task' or 'reminder' types, if the user doesn't specify a time, you MUST omit the 'start' and 'end' fields; the system will default to the current time. 'participantIds' are typically only for meetings. Use the provided company employee roster to find the correct \`employeeId\` for any participants.`;
      case Tool.CreateTask:
        return `- **${Tool.CreateTask}**: To PROPOSE creating a new task on the company task board for user approval. The \`data\` MUST be a JSON object with the format: \`{"title": "string", "description": "string", "projectId": "proj_...", "assigneeId": "emp_...", "priority": "Low" | "Medium" | "High" | "Urgent"}\`. You MUST use the provided company project list and employee roster to find the correct \`projectId\` and \`assigneeId\`. If the user does not specify an assignee, you MUST use your knowledge of the employee roster to assign it to the most appropriate person. If the user doesn't specify a priority, default to 'Medium'.`;
      case Tool.ProjectManagement:
        return `- **${Tool.ProjectManagement}**: For PROPOSING changes to the project's plan and budget for user approval.
    - **CONTEXT RULE**: You MUST ONLY use this tool when inside a specific project chat.
    - **ACTION RULE**: When a user requests to change, update, add, or delete any part of the project plan or budget, you MUST use this tool.
    - **RESPONSE FORMAT**: Your response MUST be a single JSON object with an \`action\` and \`payload\`.
    - **ACTION KEY ENFORCEMENT**: The \`action\` key is CRITICAL. It MUST be one of the following exact strings:
        - \`"add_phase"\`
        - \`"add_multiple_phases"\`
        - \`"update_phase"\`
        - \`"delete_phase"\`
        - \`"set_budget"\`
        - \`"add_expense"\`
        - \`"query"\`
    - **DEVIATION PROHIBITED**: Using ANY other string for the \`action\` key is strictly forbidden and will cause a system failure. Do not invent actions like "createPhase" or "updateBudget".
    - **Payloads for each action**:
      - \`"action": "add_phase"\`, \`"payload": {"name": "string", "description": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}\`
      - \`"action": "add_multiple_phases"\`, \`"payload": [{"name": "string", "description": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}, ...]\`
      - \`"action": "update_phase"\`, \`"payload": {"phaseId": "string", "updates": { ... }}\` (You MUST use the phaseId from the context provided).
      - \`"action": "delete_phase"\`, \`"payload": {"phaseId": "string"}\` (You MUST use the phaseId).
      - \`"action": "set_budget"\`, \`"payload": {"totalBudget": number}\`
      - \`"action": "add_expense"\`, \`"payload": {"description": "string", "amount": number, "category": "string", "date": "YYYY-MM-DD"}\`
      - \`"action": "query"\`, \`"payload": {}\` (For answering questions without making changes).`;
      case Tool.Image:
        return `- **${Tool.Image}**: To generate an image from a text description. You MUST use this tool when the user asks for a picture, photo, or image. The \`data\` must be a JSON object with the format: \`{"prompt": "A detailed, descriptive prompt for the image generation model."}\`.`;
      case Tool.Chart:
        return `- **${Tool.Chart}**: You MUST use this tool to generate visual reports like pie, bar, or line charts for ANY kind of data analysis (e.g., marketing campaign results, sales trends, employee demographics, financial summaries). The \`data\` must be a valid Chart.js configuration object with these specific keys: \`"chartType"\` ('pie', 'bar', or 'line'), \`"title"\` (a string for the chart title), \`"labels"\` (an array of strings), and \`"datasets"\` (an array of objects, where each object has a \`label\` string and a \`data\` array of numbers). For example: \`{"chartType": "pie", "title": "Expense Breakdown", "labels": ["Marketing", "Software"], "datasets": [{"label": "Expenses", "data": [1200, 800]}]}\`.`;
      default:
        return '';
    }
  }).join('\n');

  return `
---
**PRIMARY DIRECTIVE: HOW TO RESPOND**
Your primary goal is to use the specialized tools available to you. Plain text responses are a last resort.

**Response Hierarchy (MUST be followed):**
1.  **FIRST (Use Data Management Tools):** For requests involving tasks, events, or project plans, you MUST use the corresponding tool (\`${Tool.CreateTask}\`, \`${Tool.Calendar}\`, \`${Tool.ProjectManagement}\`). These tools propose changes for user approval. This is your highest priority.

2.  **SECOND (Use AI Tool Canvas):** For requests that require a visual or file-based output (documents, presentations, spreadsheets, diagrams, code, charts), you MUST use the appropriate AI Tool Canvas tool (\`${Tool.WordDocument}\`, \`${Tool.PowerPoint}\`, \`${Tool.ExcelSheet}\`, \`${Tool.Whiteboard}\`, \`${Tool.Code}\`, \`${Tool.Chart}\`). **Under no circumstances should you output raw document content, Mermaid syntax, large JSON objects for Kanban boards, or multi-line code snippets directly in the chat as plain text. Always use the tool.**

3.  **LAST RESORT (Plain Text):** Only if a request cannot possibly be fulfilled by any available tool should you respond in plain text.

**TOOL USAGE INSTRUCTIONS**
When a tool is required, your ENTIRE response MUST be a single, valid JSON object. Do not include any text outside of this JSON. The JSON must have this exact structure:
\`\`\`json
{
  "tool": "TOOL_NAME",
  "data": "TOOL_DATA",
  "text": "A brief, one-sentence description of what you are proposing or generating."
}
\`\`\`

- \`"tool"\`: The name of the tool you are using from the list below.
- \`"data"\`: The data for the tool in the specified format.
- \`"text"\`: A message to display in the chat history. For data-modifying tools, this should state what you are proposing (e.g., "I can add that event to the calendar for you. Please review and approve."). For canvas tools, it describes what you've created (e.g., "Here is the flowchart you requested.").

If the user's request does NOT require a tool, respond with plain text as you normally would.

**AVAILABLE TOOLS & DATA FORMATS:**
${toolDescriptions}
---
  `.trim();
};

export const buildAllClientsContextString = (clients: Client[]): string => {
    if (clients.length === 0) {
        return `
---
**ALL COMPANY CLIENTS:**
There are currently no clients registered with the company.
---
        `.trim();
    }

    const clientsList = clients.map(c => `- **${c.name}**: Status: ${c.status} (ID: \`${c.id}\`)`).join('\n');

    return `
---
**ALL COMPANY CLIENTS:**
This is a list of all company clients.
${clientsList}
---
    `.trim();
};

export const buildAllProjectsContextString = (projects: Project[], clients: Client[]): string => {
    if (projects.length === 0) {
        return `
---
**ALL COMPANY PROJECTS:**
There are currently no active projects in the company.
---
        `.trim();
    }
    
    const clientMap = new Map(clients.map(c => [c.id, c.name]));

    const projectsList = projects.map(p => {
        const clientName = p.clientId ? clientMap.get(p.clientId) : null;
        const projectTitle = clientName 
            ? `- **${p.name} (for ${clientName}) (ID: \`${p.id}\`)**: ${p.description}`
            : `- **${p.name} (Internal Project) (ID: \`${p.id}\`)**: ${p.description}`;
        return projectTitle;
    }).join('\n');


    return `
---
**ALL COMPANY PROJECTS:**
This is a list of all projects within the company. You have full awareness of them.
${projectsList}
---
    `.trim();
};

export const buildAllMeetingMinutesContextString = (minutes: MeetingMinute[], projects: Project[]): string => {
    if (minutes.length === 0) {
        return `
---
**ALL MEETING MINUTES:**
There are no meeting minutes recorded for any project yet.
---
        `.trim();
    }
    
    const minutesByProject = minutes.reduce((acc, minute) => {
        if (!acc[minute.projectId]) {
            acc[minute.projectId] = [];
        }
        acc[minute.projectId].push(minute);
        return acc;
    }, {} as Record<string, MeetingMinute[]>);

    const minutesList = Object.entries(minutesByProject).map(([projectId, projectMinutes]) => {
        const project = projects.find(p => p.id === projectId);
        const projectName = project ? project.name : `Unknown Project (ID: ${projectId})`;
        
        const minuteTitles = projectMinutes
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5) // Limit to 5 most recent per project to avoid huge prompt
            .map(m => {
                const date = new Date(m.timestamp);
                const titleDate = !isNaN(date.getTime()) ? date.toLocaleDateString('en-CA') : 'Invalid Date';
                return `  - "${m.title}" on ${titleDate}`;
            })
            .join('\n');

        return `- **Project: ${projectName}**\n${minuteTitles}`;
    }).join('\n\n');

    return `
---
**ALL MEETING MINUTES:**
This is a summary of the most recent meeting minutes across all projects. You have full awareness of all of them, including their full content.
${minutesList}
---
    `.trim();
};

export const buildAllEventsContextString = (events: Event[]): string => {
    const now = new Date();
    const upcomingEvents = events
        .filter(e => new Date(e.end) >= now)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 20); // Limit to next 20 upcoming events to save tokens

    if (upcomingEvents.length === 0) {
        return `
---
**COMPANY CALENDAR:**
The company calendar has no upcoming events. You are still aware of all past events.
---
        `.trim();
    }

    const eventsList = upcomingEvents.map(e => {
        const date = new Date(e.start);
        if (isNaN(date.getTime())) {
            return `- **${e.title}** (${e.type}) on an invalid date`;
        }
        const startDate = date.toLocaleDateString('en-CA');
        const startTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `- **${e.title}** (${e.type}) on ${startDate} at ${startTime}`;
    }).join('\n');

    return `
---
**COMPANY CALENDAR:**
You have access to the entire company calendar. Here is a summary of upcoming events.
---
    `.trim();
};

export const calculateTaskPriority = (task: Partial<Task>): TaskPriority => {
    if (!task.dueDate) {
        return 'Low';
    }

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    
    if (isNaN(dueDate.getTime())) {
        return 'Low';
    }

    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue <= 0) {
        return 'Urgent';
    }
    if (hoursUntilDue <= 48) {
        return 'High';
    }
    if (hoursUntilDue <= 14 * 24) { // 14 days in hours
        return 'Medium';
    }
    
    return 'Low';
};

export const buildAllTasksContextString = (tasks: Task[], employees: Employee[], projects: Project[]): string => {
    if (tasks.length === 0) {
        return `
---
**ALL COMPANY TASKS:**
There are currently no tasks on the company task board.
---
        `.trim();
    }

    const tasksList = tasks.map(task => {
        const assignee = employees.find(e => e.id === task.assigneeId);
        const project = projects.find(p => p.id === task.projectId);
        const currentPriority = calculateTaskPriority(task);
        return `- **${task.title}** (ID: \`${task.id}\`): Status: '${task.status}', Priority: '${currentPriority}', Project: '${project?.name || 'N/A'}', Assignee: '${assignee?.name || 'Unassigned'}'`;
    }).join('\n');

    return `
---
**ALL COMPANY TASKS:**
This is a list of all tasks on the company task board. You have full awareness of them.
---
    `.trim();
};

function parseRichText(blocks: RichTextBlock[]): string {
    if (!Array.isArray(blocks)) {
        // Fallback for older plain text format
        return String(blocks);
    }

    return blocks.map(block => {
        if (block.type === 'table') {
            const table = block.content as RichTableBlockContent;
            return table.rows.map(row => row.join(' | ')).join('\n');
        }
        
        const content = block.content as string;
        switch(block.type) {
            case 'heading1': return `# ${content}`;
            case 'heading2': return `## ${content}`;
            case 'bulletList': return content.split('\n').map(i => `- ${i}`).join('\n');
            case 'numberedList': return content.split('\n').map((item, index) => `${index + 1}. ${item}`).join('\n');
            case 'checkList': return content.split('\n').map(i => `- ${i}`).join('\n');
            case 'codeBlock': return `\`\`\`\n${content}\n\`\`\``;
            case 'blockQuote': return `> ${content.replace(/\n/g, '\n> ')}`;
            case 'horizontalRule': return '---';
            case 'paragraph':
            default: return content;
        }
    }).join('\n\n');
}

export const buildFilesContextString = (files: AppFile[]): string => {
    const nonArchivedFiles = files.filter(f => !f.isArchived);

    if (nonArchivedFiles.length === 0) {
        return '';
    }

    const filesContent = nonArchivedFiles.map(file => {
        let contentText = `[Content for file "${file.name}" is not available in a readable format.]`;
        
        // Only process text-based files. Images will be ignored.
        if (file.type === 'file' && (!file.mimeType || file.mimeType === 'application/json' || file.mimeType.startsWith('text/'))) {
            try {
                // application/json is the mimeType for our rich text format
                if (file.mimeType === 'application/json' && file.content) {
                    const parsedContent = JSON.parse(file.content);
                    contentText = parseRichText(parsedContent);
                } else {
                    // It might be old plain text.
                    contentText = file.content || '';
                }
            } catch (e) {
                // If parsing fails, it might be plain text stored with a json mimetype by mistake.
                contentText = file.content || '';
            }
        } else if (file.type === 'file' && file.mimeType?.startsWith('image/')) {
            contentText = `[This is an image file named "${file.name}". Its content cannot be displayed here.]`;
        } else if (file.type === 'folder') {
            contentText = `[This is a folder named "${file.name}".]`;
        }
        
        return `--- FILE START: ${file.name} ---\n${contentText}\n--- FILE END: ${file.name} ---`;
    }).join('\n\n');

    return `
---
**RELEVANT FILES:**
The following files and their contents are associated with the current project or client. You MUST use this information as context for your responses.

${filesContent}
---
    `.trim();
};

export const findUniqueFileName = (fileName: string, existingFileNames: string[]): string => {
  const nameSet = new Set(existingFileNames);
  if (!nameSet.has(fileName)) {
    return fileName;
  }

  const parts = fileName.match(/(.*?)(\.[^.]*)?$/);
  const baseName = parts?.[1] || fileName;
  const extension = parts?.[2] || '';

  let counter = 1;
  let newName = `${baseName} (${counter})${extension}`;
  while (nameSet.has(newName)) {
    counter++;
    newName = `${baseName} (${counter})${extension}`;
  }
  return newName;
};