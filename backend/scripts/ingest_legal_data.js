const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { MeiliSearch } = require('meilisearch');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const MEILI_URL = process.env.MEILI_URL;
const MEILI_API_KEY = process.env.MEILI_API_KEY;

if (!connectionString) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

const client = new Client({ connectionString });
const meili = MEILI_URL ? new MeiliSearch({ host: MEILI_URL, apiKey: MEILI_API_KEY || undefined }) : null;

const DATA_ROOT = path.join(__dirname, '../../Data');

const ACTS = [
  {
    title: 'Constitution of India',
    slug: 'constitution-of-india',
    description: 'The supreme law of India, establishing the framework of the Government and fundamental rights.',
    category: 'Constitutional',
    year: 1949,
    file: 'Constitution/constitution_of_india.json',
    parser: parseConstitution,
  },
  {
    title: 'Indian Penal Code',
    slug: 'indian-penal-code',
    description: 'The primary criminal code of India, covering substantive aspects of criminal law.',
    category: 'Criminal',
    year: 1860,
    file: 'Indian-Law-Penal-Code/ipc.json',
    parser: parseIPC,
  },
  {
    title: 'Code of Criminal Procedure',
    slug: 'code-of-criminal-procedure',
    category: 'Criminal',
    year: 1973,
    file: 'Indian-Law-Penal-Code/crpc.json',
    parser: parseStandard,
  },
  {
    title: 'Code of Civil Procedure',
    slug: 'code-of-civil-procedure',
    category: 'Civil',
    year: 1908,
    file: 'Indian-Law-Penal-Code/cpc.json',
    parser: parseStandard,
  },
  {
    title: 'Indian Evidence Act',
    slug: 'indian-evidence-act',
    category: 'Evidence',
    year: 1872,
    file: 'Indian-Law-Penal-Code/iea.json',
    parser: parseStandard,
  },
  {
    title: 'Hindu Marriage Act',
    slug: 'hindu-marriage-act',
    category: 'Family',
    year: 1955,
    file: 'Indian-Law-Penal-Code/hma.json',
    parser: parseHMA,
  },
  {
    title: 'Indian Divorce Act',
    slug: 'indian-divorce-act',
    category: 'Family',
    year: 1869,
    file: 'Indian-Law-Penal-Code/ida.json',
    parser: parseStandard,
  },
  {
    title: 'Motor Vehicles Act',
    slug: 'motor-vehicles-act',
    category: 'Transport',
    year: 1988,
    file: 'Indian-Law-Penal-Code/MVA.json',
    parser: parseStandard,
  },
  {
    title: 'Negotiable Instruments Act',
    slug: 'negotiable-instruments-act',
    category: 'Commercial',
    year: 1881,
    file: 'Indian-Law-Penal-Code/nia.json',
    parser: parseStandard,
  },
];

