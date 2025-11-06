import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';

const ERP_EXPORT_URL = 'https://kzwomnuqmmdvmcnzysnm.supabase.co/storage/v1/object/public/Freddy%20bucket/erp_export_sanitaerpreise_5000_suppliers_fredy.xlsx';

type AssistIntent = {
  intent: string; // e.g. "price_inquiry" | "list_category" | "unknown"
  categories: string[]; // e.g. ["Badheizkörper", "Waschbecken"]
  productName?: string; // optional specific article name
  quantity?: number; // optional numeric quantity
};

function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function isSellingHeader(h: string) {
  const n = normalizeHeader(h);
  const positiveHints = ['vk', 'verkauf', 'verkaufspreis', 'listenpreis', 'brutto', 'vkp', 'verkaufpreis', 'preis'];
  const negativeHints = ['ek', 'einkauf', 'nettoek', 'nettoeinkauf'];
  if (negativeHints.some(s => n.includes(s))) return false;
  return positiveHints.some(s => n.includes(s));
}

function maxSellingPriceFromRow(row: Record<string, any>): number {
  let max = 0;
  for (const [key, value] of Object.entries(row)) {
    if (!isSellingHeader(key)) continue;
    const v = parseNumber(value);
    if (v > max) max = v;
  }
  return max;
}

