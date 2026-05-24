/**
 * Static mock data — mirrors the backend API response shapes exactly.
 * Frontend runs standalone without the Python backend when these are used.
 */
const mockData = {
  overview: {
    total_samples: 11664,
    avg_load: 452.3,
    peak_load: 1680.5,
    std_load: 298.7,
    time_series: generateTimeSeries(),
  },

  eda: {
    columns: [
      "radiation",
      "temperature",
      "relative_humidity",
      "L_h_minus_24",
      "L_h_minus_1",
      "T_h_minus_1",
      "hourly_load",
    ],
    correlation_matrix: [
      [1.0, 0.45, -0.21, 0.12, 0.15, 0.08, 0.62],
      [0.45, 1.0, -0.15, 0.38, 0.42, 0.35, 0.85],
      [-0.21, -0.15, 1.0, -0.05, -0.08, -0.03, -0.34],
      [0.12, 0.38, -0.05, 1.0, 0.88, 0.32, 0.72],
      [0.15, 0.42, -0.08, 0.88, 1.0, 0.35, 0.78],
      [0.08, 0.35, -0.03, 0.32, 0.35, 1.0, 0.48],
      [0.62, 0.85, -0.34, 0.72, 0.78, 0.48, 1.0],
    ],
    heatmap_data: generateHeatmapData(),
    feature_stats: [
      { name: "radiation", mean: 245.3, std: 180.2, min: 0, max: 980, q1: 120, median: 210, q3: 380, n: 11664 },
      { name: "temperature", mean: 28.5, std: 6.8, min: 18.2, max: 39.5, q1: 23.0, median: 28.5, q3: 34.0, n: 11664 },
      { name: "relative_humidity", mean: 65.2, std: 15.3, min: 25.0, max: 98.0, q1: 55.0, median: 65.0, q3: 78.0, n: 11664 },
      { name: "L_h_minus_24", mean: 450.8, std: 295.0, min: 0, max: 1700, q1: 220, median: 400, q3: 620, n: 11664 },
      { name: "L_h_minus_1", mean: 452.1, std: 296.5, min: 0, max: 1700, q1: 222, median: 402, q3: 622, n: 11664 },
      { name: "T_h_minus_1", mean: 28.4, std: 6.7, min: 18.0, max: 39.5, q1: 22.8, median: 28.3, q3: 33.8, n: 11664 },
      { name: "hourly_load", mean: 452.3, std: 298.7, min: 0, max: 1680.5, q1: 230, median: 410, q3: 630, n: 11664 },
    ],
    scatter_data: generateScatterData(),
    samples: generateSamples(),
  },

  models: {
    metrics: [
      { model: "MLP", r2: 0.82, mae: 45.2, rmse: 68.5, mape: 12.3 },
      { model: "RandomForest", r2: 0.91, mae: 32.1, rmse: 48.3, mape: 8.5 },
      { model: "MLP+RF", r2: 0.93, mae: 28.7, rmse: 42.1, mape: 6.8 },
      { model: "DecisionTree", r2: 0.78, mae: 55.3, rmse: 82.9, mape: 15.1 },
    ],
    predictions: generatePredictions(),
  },

  features: {
    importance: [
      { feature: "L_h_minus_1", importance: 0.35 },
      { feature: "L_h_minus_24", importance: 0.22 },
      { feature: "temperature", importance: 0.15 },
      { feature: "T_h_minus_1", importance: 0.12 },
      { feature: "radiation", importance: 0.08 },
      { feature: "relative_humidity", importance: 0.05 },
      { feature: "hour", importance: 0.03 },
    ],
  },

  errors: {
    residuals: generateResiduals(),
    hour_period_stats: [
      { period: "凌晨", mean_error: 18.5, median_error: 12.3 },
      { period: "上午", mean_error: 25.1, median_error: 20.8 },
      { period: "下午", mean_error: 32.7, median_error: 28.4 },
      { period: "夜晚", mean_error: 22.3, median_error: 16.9 },
    ],
    top_errors: [
      { time: "2018-07-15 14:00", actual: 1200, predicted: 850, abs_error: 350 },
      { time: "2018-07-20 16:00", actual: 1350, predicted: 980, abs_error: 370 },
      { time: "2018-07-08 13:00", actual: 1100, predicted: 780, abs_error: 320 },
      { time: "2018-07-22 15:00", actual: 1250, predicted: 910, abs_error: 340 },
    ],
  },
};

