import { getReports } from "kruk";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
const INPUT = "./src/_urls";
const OUTPUT = "./src/_data";

const API_KEY = process.env.PSIKUS;

async function getDataAndSaveToFile(file, queryParams) {
  const urlOrOrigin = queryParams.origin ? "origin" : "url";
  const device = queryParams.formFactor ? queryParams.formFactor.toLowerCase() : "phone";
  const baseName = file.split(".json")[0];
  
  // Il tipo (-origin.json o -url.json) resta rigorosamente alla fine
  const fileToWrite = `${baseName}-${device}-${urlOrOrigin}.json`;

  const urls = await readFile(path.join(INPUT, file), "utf8");
  const data = await getCrux(JSON.parse(urls), queryParams);
  
  await mkdir(OUTPUT, { recursive: true });
  await writeFile(path.join(OUTPUT, fileToWrite), JSON.stringify(data));
}

try {
  const files = await readdir(INPUT);
  for (const file of files)
    if (file.includes(".json")) {
      // Genera dati Phone
      getDataAndSaveToFile(file, { effectiveConnectionType: "", formFactor: "PHONE", origin: true });
      getDataAndSaveToFile(file, { effectiveConnectionType: "", formFactor: "PHONE", origin: false });
      // Genera dati Desktop
      getDataAndSaveToFile(file, { effectiveConnectionType: "", formFactor: "DESKTOP", origin: true });
      getDataAndSaveToFile(file, { effectiveConnectionType: "", formFactor: "DESKTOP", origin: false });
    }
} catch (err) {
  console.error(err);
}

async function getCrux(urls, queryParams) {
  return await getReports(urls, API_KEY, queryParams);
}
