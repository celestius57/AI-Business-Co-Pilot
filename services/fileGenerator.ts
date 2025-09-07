
import type { ToolOutput } from '../types';
import { Tool } from '../constants';

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',', 2)[1];
        resolve(base64);
    };
    reader.readAsDataURL(blob);
});

const fixExtension = (fileName: string, expectedExtension: string): string => {
    const lowerFileName = fileName.toLowerCase();
    const lowerExpectedExt = expectedExtension.toLowerCase();

    if (lowerFileName.endsWith(lowerExpectedExt)) {
        return fileName;
    }

    const lastDotIndex = fileName.lastIndexOf('.');
    // If there's a dot and it's not the first character, and it seems like an extension
    if (lastDotIndex > 0 && lastDotIndex > fileName.length - 6) {
        const baseName = fileName.slice(0, lastDotIndex);
        return `${baseName}${expectedExtension}`;
    }
    
    // No extension or dot is part of the name
    return `${fileName}${expectedExtension}`;
};


export const generateFileBlob = async (toolOutput: ToolOutput): Promise<{ blob: Blob; fileName: string; base64Content: string; mimeType: string; } | null> => {
    switch (toolOutput.tool) {
        case Tool.WordDocument:
            return generateDocxBlob(toolOutput.data);
        case Tool.PowerPoint:
            return generatePptxBlob(toolOutput.data);
        case Tool.ExcelSheet:
            return generateXlsxBlob(toolOutput.data);
        default:
            console.error('Unsupported file type for generation:', toolOutput.tool);
            return null;
    }
};

const generateDocxBlob = async (data: { fileName: string; content: { type: string; text: string }[] }): Promise<{ blob: Blob; fileName: string; base64Content: string; mimeType: string; } | null> => {
    try {
        const { Packer, Document, Paragraph, HeadingLevel, TextRun } = await import('docx');

        const docChildren = data.content.map(item => {
            if (item.type === 'heading1') {
                return new Paragraph({
                    children: [new TextRun(item.text)],
                    heading: HeadingLevel.HEADING_1,
                });
            }
            return new Paragraph({
                children: [new TextRun(item.text)],
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: docChildren,
            }],
        });

        const blob = await Packer.toBlob(doc);
        const base64Content = await blobToBase64(blob);
        const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const finalFileName = fixExtension(data.fileName || 'document.docx', '.docx');
        return { blob, fileName: finalFileName, base64Content, mimeType };
    } catch (error) {
        console.error('Error: The document generation library (docx) failed to load or process.', error);
        return null;
    }
};

const generatePptxBlob = async (data: { fileName: string; slides: { title: string; content: string }[] }): Promise<{ blob: Blob; fileName: string; base64Content: string; mimeType: string; } | null> => {
    try {
        const PptxGenJSModule = await import('pptxgenjs');
        const PptxGenJS = PptxGenJSModule.default;
        const pptx = new PptxGenJS();

        data.slides.forEach(slideData => {
            const slide = pptx.addSlide();
            slide.addText(slideData.title, { x: 0.5, y: 0.25, fontSize: 24, bold: true, color: "363636" });
            
            const contentPoints = slideData.content.split('\n').filter(p => p.trim() !== '');
            slide.addText(contentPoints, { x: 0.5, y: 1.5, fontSize: 18, color: "363636", bullet: true });
        });

        const blob = await pptx.write('blob');
        const base64Content = await blobToBase64(blob);
        const mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        const finalFileName = fixExtension(data.fileName || 'presentation.pptx', '.pptx');
        return { blob, fileName: finalFileName, base64Content, mimeType };
    } catch (error) {
        console.error('Error: The presentation generation library (PptxGenJS) failed to load or process.', error);
        return null;
    }
};


const generateXlsxBlob = async (data: { fileName: string; sheets: { name: string; data: (string | number)[][] }[] }): Promise<{ blob: Blob; fileName: string; base64Content: string; mimeType: string; } | null> => {
    try {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        data.sheets.forEach(sheetData => {
            const ws = XLSX.utils.aoa_to_sheet(sheetData.data);
            XLSX.utils.book_append_sheet(wb, ws, sheetData.name);
        });
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], {type: "application/octet-stream"});
        const base64Content = await blobToBase64(blob);
        const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const finalFileName = fixExtension(data.fileName || 'spreadsheet.xlsx', '.xlsx');
        return { blob, fileName: finalFileName, base64Content, mimeType };
    } catch (error) {
        console.error('Error: The spreadsheet generation library (SheetJS) failed to load or process.', error);
        return null;
    }
};