// ---- Helpers to generate realistic mock data ----

function generateTimeSeries() {
  const data = [];
  for (let day = 1; day <= 30; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate daily + hourly pattern
      const base = 350 + 150 * Math.sin(((hour - 6) / 24) * Math.PI);
      const noise = (Math.random() - 0.5) * 120;
      const dayFactor = 1 + 0.1 * Math.sin((day / 7) * Math.PI * 2);
      const load = Math.max(0, Math.round((base + noise) * dayFactor * 100) / 100);
      data.push({
        time: `2018-07-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:00`,
        load,
      });
    }
  }
  return data;
}

function generateHeatmapData() {
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let dow = 0; dow < 7; dow++) {
      const base =
        hour < 6 ? 250 + Math.random() * 100 :
        hour < 12 ? 400 + Math.random() * 300 :
        hour < 18 ? 500 + Math.random() * 400 :
        350 + Math.random() * 200;
      const weekendFactor = dow >= 5 ? 0.85 : 1.0;
      data.push({
        hour,
        day_of_week: dow,
        avg_load: Math.round(base * weekendFactor * 10) / 10,
      });
    }
  }
  return data;
}

function generateScatterData() {
  const data = [];
  for (let i = 0; i < 500; i++) {
    const temp = 20 + Math.random() * 20;
    const load = 200 + temp * 15 + (Math.random() - 0.5) * 200;
    data.push([Math.round(temp * 10) / 10, Math.round(Math.max(0, load) * 10) / 10]);
  }
  return data;
}

function generatePredictions() {
  const periods = ["凌晨", "上午", "下午", "夜晚"];
  const data = [];
  for (let day = 1; day <= 30; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const actual = 300 + Math.random() * 800;
      const error = (Math.random() - 0.4) * 120;
      const period = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
      data.push({
        time: `2018-07-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:00`,
        hour_period: periods[period],
        actual: Math.round(actual * 100) / 100,
        mlp_pred: Math.round((actual + error * 1.5) * 100) / 100,
        rf_pred: Math.round((actual + error * 0.8) * 100) / 100,
        mlp_rf_pred: Math.round((actual + error * 0.5) * 100) / 100,
        dt_pred: Math.round((actual + error * 1.8) * 100) / 100,
      });
    }
  }
  return data;
}

function generateResiduals() {
  const periods = ["凌晨", "上午", "下午", "夜晚"];
  const data = [];
  for (let i = 0; i < 600; i++) {
    const actual = 300 + Math.random() * 800;
    const predicted = actual + (Math.random() - 0.45) * 150;
    const absErr = Math.abs(actual - predicted);
    const period = periods[Math.floor(Math.random() * 4)];
    data.push({
      time: `2018-07-${String(Math.floor(Math.random() * 30) + 1).padStart(2, "0")} ${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:00`,
      actual: Math.round(actual * 100) / 100,
      predicted: Math.round(predicted * 100) / 100,
      residual: Math.round((actual - predicted) * 100) / 100,
      abs_error: Math.round(absErr * 100) / 100,
      percentage_error: Math.round((absErr / actual) * 10000) / 100,
      hour_period: period,
    });
  }
  return data;
}

function generateSamples() {
  const data = [];
  for (let i = 0; i < 600; i++) {
    const hour = Math.floor(Math.random() * 24);
    const temperature = 20 + Math.random() * 20;
    const radiation = Math.max(0, Math.min(980, 100 + 500 * Math.sin((hour - 6) / 24 * Math.PI) + (Math.random() - 0.5) * 300));
    const humidity = 40 + Math.random() * 50;
    const load = 200 + temperature * 8 + radiation * 0.3 + (Math.random() - 0.5) * 200;
    const h24 = load + (Math.random() - 0.5) * 40;
    const h1 = load + (Math.random() - 0.5) * 20;
    const t1 = temperature + (Math.random() - 0.5) * 2;
    data.push([
      Math.round(radiation * 100) / 100,
      Math.round(temperature * 100) / 100,
      Math.round(humidity * 100) / 100,
      Math.round(h24 * 100) / 100,
      Math.round(h1 * 100) / 100,
      Math.round(t1 * 100) / 100,
      Math.round(Math.max(0, load) * 100) / 100,
      hour,
    ]);
  }
  return data;
}

export default mockData;
