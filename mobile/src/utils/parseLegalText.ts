export interface LegalNode {
  type: 'section' | 'clause' | 'text' | 'explanation';
  label: string;
  content: string;
  meta?: {
    omitted?: boolean;
    references?: {
      type: 'sub-section' | 'section';
      target: string;
    }[];
  };
  children: LegalNode[];
}

// 🔍 Extract inline references like "sub-section (3)"
function extractReferences(text: string) {
  const refs: { type: 'sub-section' | 'section'; target: string }[] = [];

  const subSectionRegex = /sub-section\s*\((\d+[A-Z]?)\)/gi;
  const sectionRegex = /section\s+(\d+[A-Z]?)/gi;

  let match;

  while ((match = subSectionRegex.exec(text)) !== null) {
    refs.push({ type: 'sub-section', target: match[1] });
  }

  while ((match = sectionRegex.exec(text)) !== null) {
    refs.push({ type: 'section', target: match[1] });
  }

  return refs;
}

export function parseLegalText(raw: string): LegalNode[] {
  if (!raw) return [];

  let cleaned = raw
    .replace(/\d+\[/g, '')
    .replace(/\]/g, '')    
    .replace(/(\([a-z]\))/g, '\n$1') 
    .replace(/(\([ivx]+\))/gi, '\n$1')  
    .replace(/(Explanation)/gi, '\n$1')
    .trim();

  const lines = cleaned.split(/\n+/);

  const root: LegalNode[] = [];

  let currentSection: LegalNode | null = null;
  let currentAlpha: LegalNode | null = null;
  let currentRoman: LegalNode | null = null;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    const isPureOmitted = /^(\d*\s*[\*\s]{3,})$/.test(line);

    const sectionMatch = line.match(/^\((\d+[A-Z]?)\)\s+(.*)/); // strict: needs space
    const alphaMatch = line.match(/^\(([a-z])\)\s+(.*)/i);
    const romanMatch = line.match(/^\(([ivx]+)\)\s+(.*)/i);
    const isExplanation = /^Explanation/i.test(line);

    // 🟥 Omitted block
    if (isPureOmitted) {
      const node: LegalNode = {
        type: 'clause',
        label: '',
        content: '',
        meta: { omitted: true },
        children: [],
      };

      if (currentSection) currentSection.children.push(node);
      else root.push(node);

      return;
    }

    // 🟦 SECTION
    if (sectionMatch) {
      const label = sectionMatch[1];
      const content = sectionMatch[2].trim();

      const isOmitted =
        content.startsWith('***') || content.startsWith('* * *');

      const refs = extractReferences(content);

      currentSection = {
        type: 'section',
        label,
        content: isOmitted ? '' : content,
        meta: {
          ...(isOmitted ? { omitted: true } : {}),
          ...(refs.length ? { references: refs } : {}),
        },
        children: [],
      };

      currentAlpha = null;
      currentRoman = null;

      root.push(currentSection);
      return;
    }

    // 🟨 ROMAN
    if (romanMatch) {
      const label = romanMatch[1];
      const content = romanMatch[2].trim();

      const isOmitted =
        content.startsWith('***') || content.startsWith('* * *');

      const refs = extractReferences(content);

      const node: LegalNode = {
        type: 'clause',
        label,
        content: isOmitted ? '' : content,
        meta: {
          ...(isOmitted ? { omitted: true } : {}),
          ...(refs.length ? { references: refs } : {}),
        },
        children: [],
      };

      currentRoman = node;

      if (currentAlpha) currentAlpha.children.push(node);
      else if (currentSection) currentSection.children.push(node);
      else root.push(node);

      return;
    }

    // 🟩 ALPHA
    if (alphaMatch) {
      const label = alphaMatch[1];
      const content = alphaMatch[2].trim();

      const isOmitted =
        content.startsWith('***') || content.startsWith('* * *');

      const refs = extractReferences(content);

      const node: LegalNode = {
        type: 'clause',
        label,
        content: isOmitted ? '' : content,
        meta: {
          ...(isOmitted ? { omitted: true } : {}),
          ...(refs.length ? { references: refs } : {}),
        },
        children: [],
      };

      currentAlpha = node;
      currentRoman = null;

      if (currentSection) currentSection.children.push(node);
      else root.push(node);

      return;
    }

    // 🟪 EXPLANATION
    if (isExplanation) {
      const refs = extractReferences(line);

      const node: LegalNode = {
        type: 'explanation',
        label: '',
        content: line,
        meta: refs.length ? { references: refs } : undefined,
        children: [],
      };

      if (currentAlpha) currentAlpha.children.push(node);
      else if (currentSection) currentSection.children.push(node);
      else root.push(node);

      return;
    }

    // 🧾 NORMAL TEXT
    const target = currentRoman || currentAlpha || currentSection;

    if (target) {
      target.content += ' ' + line;

      const refs = extractReferences(line);
      if (refs.length) {
        if (!target.meta) target.meta = {};
        if (!target.meta.references) target.meta.references = [];
        target.meta.references.push(...refs);
      }
    } else {
      root.push({
        type: 'text',
        label: '',
        content: line,
        children: [],
      });
    }
  });

  return root;
}