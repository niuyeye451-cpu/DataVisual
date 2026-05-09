import React, { useMemo, useState } from 'react';
import { Row, Col, Select, Button, Spin, Alert, Typography, Card } from 'antd';
import { DownloadOutlined, BarChartOutlined, RadarChartOutlined, DotChartOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, ScatterChart, RadarChart, BoxplotChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, RadarComponent, DatasetComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import useFetch from '../hooks/useFetch';
import { fetchModels, fetchErrors, fetchFeatures } from '../api';
import ChartCard from '../components/ChartCard';
import theme from '../theme';

echarts.use([
  BarChart, ScatterChart, RadarChart, BoxplotChart,
  GridComponent, TooltipComponent, LegendComponent, RadarComponent,
  DatasetComponent, CanvasRenderer,
]);

const { Text } = Typography;

const MODEL_COLORS = {
  MLP: '#0052CC',
  RandomForest: '#36B37E',
  'MLP+RF': '#FF8B00',
  DecisionTree: '#BA1A1A',
};

export default function ModelAnalysis() {
  const [selectedModel, setSelectedModel] = useState('mlp_rf');
  const { data: modelData, loading: ml, error: me } = useFetch(fetchModels);
  const { data: errorData, loading: el } = useFetch(() => fetchErrors(selectedModel), [selectedModel]);
  const { data: featureData, loading: fl } = useFetch(fetchFeatures);

  // ---- 1. Grouped Bar Chart ----
  const barOption = useMemo(() => {
    if (!modelData?.metrics) return null;
    const models = modelData.metrics.map((m) => m.model);
    const metrics = ['r2', 'mae', 'rmse'];
    const metricColors = [theme.colors.loadPrimary, theme.colors.successMetrics, theme.colors.loadForecast];
    return {
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#c3c6d6' },
      legend: { data: ['R²', 'MAE', 'RMSE'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: { type: 'category', data: models, axisLabel: { fontSize: 11, fontFamily: 'JetBrains Mono' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
      series: metrics.map((key, i) => ({
        name: key.toUpperCase(),
        type: 'bar',
        data: modelData.metrics.map((m) => m[key]),
        itemStyle: { color: metricColors[i], borderRadius: [4, 4, 0, 0] },
        barGap: '10%',
      })),
    };
  }, [modelData]);

  // ---- 2. Radar Chart ----
  const radarOption = useMemo(() => {
    if (!modelData?.metrics) return null;
    const indicator = [
      { name: 'R²', max: 1 },
      { name: 'MAE', max: 100 },
      { name: 'RMSE', max: 100 },
      { name: 'MAPE', max: 30 },
    ];
    return {
      tooltip: {},
      legend: { bottom: 0, data: modelData.metrics.map((m) => m.model) },
      radar: { indicator, center: ['50%', '50%'], radius: '65%' },
      series: [{
        type: 'radar',
        data: modelData.metrics.map((m, i) => ({
          name: m.model,
          value: [m.r2, m.mae, m.rmse, m.mape || m.mae / 5],
          lineStyle: { color: Object.values(MODEL_COLORS)[i] },
          areaStyle: { color: Object.values(MODEL_COLORS)[i], opacity: 0.1 },
        })),
      }],
    };
  }, [modelData]);

  // ---- 3. Predicted vs Actual Scatter ----
  const scatterOption = useMemo(() => {
    if (!errorData?.residuals) return null;
    const points = errorData.residuals.map((r) => [r.actual, r.predicted]);
    const max = Math.max(...points.flat(), 500);
    // Highlight large errors
    const normal = points.filter((p) => Math.abs(p[0] - p[1]) < 100);
    const outliers = points.filter((p) => Math.abs(p[0] - p[1]) >= 100);
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => `Actual: <b>${p.value[0]}</b><br/>Predicted: <b>${p.value[1]}</b>`,
      },
      grid: { left: '12%', right: '5%', top: '8%', bottom: '15%' },
      xAxis: { type: 'value', name: '真实负荷 (Actual)', nameTextStyle: { fontSize: 11 }, splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
      yAxis: { type: 'value', name: '预测负荷 (Predicted)', nameTextStyle: { fontSize: 11 }, splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
      series: [
        {
          type: 'scatter', data: normal, symbolSize: 4,
          itemStyle: { color: theme.colors.loadPrimary, opacity: 0.4 },
        },
        {
          type: 'scatter', data: outliers, symbolSize: 6,
          itemStyle: { color: theme.colors.errorHigh, opacity: 0.8 },
          name: 'High Error',
        },
        {
          type: 'line',
          data: [[0, 0], [max, max]],
          lineStyle: { color: '#c3c6d6', type: 'dashed', width: 1 },
          symbol: 'none',
          silent: true,
          name: 'y = x',
        },
      ],
    };
  }, [errorData]);

  // ---- 4. Residual Scatter ----
  const residualOption = useMemo(() => {
    if (!errorData?.residuals) return null;
    const periods = ['凌晨', '上午', '下午', '夜晚'];
    const periodColors = {
      '凌晨': theme.colors.primary,
      '上午': theme.colors.loadForecast,
      '下午': theme.colors.errorHigh,
      '夜晚': '#434654',
    };
    return {
      tooltip: { trigger: 'item' },
      legend: { data: periods, top: 0, textStyle: { fontSize: 10 } },
      grid: { left: '10%', right: '5%', top: '15%', bottom: '15%' },
      xAxis: { type: 'value', name: '预测值', nameTextStyle: { fontSize: 11 }, splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
      yAxis: { type: 'value', name: '残差', nameTextStyle: { fontSize: 11 }, splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
      series: periods.map((p) => ({
        name: p,
        type: 'scatter',
        data: errorData.residuals.filter((r) => r.hour_period === p).map((r) => [r.predicted, r.residual]),
        symbolSize: 4,
        itemStyle: { color: periodColors[p], opacity: 0.5 },
      })),
      markLine: { silent: true, data: [{ yAxis: 0, lineStyle: { color: theme.colors.errorHigh, type: 'dashed' } }] },
    };
  }, [errorData]);

  // ---- 5. Hourly Error Boxplot ----
  const boxplotOption = useMemo(() => {
    if (!errorData?.hour_period_stats) return null;
    const periods = errorData.hour_period_stats.map((s) => s.period);
    // Build boxplot data from raw residuals grouped by period
    const rawByPeriod = {};
    (errorData.residuals || []).forEach((r) => {
      if (!rawByPeriod[r.hour_period]) rawByPeriod[r.hour_period] = [];
      rawByPeriod[r.hour_period].push(r.abs_error);
    });
    const boxData = periods.map((p) => {
      const vals = (rawByPeriod[p] || [0]).sort((a, b) => a - b);
      const q1 = vals[Math.floor(vals.length * 0.25)];
      const q3 = vals[Math.floor(vals.length * 0.75)];
      return [vals[0], q1, vals[Math.floor(vals.length / 2)], q3, vals[vals.length - 1]];
    });
    return {
      tooltip: { trigger: 'item' },
      grid: { left: '8%', right: '5%', top: '10%', bottom: '12%' },
      xAxis: { type: 'category', data: periods.map((p) => `${p} (${p === '凌晨' ? '0-6' : p === '上午' ? '6-12' : p === '下午' ? '12-18' : '18-24'})`), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: '绝对误差', splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
      series: [{
        type: 'boxplot', data: boxData,
        itemStyle: { color: '#faf8ff', borderColor: theme.colors.primary, borderWidth: 1.5 },
        boxWidth: [20, 60],
      }],
    };
  }, [errorData]);

  // ---- 6. Feature Importance ----
  const featureOption = useMemo(() => {
    if (!featureData?.importance) return null;
    const sorted = [...featureData.importance].sort((a, b) => a.importance - b.importance);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '20%', right: '10%', top: '5%', bottom: '5%', containLabel: true },
      xAxis: { type: 'value', name: 'Importance', axisLabel: { fontSize: 10 } },
      yAxis: {
        type: 'category', data: sorted.map((d) => d.feature),
        axisLabel: { fontFamily: 'JetBrains Mono', fontSize: 11, color: '#434654' },
        inverse: true,
      },
      series: [{
        type: 'bar',
        data: sorted.map((d, i) => ({
          value: d.importance,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: theme.colors.primary }, { offset: 1, color: `rgba(0,61,155,${0.3 + i * 0.1})` },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: { show: true, position: 'right', formatter: '{c}', fontFamily: 'JetBrains Mono', fontSize: 11 },
      }],
    };
  }, [featureData]);

  const loading = ml || el || fl;
  if (me) return <Alert type="error" message={me} showIcon />;

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'IBM Plex Sans', fontSize: 24, fontWeight: 600, margin: 0 }}>模型分析 (Model Analysis)</h2>
          <Text type="secondary">评估不同机器学习模型在电力负荷预测上的表现差异，并进行残差与特征重要性分析。</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select value={selectedModel} onChange={setSelectedModel} style={{ width: 200 }}
            options={[
              { value: 'mlp_rf', label: 'Default Model (MLP+RF)' },
              { value: 'mlp', label: 'MLP' },
              { value: 'rf', label: 'RandomForest' },
              { value: 'dt', label: 'DecisionTree' },
            ]}
          />
          <Button type="primary" icon={<DownloadOutlined />}>导出报告</Button>
        </div>
      </div>

      {/* Row 1: Bar Chart (2/3) + Radar (1/3) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col lg={16} xs={24}>
          <ChartCard
            title="模型指标对比"
            icon={<BarChartOutlined style={{ color: theme.colors.primary }} />}
            extra={
              <div style={{ display: 'flex', gap: 12 }}>
                <LegendDot color={theme.colors.loadPrimary} label="R²" />
                <LegendDot color={theme.colors.successMetrics} label="MAE" />
                <LegendDot color={theme.colors.loadForecast} label="RMSE" />
              </div>
            }
          >
            {loading ? <Spin style={{ display:'block', margin:'120px auto' }} /> :
              barOption ? <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 320 }} notMerge /> : null}
          </ChartCard>
        </Col>
        <Col lg={8} xs={24}>
          <ChartCard title="综合性能评估" icon={<RadarChartOutlined style={{ color: theme.colors.secondary }} />}>
            {loading ? <Spin style={{ display:'block', margin:'120px auto' }} /> :
              radarOption ? <ReactEChartsCore echarts={echarts} option={radarOption} style={{ height: 320 }} notMerge /> : null}
          </ChartCard>
        </Col>
      </Row>

      {/* Row 2: Scatter (1/3) + Residual Scatter + Boxplot (2/3) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col lg={8} xs={24}>
          <ChartCard title="预测 vs 真实值分布" icon={<DotChartOutlined style={{ color: theme.colors.errorHigh }} />}>
            {loading ? <Spin style={{ display:'block', margin:'120px auto' }} /> :
              scatterOption ? <ReactEChartsCore echarts={echarts} option={scatterOption} style={{ height: 320 }} notMerge /> : null}
          </ChartCard>
        </Col>
        <Col lg={16} xs={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <ChartCard
              title="残差散点图"
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  {['凌晨', '上午', '下午', '夜晚'].map((p) => (
                    <LegendDot key={p} small color={{ '凌晨': theme.colors.primary, '上午': theme.colors.loadForecast, '下午': theme.colors.errorHigh, '夜晚': '#434654' }[p]} label={p} />
                  ))}
                </div>
              }
              style={{ flex: 1 }}
            >
              {loading ? <Spin style={{ display:'block', margin:'60px auto' }} /> :
                residualOption ? <ReactEChartsCore echarts={echarts} option={residualOption} style={{ height: 180 }} notMerge /> : null}
            </ChartCard>
            <ChartCard title="各时段绝对误差分布" style={{ flex: 1 }}>
              {loading ? <Spin style={{ display:'block', margin:'60px auto' }} /> :
                boxplotOption ? <ReactEChartsCore echarts={echarts} option={boxplotOption} style={{ height: 180 }} notMerge /> : null}
            </ChartCard>
          </div>
        </Col>
      </Row>

      {/* Row 3: Feature Importance (full width) */}
      <ChartCard title="特征重要性 (Feature Importance)">
        {loading ? <Spin style={{ display:'block', margin:'100px auto' }} /> :
          featureOption ? <ReactEChartsCore echarts={echarts} option={featureOption} style={{ height: 320 }} notMerge /> : null}
      </ChartCard>
    </>
  );
}

function LegendDot({ color, label, small }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: small ? 10 : 12 }}>
      <div style={{ width: small ? 8 : 12, height: small ? 8 : 12, borderRadius: '50%', backgroundColor: color }} />
      <Text type="secondary" style={{ fontSize: small ? 10 : 12 }}>{label}</Text>
    </div>
  );
}
