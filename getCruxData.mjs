import { getReports } from "kruk";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rq_tZnXDnK1fUO3wEOsDTy9IvniWQchPg1ibnsm_sSz6sopNRSCRuRz6YyqhUK1Ctg1KH_Eovx8v/pub?output=csv";
const OUTPUT = "./src/_data";
const API_KEY = process.env.PSIKUS;

async function getSitesFromSheet() {
  const response = await fetch(GOOGLE_SHEET_CSV_URL);
  const csvText = await response.text();
  const lines = csvText.split("\n").slice(1); // Salta l'intestazione
  
  const groups = {};
  lines.forEach(line => {
    const [brand, url] = line.split(",").map(s => s?.trim());
    if (brand && url) {
      const slug = "siti-" + brand.toLowerCase().replace(/\s+/g, "-");
      if (!groups[slug]) groups[slug] = [];
      groups[slug].push(url);
    }
  });
  return groups; // Restituisce { "siti-greenblu": ["https://..."], ... }
}
