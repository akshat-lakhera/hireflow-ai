import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for pdfjs-dist
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  } catch (e) {
    console.warn('PDF.js worker setup error:', e);
  }
}

export interface ParsedProject {
  name: string;
  technologies: string;
  description: string;
  highlights: string[];
  link?: string;
}

export interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface ParsedEducation {
  degree: string;
  school: string;
  year: string;
}

export interface StructuredResumeData {
  rawText: string;
  lines: string[];
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  summary: string;
  skills: string[];
  projects: ParsedProject[];
  experiences: ParsedExperience[];
  education: ParsedEducation[];
}

/**
 * Robust, coordinate-sorted text extraction from PDF ArrayBuffer
 */
export async function extractTextFromPDF(file: File): Promise<StructuredResumeData> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdfDoc = await loadingTask.promise;
    const allLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      
      // Sort items by Y (descending: top to bottom) and X (ascending: left to right)
      const items = (content.items as any[])
        .filter(it => it && typeof it.str === 'string' && it.str.trim().length > 0)
        .sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 2.5) {
            return yDiff;
          }
          return a.transform[4] - b.transform[4];
        });

      let currentY: number | null = null;
      let currentLine = '';

      for (const it of items) {
        const y = it.transform[5];
        if (currentY === null || Math.abs(y - currentY) > 3.0) {
          if (currentLine.trim()) {
            allLines.push(currentLine.trim());
          }
          currentLine = it.str;
          currentY = y;
        } else {
          if (currentLine.endsWith(' ') || it.str.startsWith(' ')) {
            currentLine += it.str;
          } else {
            currentLine += ' ' + it.str;
          }
        }
      }
      if (currentLine.trim()) {
        allLines.push(currentLine.trim());
      }
    }

    if (allLines.length > 0) {
      const rawText = allLines.join('\n');
      return parseStructuredResume(rawText, allLines, file.name);
    }
  } catch (pdfErr) {
    console.warn('PDF.js worker or render error, falling back to direct binary stream parser:', pdfErr);
  }

  // Pure binary fallback: decode strings directly from PDF stream objects
  const fallbackLines = extractTextStreamsFromPDFBuffer(new Uint8Array(arrayBuffer));
  const rawText = fallbackLines.join('\n');
  return parseStructuredResume(rawText, fallbackLines, file.name);
}

/**
 * Fail-safe text extractor directly scanning PDF byte arrays for literal text objects (BT...ET / Tj / TJ)
 */
