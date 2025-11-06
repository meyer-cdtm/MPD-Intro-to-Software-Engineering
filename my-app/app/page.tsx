'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  description: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Keramik-Waschbecken 60cm', category: 'Waschbecken', basePrice: 89.99, unit: 'Stück', description: 'Hochwertiges Keramik-Waschbecken' },
  { id: '2', name: 'Duscharmatur Thermostat', category: 'Armaturen', basePrice: 149.99, unit: 'Stück', description: 'Thermostat-Duscharmatur mit Sicherheitssperre' },
  { id: '3', name: 'Badewanne Acryl 170x75cm', category: 'Badewannen', basePrice: 299.99, unit: 'Stück', description: 'Freistehende Acryl-Badewanne' },
  { id: '4', name: 'WC-Sitz mit Absenkautomatik', category: 'WC-Zubehör', basePrice: 45.99, unit: 'Stück', description: 'Duroplast WC-Sitz mit Soft-Close' },
  { id: '5', name: 'Kupferrohr 15mm (pro Meter)', category: 'Rohre', basePrice: 8.99, unit: 'Meter', description: 'Kupferrohr für Trinkwasser' },
  { id: '6', name: 'Heizkörper Paneelheizkörper 600x1200mm', category: 'Heizung', basePrice: 189.99, unit: 'Stück', description: 'Paneelheizkörper Typ 22' },
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Willkommen beim Freddy B2B Preisassistent! Ich helfe Ihnen gerne bei Produktanfragen, Preiskalkulationen und Mengenrabatten für Ihren Sanitär-Großhandel. Wie kann ich Sie heute unterstützen?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  type CustomerSegment = 'Standard' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  const [customerSegment, setCustomerSegment] = useState<CustomerSegment>('Standard');
  const [products, setProducts] = useState<Product[]>([]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 20000);
  };

  const handleTodo1 = () => {
    showToast('TODO 1: Implement authentication system for B2B customers. Add login/signup functionality with company verification and role-based access control.');
  };

  const ERP_EXPORT_URL = 'https://kzwomnuqmmdvmcnzysnm.supabase.co/storage/v1/object/public/Freddy%20bucket/erp_export_sanitaerpreise_5000_suppliers_fredy.xlsx';

  const normalizeHeader = (header: string) =>
    header
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss');

  const parseNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const isSellingHeader = (h: string) => {
    const n = normalizeHeader(h);
    // prefer selling price columns; avoid purchase price (EK)
    const positiveHints = ['vk', 'verkauf', 'verkaufspreis', 'listenpreis', 'brutto', 'vkp', 'verkaufpreis', 'preis'];
    const negativeHints = ['ek', 'einkauf', 'nettoek', 'nettoeinkauf'];
    if (negativeHints.some(s => n.includes(s))) return false;
    return positiveHints.some(s => n.includes(s));
  };

  const maxSellingPriceFromRow = (row: Record<string, any>): number => {
    let max = 0;
    for (const [key, value] of Object.entries(row)) {
      if (!isSellingHeader(key)) continue;
      const v = parseNumber(value);
      if (v > max) max = v;
    }
    return max;
  };

  const fetchAndParseERP = async () => {
    try {
      const response = await fetch(ERP_EXPORT_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('ERP-Download fehlgeschlagen');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      const mapped: Product[] = rows.map((row, idx) => {
        const keys = Object.keys(row).reduce<Record<string, any>>((acc, k) => {
          acc[normalizeHeader(k)] = row[k];
          return acc;
        }, {});

        const name = keys['name'] || keys['produkt'] || keys['produktname'] || keys['artikel'] || keys['bezeichnung'] || `Produkt ${idx + 1}`;
        const category = keys['category'] || keys['kategorie'] || keys['warengruppe'] || 'Sonstiges';
        const unit = keys['unit'] || keys['einheit'] || 'Stück';
        const description = keys['description'] || keys['beschreibung'] || '';
        const basePriceCandidate = parseNumber(keys['price'] ?? keys['preis'] ?? keys['nettopreis'] ?? keys['vk'] ?? keys['vkpreis'] ?? 0);
        const highestSelling = maxSellingPriceFromRow(row);
        const basePrice = highestSelling > 0 ? highestSelling : basePriceCandidate;

        return {
          id: String(keys['id'] || keys['artikelnummer'] || keys['sku'] || `${firstSheetName}-${idx + 1}`),
          name: String(name),
          category: String(category),
          basePrice,
          unit: String(unit),
          description: String(description),
        } as Product;
      }).filter(p => p.name && p.basePrice >= 0);

      if (mapped.length > 0) {
        setProducts(mapped);
        showToast(`ERP-Daten geladen (${mapped.length} Produkte)`);
      } else {
        showToast('Keine Produkte im ERP-Export gefunden. Fallback-Daten werden verwendet.');
      }
    } catch (e) {
      showToast('Fehler beim Laden der ERP-Daten. Fallback-Daten werden verwendet.');
    }
  };

  const handleTodo2 = async () => {
    try {
      showToast('Lade ERP-Export herunter...');
      const response = await fetch(ERP_EXPORT_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('Download fehlgeschlagen');

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'erp_export_sanitaerpreise_5000_suppliers_fredy.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      showToast('Download gestartet: ERP-Export');
    } catch (error) {
      showToast('Fehler beim Herunterladen des ERP-Exports. Bitte später erneut versuchen.');
    }
  };

  const handleTodo3 = () => {
    fetchAndParseERP();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Preload ERP data once on mount
    fetchAndParseERP();
  }, []);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const session = data.session;
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const getSegmentedPrice = (basePrice: number, segment: CustomerSegment): number => {
    const discountBySegment: Record<CustomerSegment, number> = {
      Standard: 0,
      Bronze: 0.03,
      Silver: 0.07,
      Gold: 0.12,
      Platinum: 0.18,
    };
    const discount = discountBySegment[segment] ?? 0;
    const price = basePrice * (1 - discount);
    return Math.max(0, Number(price.toFixed(2)));
  };

  const getRecommendations = (category: string, source: Product[], take: number = 3): Product[] => {
    const inCategory = source.filter(p => p.category.toLowerCase() === category.toLowerCase());
    if (inCategory.length <= take) return inCategory;
    // simple heuristic: pick highest base prices to mimic premium picks
    return [...inCategory].sort((a, b) => b.basePrice - a.basePrice).slice(0, take);
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    const data = products.length ? products : SAMPLE_PRODUCTS;
    // Special flow: Badheizkörper → list all matches, then price highest selling when specific
    if (input.includes('badheizkörper') || input.includes('bad heizkörper') || input.includes('badheizkoerper')) {
      const matches = data.filter(p =>
        p.name.toLowerCase().includes('badheiz') ||
        p.category.toLowerCase().includes('heizkörper') ||
        p.category.toLowerCase().includes('heizung')
      );

      // If the user named a specific product, try to find exact-ish match and return highest price
      const exact = matches.find(p => input.includes(p.name.toLowerCase()));
      if (exact) {
        const price = getSegmentedPrice(exact.basePrice, customerSegment);
        return `Preis (höchster Verkaufspreis, ${customerSegment}): \n\n**${exact.name}** → €${price} pro ${exact.unit}`;
      }

      if (matches.length) {
        const list = matches.slice(0, 15).map(p => `• ${p.name}`).join('\n');
        return `Ich habe folgende Badheizkörper gefunden. Welches Produkt möchten Sie genau?\n\n${list}`;
      }

      return 'Ich habe derzeit keine Badheizkörper im ERP gefunden.';
    }


    // Product search
    if (input.includes('waschbecken') || input.includes('waschtisch')) {
      const product = data.find(p => p.category.toLowerCase().includes('waschbecken')) || data[0];
      if (!product) return 'Aktuell liegen keine passenden Waschbecken vor.';
      const price = getSegmentedPrice(product.basePrice, customerSegment);
      const recs = getRecommendations(product.category, data).filter(p => p.id !== product.id);
      const recText = recs.length ? `\n\nEmpfehlungen:\n` + recs.map(r => `• ${r.name} – €${getSegmentedPrice(r.basePrice, customerSegment)}`).join('\n') : '';
      return `Ich habe folgendes Waschbecken für Sie:\n\n**${product.name}**\nPreis (${customerSegment}): €${price} pro ${product.unit}${recText}`;
    }

    if (input.includes('armatur')) {
      const product = data.find(p => p.category.toLowerCase().includes('armatur')) || data[0];
      if (!product) return 'Aktuell liegen keine passenden Armaturen vor.';
      const price = getSegmentedPrice(product.basePrice, customerSegment);
      const recs = getRecommendations(product.category, data).filter(p => p.id !== product.id);
      const recText = recs.length ? `\n\nEmpfehlungen:\n` + recs.map(r => `• ${r.name} – €${getSegmentedPrice(r.basePrice, customerSegment)}`).join('\n') : '';
      return `Unsere Armatur-Empfehlung:\n\n**${product.name}**\nPreis (${customerSegment}): €${price}\n${product.description || ''}${recText}`;
    }

    if (input.includes('badewanne')) {
      const product = data.find(p => p.category.toLowerCase().includes('badewanne')) || data[0];
      if (!product) return 'Aktuell liegen keine passenden Badewannen vor.';
      const price = getSegmentedPrice(product.basePrice, customerSegment);
      return `**${product.name}**\nPreis (${customerSegment}): €${price} pro ${product.unit}`;
    }

    if (input.includes('rohr') || input.includes('kupfer')) {
      const product = data.find(p => p.category.toLowerCase().includes('rohr')) || data[0];
      if (!product) return 'Aktuell liegen keine passenden Rohre vor.';
      const price = getSegmentedPrice(product.basePrice, customerSegment);
      return `**${product.name}**\nPreis (${customerSegment}): €${price} pro ${product.unit}`;
    }

    // Pricing inquiries
    if (input.includes('preis') || input.includes('kostet') || input.includes('kosten')) {
      return 'Gerne erstelle ich Ihnen eine Preisübersicht! Welche Produkte interessieren Sie? Ich kann Ihnen Informationen zu folgenden Kategorien geben:\n\n• Waschbecken\n• Armaturen\n• Badewannen\n• WC-Zubehör\n• Rohre & Fittings\n• Heizkörper';
    }

    // Discount inquiries
    if (input.includes('rabatt') || input.includes('mengenrabatt')) {
      return 'Unsere Mengenrabatt-Staffelung:\n\n📦 **Standard-Konditionen:**\n• 10-49 Stück: 5% Rabatt\n• 50-99 Stück: 10% Rabatt\n• 100-499 Stück: 15% Rabatt\n• 500+ Stück: Individuelle Verhandlung\n\n💼 **Stammkunden:** Zusätzliche Sonderkonditionen möglich!\n\nWelche Menge planen Sie?';
    }

    // Catalog request
    if (input.includes('katalog') || input.includes('sortiment') || input.includes('produkte')) {
      return '📋 **Unser Sortiment:**\n\n' + data.slice(0, 20).map(p =>
        `• ${p.name} - €${getSegmentedPrice(p.basePrice, customerSegment)} (${p.category})`
      ).join('\n') + '\n\nFür detaillierte Informationen nennen Sie mir bitte das gewünschte Produkt!';
    }

    // Contact/support
    if (input.includes('kontakt') || input.includes('anruf') || input.includes('email')) {
      return '📞 **Kontaktieren Sie uns:**\n\nTelefon: +49 (0) 30 1234567\nEmail: vertrieb@sanitaerpro-b2b.de\nÖffnungszeiten: Mo-Fr 8:00-18:00 Uhr\n\nIch kann Ihnen aber auch direkt hier weiterhelfen!';
    }

    // Default response
    return 'Vielen Dank für Ihre Anfrage! Ich kann Ihnen helfen bei:\n\n• Produktinformationen & Verfügbarkeit\n• Preiskalkulationen & Mengenrabatten\n• Angeboterstellung\n• Lieferzeiten & Versandkosten\n\nWas möchten Sie gerne wissen?';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      const text = res.ok && data?.reply ? String(data.reply) : generateResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      const fallback = generateResponse(input);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
          <img src="/Logo.png" alt="Freddy B2B Logo" className="w-12 h-12 object-contain mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Habibi - don't go yet.</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Click here to log back in.</p>
          <Link href="/login" className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Logo.png"
                alt="Freddy B2B Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Freddy B2B
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sanitär-Großhandel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5">
                Dokumentation
              </button>
              <button className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5">
                API
              </button>
              <button className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5">
                Support
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Online</span>
              </div>
              <div className="flex items-center gap-2">
                {userEmail && (
                  <span className="text-xs text-slate-600 dark:text-slate-300">{userEmail}</span>
                )}
                <button
                  onClick={async () => { await supabase.auth.signOut(); }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Abmelden
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleTodo1}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                >
                  Todo 1
                </button>
                <button
                  onClick={handleTodo2}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
                >
                  ERP-Export
                </button>
                <button
                  onClick={handleTodo3}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-md transition-colors"
                >
                  Todo 3
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Kunde</h3>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Segment</label>
              <select
                value={customerSegment}
                onChange={(e) => setCustomerSegment(e.target.value as CustomerSegment)}
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="Standard">Standard</option>
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Preise werden automatisch für das gewählte Segment berechnet.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Analytics</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Anfragen heute</span>
                    <span className="font-semibold text-slate-900 dark:text-white">247</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Angebote erstellt</span>
                    <span className="font-semibold text-slate-900 dark:text-white">89</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Conversion Rate</span>
                    <span className="font-semibold text-slate-900 dark:text-white">36%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Chat Area */}
          <div className="col-span-9">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              {/* Chat Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">KI-Preisassistent</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Produktanfragen, Kalkulationen und Angebote</p>
              </div>

              {/* Chat Messages */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <span className="text-xs opacity-60 mt-1.5 block">
                        {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2.5">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Fragen Sie nach Produkten, Preisen oder Rabatten..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Senden
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Product Actions */}
            <div className="mt-6 grid grid-cols-4 gap-3">
              <button
                onClick={() => setInput('Zeige mir Waschbecken')}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-center"
              >
                <div className="text-2xl mb-1">🚿</div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Waschbecken</div>
              </button>
              <button
                onClick={() => setInput('Welche Armaturen haben Sie?')}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-center"
              >
                <div className="text-2xl mb-1">🚰</div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Armaturen</div>
              </button>
              <button
                onClick={() => setInput('Informationen zu Mengenrabatten')}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-center"
              >
                <div className="text-2xl mb-1">💰</div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Rabatte</div>
              </button>
              <button
                onClick={() => setInput('Zeige Produktkatalog')}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-center"
              >
                <div className="text-2xl mb-1">📋</div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Katalog</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Produkt</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Preise</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Integration</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Unternehmen</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Über uns</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Karriere</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Ressourcen</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Dokumentation</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Datenschutz</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">AGB</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Impressum</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-6 flex justify-between items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © 2024 Freddy B2B. Alle Rechte vorbehalten. • Alle Preise zzgl. MwSt.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-2xl border border-blue-400/50 animate-slide-up z-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Assignment Details</h3>
              <p className="text-sm leading-relaxed text-blue-50">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