async function ingestAct(actData, sections) {
  console.log(`\n🚀 Ingesting Act: ${actData.title}...`);

  try {
    const actRes = await client.query(
      `INSERT INTO legal_acts (title, slug, description, category, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         year = EXCLUDED.year
       RETURNING id`,
      [actData.title, actData.slug, actData.description, actData.category, actData.year]
    );

    const actId = actRes.rows[0].id;
    console.log(`✅ Act ID: ${actId}. Inserting ${sections.length} sections...`);

    await client.query('DELETE FROM legal_sections WHERE act_id = $1', [actId]);

    const batchSize = 100;
    for (let i = 0; i < sections.length; i += batchSize) {
      const batch = sections.slice(i, i + batchSize);
      const values = [];
      const placeholders = batch.map((_, idx) => {
        const offset = idx * 5;
        values.push(
          actId,
          batch[idx].section_number,
          batch[idx].title,
          batch[idx].content,
          batch[idx].plain_summary || null
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
      }).join(',');

      const query = `
        INSERT INTO legal_sections (act_id, section_number, title, content, plain_summary)
        VALUES ${placeholders}
      `;

      await client.query(query, values);
      process.stdout.write('.');
    }

    if (meili) {
      await indexAct(actId, actData);
    }

    console.log(`\n✨ Finished ${actData.title}`);
  } catch (err) {
    console.error(`❌ Error ingesting ${actData.title}:`, err.message);
  }
}

async function indexAct(actId, actData) {
  if (!meili) return;
  try {
    const index = meili.index('legal_acts');
    const doc = {
      id: actId,
      title: actData.title,
      slug: actData.slug,
      description: actData.description,
      category: actData.category,
      year: actData.year,
    };
    await index.addDocuments([doc]);
  } catch (err) {
    console.log(`   ⚠️  Meilisearch indexing skipped`);
  }
}

async function ensureMeiliIndexes() {
  if (!meili) {
    console.log('⚠️  Meilisearch not configured, skipping index creation');
    return;
  }

  try {
    await ensureIndex('legal_acts', 'id');
    await meili.index('legal_acts').updateFilterableAttributes(['category', 'year']);
    await meili.index('legal_acts').updateSearchableAttributes(['title', 'description', 'category', 'slug']);
  } catch (err) {
    console.error('⚠️  Meilisearch error (continuing without search):', err.message);
  }
}

async function ensureIndex(uid, primaryKey) {
  try {
    await meili.getIndex(uid);
  } catch (err) {
    if (meili) {
      await meili.createIndex(uid, { primaryKey });
    }
  }
}

function parseConstitution(raw) {
  return raw.map((item) => ({
    section_number: safeString(item.article),
    title: safeString(item.title),
    content: safeString(item.description),
  }));
}

function parseIPC(raw) {
  return raw.map((item) => ({
    section_number: safeString(item.Section),
    title: safeString(item.section_title),
    content: safeString(item.section_desc),
    chapter: item.chapter != null ? safeString(item.chapter) : null,
    chapter_title: item.chapter_title ? safeString(item.chapter_title) : null,
  }));
}

function parseStandard(raw) {
  return raw.map((item) => ({
    section_number: safeString(item.section || item.Section),
    title: safeString(item.title || item.section_title),
    content: safeString(item.description || item.section_desc),
    chapter: item.chapter != null ? safeString(item.chapter) : null,
    chapter_title: item.chapter_title ? safeString(item.chapter_title) : null,
  }));
}

function parseHMA(raw) {
  const sections = [];
  let lastSection = null;

  raw.forEach((row) => {
    const key = Object.keys(row)[0];
    const line = safeString(row[key]).trim();
    if (!line) return;

    const cols = parseCsvLine(line);
    if (cols.length >= 4 && cols[1]) {
      const section = {
        section_number: cols[1],
        title: cols[2] || '',
        content: cols.slice(3).join(',') || '',
        chapter: cols[0] || null,
      };
      sections.push(section);
      lastSection = section;
      return;
    }

    if (cols.length === 1 && lastSection) {
      lastSection.content = [lastSection.content, cols[0]].filter(Boolean).join('\n');
    }
  });

  return sections;
}

function toSection(item) {
  const sectionNumber = safeString(item.section_number).trim();
  const title = safeString(item.title).trim();
  const content = safeString(item.content).trim();

  if (!sectionNumber && !title && !content) return null;

  const finalTitle = title || (sectionNumber ? `Section ${sectionNumber}` : 'Untitled Section');
  const finalContent = content || title || sectionNumber;

  return {
    section_number: sectionNumber || finalTitle,
    title: finalTitle,
    content: finalContent,
    chapter: item.chapter ? safeString(item.chapter) : null,
    chapter_title: item.chapter_title ? safeString(item.chapter_title) : null,
    plain_summary: shortDescription(finalContent, 220),
  };
}

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeText(text) {
  return safeString(text).replace(/\s+/g, ' ').trim();
}

function shortDescription(text, maxLen) {
  const cleaned = normalizeText(text);
  if (!cleaned) return '';
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen).trim()}...`;
}

function buildActDescription(act, sections) {
  if (act.description) return act.description;
  const first = sections.find((s) => s.content && s.content.trim());
  if (!first) return '';
  return shortDescription(first.content, 180);
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

async function processAct(act) {
  const filePath = path.join(DATA_ROOT, act.file);
  if (!fs.existsSync(filePath)) return;

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const parsed = act.parser(raw).map(toSection).filter(Boolean);
  const actData = {
    title: act.title,
    slug: act.slug || slugify(act.title),
    description: buildActDescription(act, parsed),
    category: act.category,
    year: act.year,
  };

  await ingestAct(actData, parsed);
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL database');
  try {
    await ensureMeiliIndexes();
    for (const act of ACTS) {
      await processAct(act);
    }
    console.log('\n🌟 Ingestion complete!');
  } catch (err) {
    console.error('Ingestion failed:', err);
  } finally {
    await client.end();
  }
}

run();
