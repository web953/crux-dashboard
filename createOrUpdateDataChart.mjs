import { readdir, mkdir } from "fs/promises";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const DATA_DIR = "./src/_data";
const CHART_DIR = "./src/_data_chart";

async function processAllCharts() {
  await mkdir(CHART_DIR, { recursive: true });

  let files = [];
  try {
    files = await readdir(DATA_DIR);
  } catch (err) {
    console.log("Nessun file presente in _data.");
    return;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const dataFilePath = path.join(DATA_DIR, file);
    const chartFilePath = path.join(CHART_DIR, file);

    try {
      const currentDataRaw = readFileSync(dataFilePath, "utf8");
      const currentData = JSON.parse(currentDataRaw);

      let chartData = [];
      if (existsSync(chartFilePath)) {
        chartData = JSON.parse(readFileSync(chartFilePath, "utf8"));
      }

      // Aggiorna lo storico dei dati per i grafici
      const updatedChart = updateChartData(currentData, chartData);
      writeFileSync(chartFilePath, JSON.stringify(updatedChart, null, 2));
    } catch (error) {
      console.error(`Errore nell'elaborazione del grafico per ${file}:`, error);
    }
  }
}

function updateChartData(currentData, chartData) {
  if (!Array.isArray(currentData)) return chartData;

  const date = new Date().toISOString().split("T")[0];

  return currentData.map((item, index) => {
    const existingItem = chartData[index] || { ...item, history: [] };
    const history = existingItem.history || [];
    const filteredHistory = history.filter((h) => h.date !== date);

    filteredHistory.push({
      date,
      p75: item.p75 || {},
    });

    return {
      ...item,
      history: filteredHistory,
    };
  });
}

processAllCharts();
