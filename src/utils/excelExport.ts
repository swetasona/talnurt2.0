import * as XLSX from 'xlsx';
import { Candidate } from '@/types';

export interface ExportFilters {
  skills: string[];
  industries: string[];
  minExperience: number | undefined;
  educationLevels: string[];
}

export const exportCandidatesToExcel = (candidates: Candidate[]) => {
  // Transform candidates to worksheet data
  const worksheetData = candidates.map(candidate => {
    // Get primary experience and education (if available)
    const primaryExperience = candidate.experience[0] || {};
    const primaryEducation = candidate.education[0] || {};
    
    return {
      'Name': candidate.name,
      'Email': candidate.email,
      'Phone': candidate.phone || '',
      'Skills': candidate.skills.join(', '),
      'Current/Latest Position': primaryExperience.title || '',
      'Current/Latest Company': primaryExperience.company || '',
      'Experience Start Date': primaryExperience.startDate || '',
      'Experience End Date': primaryExperience.endDate || '',
      'Experience Description': primaryExperience.description || '',
      'Institution': primaryEducation.institution || '',
      'Degree': primaryEducation.degree || '',
      'Field of Study': primaryEducation.field || '',
      'Education Start Date': primaryEducation.startDate || '',
      'Education End Date': primaryEducation.endDate || '',
    };
  });
  
  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
  
  // Auto-adjust column widths
  const columnWidths = calculateColumnWidths(worksheetData);
  worksheet['!cols'] = columnWidths;
  
  // Generate filename with current date
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = `candidates_export_${dateStr}.xlsx`;
  
  // Export to file
  XLSX.writeFile(workbook, filename);
  
  return {
    totalExported: candidates.length,
    filename
  };
};

// Helper function to calculate optimal column widths
const calculateColumnWidths = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  const columnWidths: { wch: number }[] = [];
  const sample = data[0];
  
  Object.keys(sample).forEach((key, i) => {
    // Start with the header width
    let maxWidth = key.length;
    
    // Check first 100 rows (for performance)
    const rowsToCheck = Math.min(data.length, 100);
    for (let j = 0; j < rowsToCheck; j++) {
      const value = data[j][key];
      if (value) {
        const valueLength = String(value).length;
        maxWidth = Math.max(maxWidth, valueLength);
      }
    }
    
    // Cap width at 50 characters
    maxWidth = Math.min(maxWidth, 50);
    
    // Set column width (with a bit of padding)
    columnWidths[i] = { wch: maxWidth + 2 };
  });
  
  return columnWidths;
}; 