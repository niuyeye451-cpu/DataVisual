---
name: 电力负荷预测仪表盘设计体系
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fd'
  surface-container: '#ededf8'
  surface-container-high: '#e7e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#f0f0fb'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#00687b'
  on-secondary: '#ffffff'
  secondary-container: '#50dcff'
  on-secondary-container: '#005f71'
  tertiary: '#7b2600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33500'
  on-tertiary-container: '#ffc6b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#afecff'
  secondary-fixed-dim: '#48d7f9'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5d'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
  load-primary: '#0052CC'
  load-actual: '#2684FF'
  load-forecast: '#FF8B00'
  error-high: '#DE350B'
  neutral-surface: '#F4F5F7'
  success-metrics: '#36B37E'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 24px
  card-padding: 20px
---

# 电力负荷预测可视化仪表盘 — 前端设计与 API 接口规范

## 一、技术栈

- **前端**：React 18 + Vite + Ant Design 5 + `echarts-for-react`
- **后端**：FastAPI + Pandas
- **数据源**：`srtp/raw_data/` 下的 Excel 文件 + 已有模型预测结果

## 二、前端设计

### 整体布局

- Ant Design `Layout`：左侧 Sider 导航 + 右侧 Content
- Sider 固定三个菜单项（对应三个 Tab），点击切换内容区
- 顶栏显示项目标题「电力负荷预测可视化分析」

### Tab 1 — 数据概览

**KPI 卡片行**（4 张，Ant Design `Card` + `Statistic`）：
- 总样本数、平均负荷(kWh)、峰值负荷(kWh)、负荷标准差

**全量时序折线图**（ECharts）：
- X 轴：记录时间，Y 轴：逐时负荷
- 底部 `dataZoom` 组件支持区域缩放和拖拽平移
- 鼠标悬停显示具体值与时间点
- 上方有一个 `RangePicker` 时间范围选择器，选择后过滤图表数据

**数据表格**（Ant Design `Table`，可折叠）：
- 展示原始数据前 N 条，支持按列排序

### Tab 2 — 特征探索

**相关性热力图**（ECharts `heatmap`）：
- 展示所有特征 + 目标变量的相关性矩阵
- 每个单元格颜色越深相关性越强，标注具体数值
- 使用 `visualMap` 渐变配色

**日周期热力图**（ECharts `heatmap`）：
- 行 = 小时(0-23)，列 = 星期几(0-6)
- 单元格颜色深浅 = 该时段平均负荷
- Y 轴标签从上到下 0→23 点

**特征-负荷散点图**（ECharts `scatter`）：
- 两个下拉选择框，分别选择 X 特征和 Y 特征（Y 默认为 `hourly_load`）
- 切换选择后图表自动更新
- 支持在图例中区分不同时间段（可选）

**特征分布图**（ECharts，下拉切换）：
- 单个下拉框选择特征
- 同时显示直方图（`bar`）和箱线图（`boxplot`）
- 箱线图展示：min / Q1 / median / Q3 / max

### Tab 3 — 模型分析

**模型指标对比**（左右并排两张图）：
- 左：分组柱状图（ECharts `bar`），横轴=模型名（MLP / RandomForest / MLP+RF / DecisionTree），三组柱子分别对应 R² / MAE / RMSE
- 右：雷达图（ECharts `radar`），4 个顶点=R² / MAE / RMSE / MAPE，4 条线=4 个模型

**预测 vs 真实散点图**（ECharts `scatter`）：
- X 轴=真实值，Y 轴=预测值
- 对角线 `y=x` 参考线，越贴近对角线预测越准
- 绝对误差 > 某阈值的点用红色高亮标记

**残差分析**（上下两张图）：
- 上图：残差散点图（ECharts `scatter`），X 轴=预测值，Y 轴=残差
  - Y=0 参考线
  - 按时间段着色（凌晨/上午/下午/夜晚四个时间段）
- 下图：各时段误差箱线图（ECharts `boxplot`），横轴=时间段（凌晨0-6/上午6-12/下午12-18/夜晚18-24），纵轴=绝对误差

**特征重要性**（ECharts 水平 `bar`）：
- 从随机森林模型的 `feature_importances_` 获取
- 横向条形图，按重要性降序排列
- 每个条末端标注数值

## 三、后端 API 设计

### 基础约定