async function loadERP() {
  const res = await fetch(ERP_EXPORT_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('ERP file download failed');
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
  const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  const normalized = rows.map((row, idx) => {
    const keys: Record<string, any> = {};
    for (const k of Object.keys(row)) keys[normalizeHeader(k)] = row[k];
    const name = keys['name'] || keys['produkt'] || keys['produktname'] || keys['artikel'] || keys['bezeichnung'] || `Produkt ${idx + 1}`;
    const category = keys['category'] || keys['kategorie'] || keys['warengruppe'] || 'Sonstiges';
    const unit = keys['unit'] || keys['einheit'] || 'Stück';
    const description = keys['description'] || keys['beschreibung'] || '';
    const highestSelling = maxSellingPriceFromRow(row);
    const basePriceCandidate = parseNumber(keys['price'] ?? keys['preis'] ?? keys['nettopreis'] ?? keys['vk'] ?? keys['vkpreis'] ?? 0);
    const basePrice = highestSelling > 0 ? highestSelling : basePriceCandidate;
    return {
      id: String(keys['id'] || keys['artikelnummer'] || keys['sku'] || `${idx + 1}`),
      name: String(name),
      category: String(category),
      basePrice: basePrice || 0,
      unit: String(unit),
      description: String(description),
      _raw: row,
    };
  }).filter(p => p.name);
  return { products: normalized, matrix };
}

async function loadAllSheets() {
  const res = await fetch(ERP_EXPORT_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('ERP file download failed');
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const results: { matrix: any[][]; objRows: Record<string, any>[] }[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    const objRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
    results.push({ matrix, objRows });
  }
  return results;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!openai.apiKey) {
      return NextResponse.json({ error: 'Server missing OPENAI_API_KEY' }, { status: 500 });
    }

    const schema = {
      name: 'AssistIntent',
      schema: {
        type: 'object',
        properties: {
          intent: { type: 'string' },
          categories: { type: 'array', items: { type: 'string' } },
          productName: { type: 'string' },
          quantity: { type: 'number' },
        },
        required: ['intent', 'categories', 'productName', 'quantity'],
        additionalProperties: false,
      },
      strict: true,
    } as const;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_schema', json_schema: schema },
      messages: [
        {
          role: 'system',
          content: 'You are a pricing assistant for a sanitary wholesale. Extract user intent, relevant categories (German terms like Badheizkörper, Waschbecken, Armaturen, etc.), possible specific product name, and quantity (if stated). Return only JSON.',
        },
        { role: 'user', content: message },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    const parsed: AssistIntent = JSON.parse(raw);

    const { products: erp, matrix } = await loadERP();

    const lcCategories = parsed.categories.map(c => c.toLowerCase());

    // Generic matching for ANY product based on productName/categories/message terms
    const sheets = await loadAllSheets();
    const terms: string[] = Array.from(new Set([
      parsed.productName?.toLowerCase().trim(),
      ...lcCategories,
    ].filter(Boolean) as string[]));

    if (terms.length === 0) {
      const tokens = message.toLowerCase().split(/[^a-zA-ZäöüÄÖÜß0-9]+/g).filter(t => t && t.length >= 4);
      terms.push(...Array.from(new Set(tokens)));
    }

    const sheetMatches: { sheetIdx: number; rowIdx: number; label: string }[] = [];
    for (let sheetIdx = 0; sheetIdx < sheets.length; sheetIdx++) {
      const mx = sheets[sheetIdx].matrix;
      for (let i = 1; i < mx.length; i++) {
        const row = mx[i] || [];
        const colE = String(row[4] ?? '').toLowerCase();
        if (terms.some(t => colE.includes(t))) {
          sheetMatches.push({ sheetIdx, rowIdx: i, label: String(row[4] ?? '') });
          continue;
        }
        const rowText = row.map(c => String(c ?? '').toLowerCase()).join(' | ');
        if (terms.some(t => rowText.includes(t))) {
          const label = String(row[4] ?? row.find((c:any)=>String(c).trim()) ?? '');
          sheetMatches.push({ sheetIdx, rowIdx: i, label });
        }
      }
    }

    if (sheetMatches.length) {
      const prices: number[] = [];
      for (const m of sheetMatches) {
        const objs = sheets[m.sheetIdx].objRows;
        const label = String(m.label || '').trim();
        const obj = objs.find(r => Object.values(r).some(v => String(v ?? '').trim() === label)) || objs[m.rowIdx - 1];
        if (!obj) continue;
        const price = maxSellingPriceFromRow(obj);
        if (price > 0) prices.push(price);
      }

      if (prices.length) {
        const avg = Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2));
        const preview = sheetMatches.slice(0, 10).map(m => `• ${String(m.label)}`).join('\n');
        const reply = `Gefundene Produkte (${sheetMatches.length}) passend zu: ${terms.join(', ')}\n\n${preview}\n\nOptimaler Preis (Durchschnitt): €${avg}`;
        return NextResponse.json({ reply, intent: parsed, count: sheetMatches.length, average: avg });
      }
    }
    let matches = erp.filter(p =>
      lcCategories.some(c => p.category.toLowerCase().includes(c) || p.name.toLowerCase().includes(c))
    );
    if (parsed.productName) {
      const pn = parsed.productName.toLowerCase();
      const specific = erp.find(p => p.name.toLowerCase().includes(pn));
      if (specific) matches = [specific];
    }

    // If intent is list_category → show top N; if price_inquiry and specific → price.
    let reply: string;
    if (!matches.length) {
      reply = 'Ich konnte keine passenden Produkte finden. Bitte spezifizieren Sie die Kategorie oder den Produktnamen.';
    } else if (matches.length > 1 && !parsed.productName) {
      const list = matches.slice(0, 15).map(p => `• ${p.name} (Kategorie: ${p.category})`).join('\n');
      reply = `Ich habe folgende Produkte gefunden. Welches Produkt möchten Sie genau?\n\n${list}`;
    } else {
      const p = matches[0];
      const qty = parsed.quantity && parsed.quantity > 0 ? parsed.quantity : undefined;
      const unitPrice = Number((p.basePrice || 0).toFixed(2));
      const total = qty ? Number((unitPrice * qty).toFixed(2)) : undefined;
      reply = `**${p.name}**\nKategorie: ${p.category}\nPreis (höchster Verkaufspreis): €${unitPrice} pro ${p.unit}` +
        (qty ? `\nMenge: ${qty} → Gesamt: €${total}` : '');
    }

    return NextResponse.json({ reply, intent: parsed, count: matches.length });
  } catch (e: any) {
    console.error('Assist error:', e?.message || e);
    return NextResponse.json({ error: 'Assist failure', detail: String(e?.message || e) }, { status: 500 });
  }
}

export async function GET() {
  const key = process.env.OPENAI_API_KEY || '';
  return NextResponse.json({ hasKey: Boolean(key), keyLength: key.length });
}


