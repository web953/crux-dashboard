import { getReports } from "kruk";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Inserisci qui l'URL del tuo CSV pubblicato da Google Sheets
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rq_tZnXDnK1fUO3wEOsDTy9IvniWQchPg1ibnsm_sSz6sopNRSCRuRz6YyqhUK1Ctg1KH_Eovx8v/pub?output=csv";
const OUTPUT = "./src/_data";
const API_KEY = process.env.PSIKUS;

async function getSitesFromSheet() {
  const response = await fetch(GOOGLE_SHEET_CSV_URL);
  const csvText = await response.text();
  const lines = csvText.split("\n").slice(1);
  
  const groups = {};
  lines.forEach((line) => {
    const parts = line.split(",").map((s) => s?.trim().replace(/^"|"$/g, ""));
    const brand = parts[0];
    const url = parts[1];
    if (brand && url) {
      const slug = "siti-" + brand.toLowerCase().replace(/\s+/g, "-");
      if (!groups[slug]) groups[slug] = [];
      if (!groups[slug].includes(url)) groups[slug].push(url);
    }
  });
  return groups;
}

async function getDataAndSaveToFile(slug, urls, queryParams) {
  const urlOrOrigin = queryParams.origin ? "origin" : "url";
  const device = queryParams.formFactor ? queryParams.formFactor.toLowerCase() : "phone";
  const fileToWrite = `${slug}-${device}-${urlOrOrigin}.json`;

  const data = await getReports(urls, API_KEY, queryParams);
  await writeFile(path.join(OUTPUT, fileToWrite), JSON.stringify(data));
}

async function run() {
  try {
    await mkdir(OUTPUT, { recursive: true });
    const groups = await getSitesFromSheet();

    for (const [slug, urls] of Object.entries(groups)) {
      console.log(`Elaborazione ${slug} (${urls.length} siti)...`);
      
      // Salva la lista master dei siti del brand in _data
      await writeFile(path.join(OUTPUT, `${slug}-master.json`), JSON.stringify(urls));

      // Scarica i dati da Google CrUX
      await getDataAndSaveToFile(slug, urls, { effectiveConnectionType: "", formFactor: "PHONE", origin: true });
      await getDataAndSaveToFile(slug, urls, { effectiveConnectionType: "", formFactor: "PHONE", origin: false });
      await getDataAndSaveToFile(slug, urls, { effectiveConnectionType: "", formFactor: "DESKTOP", origin: true });
      await getDataAndSaveToFile(slug, urls, { effectiveConnectionType: "", formFactor: "DESKTOP", origin: false });
    }
  } catch (err) {
    console.error("Errore durante il recupero dei dati:", err);
  }
}

run();
