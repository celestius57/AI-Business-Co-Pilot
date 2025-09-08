

import type { JobProfile, Tool } from './constants';

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export interface NotificationSettings {
    eventStart: boolean; // 15 mins before meeting
    taskDueDate: boolean; // On due date for Task object
    reminder: boolean; // 15 mins before reminder
}

export interface UserSettings {
  dateFormat: DateFormat;
  timezone: string;
  country?: string; // 2-letter ISO country code
  currency: string; // 3-letter ISO currency code, e.g. 'USD'
  globalApiRequestLimit?: number;
  generatedDocsTimeframe?: number; // in days, e.g., 7, 30, 90
  notificationSettings?: NotificationSettings;
}

export interface User {
  id: string; // This will correspond to auth.users.id
  name: string;
  email: string;
  picture: string;
  settings: UserSettings;
}

export interface CompanyBranding {
  themeColor: string; // e.g., 'indigo', 'sky', 'emerald'
  logo: string;       // Base64 data URL
  fontFamily: string; // e.g. 'Inter, sans-serif'
  uiStyle: 'sharp' | 'rounded' | 'soft';
}

export interface Company {
  id: string;
  userId: string; // Foreign key to auth.users
  name: string;
  profile: string;
  objectives?: string;
  policies?: string;
  certifications?: string;
  lastLoginTimestamp?: number;
  branding?: CompanyBranding;
  dailyApiRequestLimit?: number;
  apiRequestCount?: number;
  lastApiRequestTimestamp?: number;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  contactPerson?: string;
  contactEmail?: string;
  status: 'Active' | 'Inactive' | 'Prospect';
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
}

export interface Team {
  id:string;
  name: string;
  companyId: string;
  departmentId?: string;
  description?: string;
  icon?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  companyId: string;
  employeeIds: string[];
  clientId?: string;
  status: 'Active' | 'Completed';
  completionTimestamp?: string; // ISO 8601
}

export interface Employee {
  id: string;
  companyId: string; // Foreign key to Company
  name: string;
  jobProfile: string; // Using string to allow for custom job titles
  teamId?: string;
  systemInstruction: string;
  gender: 'Male' | 'Female';
  avatarUrl: string;
  oceanProfile: OceanProfile;
  chatHistories: Record<string, ChatMessage[]>; // 'general' and project IDs as keys
  morale: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  file?: {
    name: string;
    data: string; // base64 encoded string
    mimeType: string;
  };
  toolTriggered?: ToolOutput;
  generatedFile?: {
    blobUrl: string;
    fileName: string;
  };
  employeeId?: string;
  employeeName?: string;
  employeeAvatarUrl?: string;
  isTyping?: boolean;
  generatedImageBase64?: string;
  isPraised?: boolean;
}

export interface BrainstormSession {
  id: string;
  companyId: string;
  topic: string;
  description: string;
  participantIds: string[];
  history: ChatMessage[];
  contextType: 'team' | 'project' | 'meeting';
  contextId: string;
  lastActivity: string;
  eventId?: string;
}

export type EventType = 'meeting' | 'note' | 'reminder';

export interface Event {
  id: string;
  companyId: string;
  title: string;
  description: string;
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
  participantIds: string[];
  color: string;
  type: EventType;
  projectId?: string;
  clientId?: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string;
  companyId: string;
  projectId: string;
  assigneeId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO 8601 format
  completionTimestamp?: string; // ISO 8601 format
  closureComment?: string;
}

export interface MeetingMinute {
  id: string;
  companyId: string;
  projectId: string;
  title: string;
  content: string;
  timestamp: string; // ISO 8601 format
}

export interface OceanProfile {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
}

export type HiringProposal = {
    teamName: string;
    teamDescription?: string;
    jobProfile: string;
    employeeName: string;
    gender: 'Male' | 'Female';
    systemInstruction: string;
    reasoning: string;
    oceanProfile: OceanProfile;
};

export type EmployeeProposal = {
    name: string;
    jobProfile: string;
    gender: 'Male' | 'Female';
    systemInstruction: string;
    oceanProfile: OceanProfile;
};

export type TeamProposal = {
    name: string;
    description: string;
    employees: EmployeeProposal[];
};

export type InitialStructureProposal = {
    teams: TeamProposal[];
};

export interface ToolOutput {
  tool: Tool;
  data: any;
  text?: string;
}

export type MoveAnalysis = {
    impactAnalysis: string;
    sourceTeamSuggestions: {
        newName?: string;
        newDescription?: string;
    };
    destinationTeamSuggestions: {
        newName?: string;
        newDescription?: string;
    };
};

export interface PublicHoliday {
    date: string; // "YYYY-MM-DD"
    localName: string;
    name: string;
    countryCode: string;
    fixed: boolean;
    global: boolean;
    counties: string[] | null;
    launchYear: number | null;
    types: string[];
}

export interface SoftwareAsset {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  version?: string;
  website?: string;
  type: 'SaaS Subscription' | 'Software License' | 'Other';
  seats: number;
  cost: number;
  costFrequency: 'monthly' | 'annually';
  renewalDate: string; // ISO 8601 format
  assignedTo: string; // Team name or "Company-Wide"
}
export type AssetActionType = 'add' | 'update' | 'remove' | 'query' | 'error';

export interface AssetAction {
    action: AssetActionType;
    payload?: Partial<Omit<SoftwareAsset, 'id' | 'companyId'>>;
    assetName?: string;
    responseText: string;
}

export type ProjectPhaseStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  status: ProjectPhaseStatus;
}

export interface ProjectBudget {
  projectId: string; // Acts as ID since it's 1-to-1 with project
  totalBudget: number;
  currency: string;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO 8601
}

export interface QuickNote {
  id: string;
  companyId: string;
  content: string;
  color: string; // e.g., 'yellow', 'pink', 'blue', 'green'
  isCollapsed?: boolean;
}

export type RichTableBlockContent = {
  rows: string[][]; // Each string can contain inline HTML
};

export type RichTextBlock = {
  type: 'heading1' | 'heading2' | 'paragraph' | 'bulletList' | 'numberedList' | 'checkList' | 'codeBlock' | 'blockQuote' | 'horizontalRule';
  content: string; // For lists, newline-separated. For checklist, includes [ ] or [x]. For others, can contain inline HTML.
} | {
  type: 'table';
  content: RichTableBlockContent;
};

export interface AppFile {
  id: string;
  companyId: string;
  parentId: string; // Can be projectId, clientId, or another AppFile's id (if folder)
  parentType: 'project' | 'client';
  type: 'file' | 'folder';
  name: string;
  content?: string; // JSON string for files, undefined for folders
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  mimeType?: string; // Only for files
  isArchived?: boolean;

  // Phase 1 metadata
  authorId?: string;
  authorName?: string;
  status?: 'Draft' | 'In Review' | 'Approved';

  // Phase 3 metadata
  reviewerId?: string;
  reviewerName?: string;
}


export interface GeneratedDocument {
  id: string;
  companyId: string;
  fileName: string;
  base64Content: string;
  mimeType: string;
  createdAt: string; // ISO 8601
  generatedByEmployeeId: string;
  generatedByEmployeeName: string;
  generatedByEmployeeAvatarUrl: string;
  context: {
      type: 'direct' | 'brainstorm';
      contextDescription: string; // e.g., "Chat with John Doe" or "Brainstorm: Marketing Q3"
  }
  sourceData: any; // The original JSON data from the ToolOutput used to generate the file
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    timestamp: string; // ISO 8601
    read: boolean;
    link?: {
        type: 'event' | 'task' | 'file';
        id: string;
    };
}