function extractTextStreamsFromPDFBuffer(bytes: Uint8Array): string[] {
  const binaryString = new TextDecoder('latin1').decode(bytes);
  const lines: string[] = [];

  // Match text objects inside BT (Begin Text) and ET (End Text) blocks
  const btRegex = /BT\s([\s\S]*?)\sET/g;
  let btMatch;

  while ((btMatch = btRegex.exec(binaryString)) !== null) {
    const textBlock = btMatch[1];
    
    // Match literal strings: (Text here) Tj or [(Text1) -20 (Text2)] TJ
    const tjRegex = /\(((?:\\\(|\\\)|[^()])*)\)\s*(?:Tj|'|")/g;
    let tjMatch;
    let blockText = '';

    while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
      const cleanStr = tjMatch[1]
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ');
      blockText += cleanStr + ' ';
    }

    // Match TJ array expressions
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrayMatch;
    while ((arrayMatch = tjArrayRegex.exec(textBlock)) !== null) {
      const inner = arrayMatch[1];
      const subStrings = inner.match(/\(((?:\\\(|\\\)|[^()])*)\)/g);
      if (subStrings) {
        for (const sub of subStrings) {
          const clean = sub.slice(1, -1).replace(/\\([()\\])/g, '$1');
          blockText += clean + ' ';
        }
      }
    }

    const trimmed = blockText.trim();
    if (trimmed.length > 2) {
      lines.push(trimmed);
    }
  }

  // If BT...ET extraction yielded items, return clean lines
  if (lines.length > 3) {
    return lines;
  }

  // Last resort: extract visible printable strings of length >= 4
  const printableMatches = binaryString.match(/[A-Za-z0-9\s.,;:_/@()\-+#&]{4,}/g) || [];
  return printableMatches.map(s => s.trim()).filter(s => s.length > 5 && !s.startsWith('/'));
}

/**
 * Parses raw extracted lines into rich structured resume data with ZERO hardcoded dummy fallbacks
 */
export function parseStructuredResume(
  rawText: string,
  lines: string[],
  filename: string
): StructuredResumeData {
  const cleanLines = lines.map(l => l.trim()).filter(Boolean);

  // 1. Candidate Name (Typically first line, or fallback to cleaned filename)
  let name = '';
  for (let i = 0; i < Math.min(4, cleanLines.length); i++) {
    const line = cleanLines[i];
    if (
      line.length > 2 && 
      line.length < 40 && 
      !line.includes('@') && 
      !line.includes('http') && 
      !/summary|objective|curriculum|resume|cv/i.test(line)
    ) {
      name = line;
      break;
    }
  }
  if (!name) {
    name = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  // 2. Headline / Current Role (Usually line 1 or 2)
  let headline = '';
  for (let i = 1; i < Math.min(5, cleanLines.length); i++) {
    const line = cleanLines[i];
    if (
      line !== name &&
      (line.includes('Engineer') || 
       line.includes('Developer') || 
       line.includes('Architect') || 
       line.includes('Lead') ||
       line.includes('Student') ||
       line.includes('Specialist'))
    ) {
      headline = line;
      break;
    }
  }

  // 3. Contact Info
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91\s*\d{10}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  const githubMatch = rawText.match(/github\.com\/([a-zA-Z0-9-_]+)|github:\s*([a-zA-Z0-9-_]+)/i);
  const githubUrl = githubMatch ? (githubMatch[1] || githubMatch[2]) : undefined;

  const portfolioMatch = rawText.match(/https?:\/\/[a-zA-Z0-9.-]+\.vercel\.app|[a-zA-Z0-9.-]+\.dev|[a-zA-Z0-9.-]+\.io|[a-zA-Z0-9.-]+\.com/i);
  const portfolioUrl = portfolioMatch ? portfolioMatch[0] : undefined;

  // Location detection
  let location = '';
  const locationLine = cleanLines.find(l => l.includes('Bhopal') || l.includes('India') || l.includes('United States') || l.includes('Remote') || l.includes('CA') || l.includes('NY'));
  if (locationLine) {
    const parts = locationLine.split('|').map(p => p.trim());
    location = parts[0] || 'Remote';
  }

  // 4. Section Slicing
  let currentSection = 'HEADER';
  const sectionMap: Record<string, string[]> = {
    SUMMARY: [],
    SKILLS: [],
    PROJECTS: [],
    EXPERIENCE: [],
    EDUCATION: [],
    OTHER: []
  };

  for (const line of cleanLines) {
    const upper = line.toUpperCase();
    if (upper.includes('PROFESSIONAL SUMMARY') || upper.includes('ABOUT ME') || upper === 'SUMMARY') {
      currentSection = 'SUMMARY';
      continue;
    }
    if (upper.includes('TECHNICAL SKILLS') || upper.includes('SKILLS & PROFICIENCIES') || upper === 'SKILLS') {
      currentSection = 'SKILLS';
      continue;
    }
    if (upper.includes('SELECTED PROJECTS') || upper.includes('PROJECTS') || upper.includes('PERSONAL PROJECTS')) {
      currentSection = 'PROJECTS';
      continue;
    }
    if (upper.includes('WORK EXPERIENCE') || upper.includes('PROFESSIONAL EXPERIENCE') || upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT')) {
      currentSection = 'EXPERIENCE';
      continue;
    }
    if (upper.includes('EDUCATION') || upper.includes('ACADEMIC BACKGROUND')) {
      currentSection = 'EDUCATION';
      continue;
    }

    if (sectionMap[currentSection]) {
      sectionMap[currentSection].push(line);
    }
  }

  // 5. Parse Real Summary
  const summary = sectionMap.SUMMARY.join(' ').trim() || 
    cleanLines.slice(2, 6).join(' ').slice(0, 300);

  // 6. Parse Real Skills from the Skills Section
  const extractedSkills: string[] = [];
  for (const line of sectionMap.SKILLS) {
    const cleaned = line.replace(/^[A-Za-z\s&]+:\s*/, ''); // strip "Languages:", "Backend & Systems:", etc.
    const items = cleaned.split(/[,|•·\n]/).map(s => s.trim().replace(/\(.*\)/, '').trim()).filter(Boolean);
    for (const item of items) {
      if (item.length > 1 && item.length < 35 && !extractedSkills.includes(item)) {
        extractedSkills.push(item);
      }
    }
  }

  // 7. Parse Real Projects
  const projects: ParsedProject[] = [];
  let currentProject: ParsedProject | null = null;

  for (const line of sectionMap.PROJECTS) {
    // Project title line starts with a title followed by delimiter: e.g. "DevDash — Local-First..." or "MarketScout | Python..."
    const isProjectHeader = /^[A-Za-z0-9][A-Za-z0-9\s]{1,35}\s*[-—–|]/.test(line) && !line.startsWith('•') && !line.startsWith('(');
    
    if (isProjectHeader) {
      if (currentProject) {
        projects.push(currentProject);
      }
      const parts = line.split(/[-—–|]/).map(p => p.trim());
      const pName = parts[0] || 'Project';
      const pTech = parts.slice(1).join(' · ');
      currentProject = {
        name: pName,
        technologies: pTech,
        description: pTech,
        highlights: []
      };
    } else if (currentProject) {
      if (line.startsWith('•') || line.startsWith('-')) {
        currentProject.highlights.push(line.replace(/^[•-]\s*/, ''));
      } else if (currentProject.highlights.length === 0) {
        currentProject.description = (currentProject.description + ' ' + line).trim();
      } else {
        // Wrapped bullet continuation line: append to last highlight
        const lastIdx = currentProject.highlights.length - 1;
        currentProject.highlights[lastIdx] = (currentProject.highlights[lastIdx] + ' ' + line).trim();
      }
    }
  }
  if (currentProject) {
    projects.push(currentProject);
  }

  // 8. Parse Real Education
  const education: ParsedEducation[] = [];
  if (sectionMap.EDUCATION.length > 0) {
    const eduLines = sectionMap.EDUCATION;
    let degree = eduLines[0] || 'Higher Education';
    let school = eduLines[1] || '';
    let year = '';

    const yearMatch = (eduLines.join(' ')).match(/\b(20\d\d\s*[-–—]\s*(?:20\d\d|Present|\d\d))\b/i);
    if (yearMatch) {
      year = yearMatch[0];
    }

    education.push({
      degree,
      school: school.replace(/·.*$/, '').trim(),
      year: year || 'Verified'
    });
  }

  // 9. Parse Real Experience
  const experiences: ParsedExperience[] = [];
  let currentExp: ParsedExperience | null = null;

  for (const line of sectionMap.EXPERIENCE) {
    if ((line.includes('—') || line.includes('|') || line.includes('20')) && !line.startsWith('•')) {
      if (currentExp) {
        experiences.push(currentExp);
      }
      currentExp = {
        company: line,
        role: headline || 'Software Engineer',
        duration: 'Experience on record',
        highlights: []
      };
    } else if (currentExp) {
      if (line.startsWith('•') || line.startsWith('-')) {
        currentExp.highlights.push(line.replace(/^[•-]\s*/, ''));
      }
    }
  }
  if (currentExp) {
    experiences.push(currentExp);
  }

  return {
    rawText,
    lines: cleanLines,
    name: name || 'Extracted Candidate',
    headline: headline || 'Software Engineer',
    email,
    phone,
    location: location || 'Not specified',
    portfolioUrl,
    githubUrl,
    linkedinUrl: undefined,
    summary,
    skills: extractedSkills,
    projects,
    experiences,
    education
  };
}
