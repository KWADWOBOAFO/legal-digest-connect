// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://casebroker.co.uk";
const SUPABASE_URL = "https://ptpiezhdaxmhzigarkbc.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cGllemhkYXhtaHppZ2Fya2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTM1ODQsImV4cCI6MjA4MzU2OTU4NH0.2W72ZsE8TrV_UIcvN_qrgG5q1-VkgRukEYHPeK1SaAg";

interface Entry { path: string; changefreq?: string; priority?: string }

const entries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/firms", changefreq: "daily", priority: "0.8" },
  { path: "/pricing", priority: "0.8" },
  { path: "/how-it-works", priority: "0.8" },
  { path: "/practice-areas", priority: "0.8" },
  { path: "/for-law-firms", priority: "0.8" },
  { path: "/contact", priority: "0.6" },
  { path: "/about", priority: "0.6" },
  { path: "/faqs", priority: "0.6" },
  { path: "/help", priority: "0.5" },
  { path: "/community", priority: "0.4" },
  { path: "/status", priority: "0.3" },
  { path: "/careers", priority: "0.4" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/privacy", priority: "0.3" },
  { path: "/terms", priority: "0.3" },
  { path: "/cookies", priority: "0.3" },
  { path: "/gdpr", priority: "0.3" },
];

async function blogEntries(): Promise<Entry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug&status=eq.published`,
      { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string }[];
    return rows.map((r) => ({ path: `/blog/${r.slug}`, changefreq: "monthly", priority: "0.6" }));
  } catch {
    return [];
  }
}

const all = [...entries, ...(await blogEntries())];
const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...all.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n"),
  ),
  `</urlset>`,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${all.length} entries)`);
