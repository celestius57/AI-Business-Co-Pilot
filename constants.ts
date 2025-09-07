export enum JobProfile {
  PersonalAssistant = 'Personal Assistant',
  SalesManager = 'Sales Manager',
  SoftwareEngineer = 'Software Engineer',
  MarketingSpecialist = 'Marketing Specialist',
  CustomerSupport = 'Customer Support Representative',
  HRManager = 'Human Resources Manager',
  ProjectManager = 'Project Manager',
  AssetManager = 'Asset Manager',
  DataAnalyst = 'Data Analyst',
}

export const JOB_PROFILES: JobProfile[] = [
  JobProfile.PersonalAssistant,
  JobProfile.SalesManager,
  JobProfile.SoftwareEngineer,
  JobProfile.MarketingSpecialist,
  JobProfile.CustomerSupport,
  JobProfile.HRManager,
  JobProfile.ProjectManager,
  JobProfile.AssetManager,
  JobProfile.DataAnalyst,
];

export enum Tool {
  Whiteboard = 'Whiteboard',
  Kanban = 'Kanban',
  Code = 'Code',
  Collaboration = 'Collaboration',
  Document = 'Document',
  WordDocument = 'Word Document',
  PowerPoint = 'PowerPoint Presentation',
  ExcelSheet = 'Excel Sheet',
  Calendar = 'Calendar',
  CreateTask = 'Create Task',
  ProjectManagement = 'Project Management',
  Image = 'Image',
  Chart = 'Chart',
}

export const JOB_PROFILE_TOOLS: Partial<Record<JobProfile, Tool[]>> = {
  [JobProfile.SoftwareEngineer]: [Tool.Whiteboard, Tool.Code],
  [JobProfile.ProjectManager]: [Tool.Whiteboard, Tool.Kanban, Tool.ProjectManagement, Tool.Chart, Tool.Document],
  [JobProfile.PersonalAssistant]: [Tool.Calendar, Tool.CreateTask, Tool.Document],
  [JobProfile.MarketingSpecialist]: [Tool.Image, Tool.Chart],
  [JobProfile.SalesManager]: [Tool.Chart],
  [JobProfile.HRManager]: [Tool.Chart],
  [JobProfile.DataAnalyst]: [Tool.Chart, Tool.ExcelSheet],
};

export const FONT_OPTIONS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto Slab', value: '"Roboto Slab", serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
];

export const UI_STYLE_OPTIONS = [
  { name: 'Sharp (No rounding)', value: 'sharp' },
  { name: 'Rounded (Default)', value: 'rounded' },
  { name: 'Soft (Extra rounded)', value: 'soft' },
];

export const THEME_COLORS = [
  { name: 'Indigo', value: 'indigo', hex: '#6366f1' },
  { name: 'Sky', value: 'sky', hex: '#38bdf8' },
  { name: 'Emerald', value: 'emerald', hex: '#10b981' },
  { name: 'Rose', value: 'rose', hex: '#f43f5e' },
  { name: 'Amber', value: 'amber', hex: '#f59e0b' },
  { name: 'Violet', value: 'violet', hex: '#8b5cf6' },
  { name: 'Teal', value: 'teal', hex: '#14b8a6' },
];

export const DEFAULT_BRANDING = {
  themeColor: 'indigo',
  logo: '',
  fontFamily: 'Inter, sans-serif',
  uiStyle: 'rounded' as const,
};

export const COUNTRIES: { code: string; name: string }[] = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'BE', name: 'Belgium' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'SE', name: 'Sweden' },
];

export const CURRENCIES: { code: string; name: string; symbol: string }[] = [
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

export const DEFAULT_COMPANY_DAILY_REQUEST_LIMIT = 50;
export const DEFAULT_GLOBAL_API_REQUEST_LIMIT = 100;