- Base URL: `http://localhost:8000`
- 所有响应为 JSON，格式：`{ "code": 200, "data": {...}, "message": "ok" }`
- 所有接口启用 CORS（允许 `localhost:5173`）

### API 1：数据概览

```
GET /api/overview
```

**响应 `data`**：
```json
{
  "total_samples": 11664,
  "avg_load": 452.3,
  "peak_load": 1680.5,
  "std_load": 298.7,
  "time_series": [
    { "time": "2018-07-01 00:00", "load": 320.5 },
    { "time": "2018-07-01 01:00", "load": 298.1 }
  ]
}
```

### API 2：特征探索数据

```
GET /api/eda
```

**响应 `data`**：
```json
{
  "columns": ["radiation", "temperature", "relative_humidity", "L_h_minus_24", "L_h_minus_1", "T_h_minus_1", "hourly_load"],
  "correlation_matrix": [[1.0, 0.32, ...], [0.32, 1.0, ...]],
  "heatmap_data": [
    { "hour": 0, "day_of_week": 1, "avg_load": 280.5 },
    { "hour": 0, "day_of_week": 2, "avg_load": 295.1 }
  ],
  "feature_stats": [
    { "name": "radiation", "mean": 245.3, "std": 180.2, "min": 0, "max": 980, "q1": 120, "median": 210, "q3": 380 }
  ]
}
```

### API 3：模型指标与预测结果

```
GET /api/models
```

**响应 `data`**：
```json
{
  "metrics": [
    { "model": "MLP", "r2": 0.82, "mae": 45.2, "rmse": 68.5 },
    { "model": "RandomForest", "r2": 0.91, "mae": 32.1, "rmse": 48.3 },
    { "model": "MLP+RF", "r2": 0.93, "mae": 28.7, "rmse": 42.1 },
    { "model": "DecisionTree", "r2": 0.78, "mae": 55.3, "rmse": 82.9 }
  ],
  "predictions": [
    {
      "time": "2018-07-15 14:00",
      "hour_period": "下午",
      "actual": 680.2,
      "mlp_pred": 620.5,
      "rf_pred": 650.3,
      "mlp_rf_pred": 665.1,
      "dt_pred": 710.8
    }
  ]
}
```

### API 4：特征重要性

```
GET /api/features
```

**响应 `data`**：
```json
{
  "importance": [
    { "feature": "L_h_minus_1", "importance": 0.35 },
    { "feature": "L_h_minus_24", "importance": 0.22 },
    { "feature": "temperature", "importance": 0.15 },
    { "feature": "T_h_minus_1", "importance": 0.12 },
    { "feature": "radiation", "importance": 0.08 },
    { "feature": "relative_humidity", "importance": 0.05 },
    { "feature": "hour", "importance": 0.03 }
  ]
}
```

### API 5：误差分析

```
GET /api/errors?model=mlp_rf
```

**参数**：`model` 可选，指定分析哪个模型的误差（默认 `mlp_rf`）

**响应 `data`**：
```json
{
  "residuals": [
    {
      "time": "2018-07-15 14:00",
      "actual": 680.2,
      "predicted": 665.1,
      "residual": 15.1,
      "abs_error": 15.1,
      "percentage_error": 2.22,
      "hour_period": "下午"
    }
  ],
  "hour_period_stats": [
    { "period": "凌晨", "mean_error": 18.5, "median_error": 12.3 },
    { "period": "上午", "mean_error": 25.1, "median_error": 20.8 },
    { "period": "下午", "mean_error": 32.7, "median_error": 28.4 },
    { "period": "夜晚", "mean_error": 22.3, "median_error": 16.9 }
  ],
  "top_errors": [
    { "time": "...", "actual": 1200, "predicted": 850, "abs_error": 350 }
  ]
}
```

## 四、开发顺序

```
Step 1: Python venv + 安装依赖（fastapi uvicorn pandas openpyxl scikit-learn）
Step 2: backend/data_loader.py — 统一数据加载封装
Step 3: backend/main.py — 逐个实现 API，curl 验证
Step 4: Vite 创建 React 项目 + 装依赖（echarts-for-react antd axios）
Step 5: useFetch hook + Layout 骨架
Step 6: Tab 1 → Tab 2 → Tab 3 逐页开发
Step 7: 前后端联调 → 样式美化 → 完成
