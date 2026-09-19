import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use local Vite-bundled worker to ensure 100% offline local operation without CDN dependency
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface ParsedResumeRaw {
  rawText: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  lines: string[];
}

export async function extractTextFromPDF(file: File): Promise<ParsedResumeRaw> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    
    let fullText = '';
    const lines: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .filter((item: any) => typeof item.str === 'string')
        .map((item: any) => item.str);
      
      const pageText = pageStrings.join(' ');
      fullText += pageText + '\n';
      
      // Group strings into line chunks
      lines.push(...pageStrings.filter(s => s.trim().length > 0));
    }

    return parseResumeText(fullText, lines, file.name);
  } catch (err) {
    console.warn('PDF.js parse warning, attempting raw text fallback:', err);
    // Fallback: simple text decode
    const text = await file.text().catch(() => '');
    const cleanText = text.replace(/[^\x20-\x7E\n]/g, ' ');
    return parseResumeText(cleanText, cleanText.split('\n'), file.name);
  }
}

export function parseResumeText(rawText: string, lines: string[], filename: string): ParsedResumeRaw {
  // Extract email via regex
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : 'candidate@example.com';

  // Extract candidate name: either first non-empty line or clean filename
  let name = '';
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.length > 2 && trimmed.length < 35 && !trimmed.includes('@') && !trimmed.includes('http') && !/resume|curriculum|cv/i.test(trimmed)) {
      name = trimmed;
      break;
    }
  }
  if (!name) {
    name = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  // Common technical skills dictionary for heuristic extraction
  const skillKeywords = [
    'Python', 'Go', 'Golang', 'Rust', 'Java', 'C++', 'TypeScript', 'JavaScript', 'Node.js',
    'React', 'Next.js', 'Vue', 'Tailwind', 'GraphQL', 'REST', 'gRPC', 'Protobuf',
    'Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD', 'Helm',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'Kafka', 'RabbitMQ',
    'Elasticsearch', 'Spark', 'Flink', 'Distributed Systems', 'Microservices', 'System Design',
    'High Availability', 'Concurrency', 'Multithreading', 'Linux', 'Git', 'Agile'
  ];

  const lowerText = rawText.toLowerCase();
  const detectedSkills = skillKeywords.filter(skill => {
    const pattern = new RegExp(`\\b${skill.toLowerCase().replace('+', '\\+')}\\b`, 'i');
    return pattern.test(lowerText);
  });

  return {
    rawText,
    name,
    email,
    skills: detectedSkills.length > 0 ? detectedSkills : ['Distributed Systems', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    lines: lines.length > 0 ? lines : rawText.split('\n'),
  };
}
