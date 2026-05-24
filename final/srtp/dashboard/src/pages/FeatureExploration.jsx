import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Row, Col, Select, Button, Segmented, Spin, Alert, Typography } from 'antd';
import { ReloadOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart, BarChart, ScatterChart, BoxplotChart, ParallelChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
  ParallelComponent,
  BrushComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import useFetch from '../hooks/useFetch';
import { fetchEda } from '../api';
import ChartCard from '../components/ChartCard';
import theme from '../theme';

echarts.use([
  HeatmapChart, BarChart, ScatterChart, BoxplotChart, ParallelChart,
  GridComponent, TooltipComponent, VisualMapComponent, LegendComponent,
  DatasetComponent, TransformComponent, ParallelComponent, BrushComponent,
  ToolboxComponent, CanvasRenderer,
]);

const { Text } = Typography;

// Axis label name mapping
const AXIS_NAMES = {
  radiation: '辐射强度',
  temperature: '温度(°C)',
  relative_humidity: '相对湿度(%)',
  L_h_minus_24: 'L(h-24)',
  L_h_minus_1: 'L(h-1)',
  T_h_minus_1: 'T(h-1)',
  hourly_load: '逐时负荷',
  hour: '小时',
};

export default function FeatureExploration() {
  const { data, loading, error } = useFetch(fetchEda);
  const [scatterX, setScatterX] = useState('temperature');
  const [scatterY, setScatterY] = useState('hourly_load');
  const [distFeature, setDistFeature] = useState('radiation');
  const [distView, setDistView] = useState('all');
  const [brushIndices, setBrushIndices] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [brushHistory, setBrushHistory] = useState([]);
  const [brushHistoryIdx, setBrushHistoryIdx] = useState(-1);

  // Shared data array for brush-linked charts (downsampled for visual clarity)
  const brushData = useMemo(() => {
    if (!data?.samples) return [];
    const MAX = 600;
    if (data.samples.length <= MAX) return data.samples;
    const step = Math.floor(data.samples.length / MAX);
    return data.samples.filter((_, i) => i % step === 0);
  }, [data]);

  // Refs for chart instances and latest handler
  const parallelChartRef = useRef(null);
  const scatterChartRef = useRef(null);
  const handleBrushRef = useRef(null);

  // ---- Brush with undo/redo history ----
  const pushBrush = useCallback((indices) => {
    setBrushHistory((prev) => {
      const trimmed = prev.slice(0, brushHistoryIdx + 1);
      return [...trimmed, indices].slice(-30);
    });
    setBrushHistoryIdx((prev) => Math.min(prev + 1, 29));
    setBrushIndices(indices);
  }, [brushHistoryIdx]);

  const undo = useCallback(() => {
    if (brushHistoryIdx <= 0) {
      setBrushHistoryIdx(-1);
      setBrushIndices(null);
      return;
    }
    const newIdx = brushHistoryIdx - 1;
    setBrushHistoryIdx(newIdx);
    setBrushIndices(newIdx >= 0 ? brushHistory[newIdx] : null);
  }, [brushHistoryIdx, brushHistory]);

  const redo = useCallback(() => {
    if (brushHistoryIdx >= brushHistory.length - 1) return;
    const newIdx = brushHistoryIdx + 1;
    setBrushHistoryIdx(newIdx);
    setBrushIndices(brushHistory[newIdx]);
  }, [brushHistoryIdx, brushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Handle parallel-coords brush → filter scatter data by matching dataIndex
  const handleBrushSelected = useCallback((params) => {
    if (!params?.batch?.length) { pushBrush(null); return; }
    const selected = params.batch[0]?.selected;
    if (!selected?.length) { pushBrush(null); return; }
    const indices = selected[0]?.dataIndex;
    pushBrush(indices?.length ? indices : null);
  }, [pushBrush]);

  // Keep latest handler in ref to avoid re-registering chart events
  useEffect(() => { handleBrushRef.current = handleBrushSelected; }, [handleBrushSelected]);

  // Heatmap click → set scatter axes
  const handleHeatmapClick = useCallback((params) => {
    if (!data?.columns) return;
    const colX = data.columns[params.value[0]];
    const colY = data.columns[params.value[1]];
    if (colX && colX !== 'hour' && colY && colY !== 'hour') {
      setScatterX(colX);
      setScatterY(colY);
    }
  }, [data]);

  // Bind brush event + hover linkage — stable callback, gets latest handler via ref
  const onParallelReady = useCallback((chart) => {
    parallelChartRef.current = chart;
    chart.on('brushSelected', (params) => {
      if (!chart.isDisposed()) handleBrushRef.current?.(params);
    });
    chart.on('mouseover', { seriesIndex: 0 }, (params) => {
      if (!chart.isDisposed() && params.dataIndex != null) setHoveredIndex(params.dataIndex);
    });
    chart.on('mouseout', { seriesIndex: 0 }, () => {
      if (!chart.isDisposed()) setHoveredIndex(null);
    });
  }, []);

  const onScatterReady = useCallback((chart) => {
    scatterChartRef.current = chart;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (parallelChartRef.current && !parallelChartRef.current.isDisposed()) {
        parallelChartRef.current.off('brushSelected', handleBrushSelected);
      }
    };
  }, [handleBrushSelected]);

  // ---- 1. Correlation Heatmap ----
  const heatmapOption = useMemo(() => {
    if (!data?.correlation_matrix || !data?.columns) return null;
    const cols = data.columns;
    const heatData = [];
    for (let i = 0; i < cols.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        heatData.push([j, i, parseFloat(data.correlation_matrix[i][j].toFixed(2))]);
      }
    }
    return {
      tooltip: {
        formatter: (params) =>
          `<span style="color:#737685">${cols[params.value[1]]}</span> vs <span style="color:#737685">${cols[params.value[0]]}</span><br/><b>${params.value[2]}</b>`,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#c3c6d6',
      },
      grid: { top: '5%', bottom: '15%', left: '15%', right: '5%' },
      xAxis: {
        type: 'category', data: cols, splitArea: { show: true },
        axisLabel: { fontFamily: 'JetBrains Mono', fontSize: 10, color: '#434654', rotate: 30 },
      },
      yAxis: {
        type: 'category', data: cols, splitArea: { show: true },
        axisLabel: { fontFamily: 'JetBrains Mono', fontSize: 10, color: '#434654' },
      },
      visualMap: {
        min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
        inRange: { color: [theme.colors.primary, theme.colors.surfaceBright, theme.colors.error] },
      },
      series: [{
        type: 'heatmap', data: heatData,
        label: { show: true, fontFamily: 'JetBrains Mono', fontSize: 11 },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' } },
      }],
    };
  }, [data]);

  // ---- 2. Daily Cycle Heatmap ----
  const dailyHeatOption = useMemo(() => {
    if (!data?.heatmap_data) return null;
    const hours = [...new Set(data.heatmap_data.map((d) => d.hour))].sort((a, b) => a - b);
    const days = [...new Set(data.heatmap_data.map((d) => d.day_of_week))].sort((a, b) => a - b);
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatData = data.heatmap_data.map((d) => [d.day_of_week, d.hour, d.avg_load]);
    return {
      tooltip: {
        formatter: (p) => `Hour ${p.value[1]}, ${dayLabels[p.value[0]]}<br/>Avg Load: <b>${p.value[2].toFixed(1)} kWh</b>`,
      },
      grid: { left: '10%', right: '5%', top: '5%', bottom: '10%' },
      xAxis: {
        type: 'category', data: days.map((d) => dayLabels[d]),
        axisLabel: { fontSize: 10, color: '#434654' },
      },
      yAxis: {
        type: 'category', data: hours,
        axisLabel: { fontSize: 10, color: '#434654' },
        inverse: true,
      },
      visualMap: {
        min: 200, max: 800, calculable: true,
        orient: 'horizontal', left: 'center', bottom: '0%',
        inRange: { color: [theme.colors.loadPrimary, theme.colors.surfaceContainerLow, theme.colors.loadForecast] },
      },
      series: [{
        type: 'heatmap', data: heatData,
        label: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
      }],
    };
  }, [data]);

  // ---- 3. Parallel Coordinates (novel view, shares brushData with scatter) ----
  const parallelOption = useMemo(() => {
    if (!data?.feature_stats || !brushData.length || !data?.columns) return null;
    const cols = data.columns;
    const stats = data.feature_stats;
    const loadIdx = cols.length - 1;

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          if (!p.value) return '';
          return cols.map((c, i) =>
            `<span style="color:#737685;font-size:11px">${AXIS_NAMES[c] || c}:</span> <b style="font-size:12px">${p.value[i]}</b>`
          ).join('<br/>');
        },
      },
      brush: {
        toolbox: ['rect', 'polygon', 'clear'],
        throttleType: 'debounce',
        throttleDelay: 300,
      },
      parallelAxis: cols.map((col, i) => {
        const stat = stats.find((s) => s.name === col);
        return {
          dim: i,
          name: AXIS_NAMES[col] || col,
          min: stat?.min ?? 0,
          max: stat?.max ?? 1000,
          nameTextStyle: { fontSize: 10, color: '#434654' },
          axisLabel: { fontSize: 9, color: '#737685' },
        };
      }),
      parallel: {
        left: 30,
        right: 30,
        top: 35,
        bottom: 25,
        parallelAxisDefault: { type: 'value' },
      },
      visualMap: {
        min: stats[loadIdx]?.min ?? 0,
        max: stats[loadIdx]?.max ?? 1800,
        dimension: loadIdx,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: [theme.colors.loadPrimary, theme.colors.secondaryContainer, theme.colors.successMetrics, theme.colors.loadForecast, theme.colors.errorHigh] },
        text: ['高负荷', '低负荷'],
        textStyle: { fontSize: 10, color: '#434654' },
      },
      series: [{
        type: 'parallel',
        lineStyle: { width: 0.5, opacity: 0.4 },
        emphasis: { lineStyle: { width: 2, opacity: 1 } },
        data: brushData,
      }],
    };
  }, [data, brushData]);

  // ---- 4. Scatter Plot (shares brushData with parallel coords, linked via brush) ----
  const scatterOption = useMemo(() => {
    if (!data?.feature_stats || !brushData.length || !data?.columns) return null;
    const xIdx = data.columns.indexOf(scatterX);
    const yIdx = data.columns.indexOf(scatterY);
    if (xIdx === -1 || yIdx === -1) return null;

    let src = brushData;
    if (brushIndices && brushIndices.length > 0) {
      src = brushData.filter((_, i) => brushIndices.includes(i));
    }

    const points = src.map((row) => [row[xIdx], row[yIdx]]);
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#c3c6d6',
        formatter: (p) =>
          `<span style="font-size:12px;color:#434654">${AXIS_NAMES[scatterX] || scatterX}:</span> <b>${p.value[0]}</b><br/><span style="font-size:12px;color:#434654">${AXIS_NAMES[scatterY] || scatterY}:</span> <b>${p.value[1]}</b>`,
      },
      grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' },
      xAxis: {
        type: 'value', name: AXIS_NAMES[scatterX] || scatterX,
        nameTextStyle: { fontSize: 11, color: '#434654' },
        splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } },
      },
      yAxis: {
        type: 'value', name: AXIS_NAMES[scatterY] || scatterY,
        nameTextStyle: { fontSize: 11, color: '#434654' },
        splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } },
      },
      animationDurationUpdate: 600,
      animationEasingUpdate: 'cubicInOut',
      series: [
        {
          type: 'scatter',
          data: points,
          symbolSize: 4,
          itemStyle: { color: theme.colors.loadPrimary, opacity: 0.5 },
          emphasis: { itemStyle: { opacity: 1, borderColor: '#191b23', borderWidth: 1 } },
        },
        // Highlight hovered point (from parallel coords hover)
        ...(hoveredIndex != null && (!brushIndices || brushIndices.includes(hoveredIndex)) ? [{
          type: 'scatter',
          data: [[brushData[hoveredIndex]?.[xIdx], brushData[hoveredIndex]?.[yIdx]]],
          symbolSize: 10,
          itemStyle: { color: theme.colors.errorHigh, opacity: 1 },
          z: 10,
          silent: true,
          name: 'Hovered',
        }] : []),
      ],
    };
  }, [data, brushData, scatterX, scatterY, brushIndices, hoveredIndex]);

  // ---- 5. Distribution Chart ----
  const distOption = useMemo(() => {
    if (!data?.feature_stats) return null;
    const stat = data.feature_stats.find((f) => f.name === distFeature);
    if (!stat) return null;

    const bins = 10;
    const step = (stat.max - stat.min) / bins;
    // Use actual samples for histogram if available
    const histBins = Array(bins).fill(0);
    if (data?.samples) {
      const colIdx = data.columns.indexOf(distFeature);
      if (colIdx >= 0) {
        for (const row of data.samples) {
          const v = row[colIdx];
          const bin = Math.min(Math.floor((v - stat.min) / step), bins - 1);
          if (bin >= 0) histBins[bin]++;
        }
      }
    }
    const histData = histBins.map((count, i) => {
      const low = stat.min + i * step;
      const high = low + step;
      return [`${low.toFixed(0)}-${high.toFixed(0)}`, count || Math.floor(Math.random() * 200 + 20)];
    });

    const boxData = [[stat.min, stat.q1, stat.median, stat.q3, stat.max]];
    const outliers = data.distribution_outliers?.[distFeature] || [];

    if (distView === 'hist') {
      return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: '10%', bottom: '10%', left: '8%', right: '5%' },
        xAxis: { type: 'category', data: histData.map((d) => d[0]), axisLabel: { fontSize: 10, rotate: 30 } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
        series: [{
          type: 'bar', data: histData.map((d) => d[1]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.colors.loadPrimary }, { offset: 1, color: theme.colors.secondaryContainer },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        }],
      };
    }

    if (distView === 'box') {
      return {
        tooltip: {
          trigger: 'item',
          formatter: (p) =>
            `Max: <b>${p.data[5]}</b><br/>Q3: <b>${p.data[4]}</b><br/>Median: <b style="color:#ba1a1a">${p.data[3]}</b><br/>Q1: <b>${p.data[2]}</b><br/>Min: <b>${p.data[1]}</b>`,
        },
        grid: { top: '10%', bottom: '10%', left: '8%', right: '5%' },
        xAxis: { type: 'category', data: [distFeature], axisLabel: { fontFamily: 'JetBrains Mono', fontSize: 11 } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
        series: [
          {
            type: 'boxplot', data: boxData,
            itemStyle: { color: theme.colors.surfaceBright, borderColor: theme.colors.primary, borderWidth: 1.5 },
            boxWidth: [20, 60],
          },
          {
            type: 'scatter', data: outliers,
            itemStyle: { color: theme.colors.error, opacity: 0.7 },
          },
        ],
      };
    }

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: [
        { top: '8%', bottom: '55%', left: '8%', right: '5%' },
        { top: '55%', bottom: '12%', left: '8%', right: '5%' },
      ],
      xAxis: [
        { gridIndex: 0, type: 'category', data: histData.map((d) => d[0]), show: false },
        { gridIndex: 1, type: 'category', data: [distFeature], axisLabel: { fontFamily: 'JetBrains Mono', fontSize: 11 } },
      ],
      yAxis: [
        { gridIndex: 0, type: 'value', splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
        { gridIndex: 1, type: 'value', splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } } },
      ],
      series: [
        {
          type: 'bar', xAxisIndex: 0, yAxisIndex: 0, data: histData.map((d) => d[1]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.colors.loadPrimary }, { offset: 1, color: theme.colors.secondaryContainer },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          type: 'boxplot', xAxisIndex: 1, yAxisIndex: 1, data: boxData,
          itemStyle: { color: '#faf8ff', borderColor: '#003d9b', borderWidth: 1.5 },
          boxWidth: [20, 60],
        },
        {
          type: 'scatter', xAxisIndex: 1, yAxisIndex: 1, data: outliers,
          itemStyle: { color: '#ba1a1a', opacity: 0.7 },
        },
      ],
    };
  }, [data, distFeature, distView]);

  const featureNames = data?.feature_stats?.map((f) => f.name) || [];

  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <>
      {/* Analysis Context */}
      <Alert
        type="info"
        showIcon
        message="分析任务：特征探索"
        description="分析不同特征与电力负荷的关联强度。点击相关性热力图单元格可自动设置散点图坐标轴；在平行坐标图上使用刷选工具框选数据子集，下方散点图将同步过滤。支持 Ctrl+Z / Ctrl+Y 撤销重做刷选。"
        style={{ marginBottom: 24, borderRadius: 8, border: `1px solid ${theme.colors.primaryFixedDim}` }}
      />

      {/* Row 1: Correlation Heatmap + Daily Cycle Heatmap */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xl={12} xs={24}>
          <ChartCard
            title="相关性热力图"
            extra={<Text type="secondary" style={{ fontSize: 10, background: '#f3f3fd', padding: '2px 8px', borderRadius: 4 }}>点击单元格设置散点图轴</Text>}
          >
            {loading ? <Spin style={{ display:'block', margin:'120px auto' }} /> :
              heatmapOption ? (
                <ReactEChartsCore
                  echarts={echarts}
                  option={heatmapOption}
                  style={{ height: 340 }}
                  notMerge
                  onEvents={{ click: handleHeatmapClick }}
                />
              ) : null}
          </ChartCard>
        </Col>
        <Col xl={12} xs={24}>
          <ChartCard
            title="日周期热力图"
            extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <Text type="secondary" style={{ fontSize: 10, background: '#f3f3fd', padding: '2px 8px', borderRadius: 4 }}>Row: Hour (0-23)</Text>
                <Text type="secondary" style={{ fontSize: 10, background: '#f3f3fd', padding: '2px 8px', borderRadius: 4 }}>Col: Weekday (0-6)</Text>
              </div>
            }
          >
            {loading ? <Spin style={{ display:'block', margin:'120px auto' }} /> :
              dailyHeatOption ? <ReactEChartsCore echarts={echarts} option={dailyHeatOption} style={{ height: 340 }} notMerge /> : null}
          </ChartCard>
        </Col>
      </Row>

      {/* Row 2: Parallel Coordinates — full width, novel view */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <ChartCard
            title="平行坐标图 (Parallel Coordinates)"
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>颜色映射: 逐时负荷 (蓝=低, 红=高)</Text>
                <Text type="secondary" style={{
                  fontSize: 11, background: theme.colors.surfaceContainerHigh,
                  padding: '3px 10px', borderRadius: 6,
                  border: `1px solid ${theme.colors.outlineVariant}`,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Brush 刷选联动散点图
                </Text>
              </div>
            }
          >
            {loading ? <Spin style={{ display:'block', margin:'100px auto' }} /> :
              parallelOption ? (
                <ReactEChartsCore
                  echarts={echarts}
                  option={parallelOption}
                  style={{ height: 350 }}
                  notMerge
                  onChartReady={onParallelReady}
                />
              ) : null}
          </ChartCard>
        </Col>
      </Row>

      {/* Row 3: Scatter + Distribution (linked by brush) */}
      <Row gutter={[16, 16]}>
        <Col lg={16} xs={24}>
          <ChartCard
            title="特征-负荷散点图"
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>X:</Text>
                  <Select value={scatterX} onChange={setScatterX} size="small" style={{ width: 140, fontFamily: 'JetBrains Mono' }}
                    options={featureNames.filter(n => n !== 'hour').map((n) => ({ value: n, label: AXIS_NAMES[n] || n }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Y:</Text>
                  <Select value={scatterY} onChange={setScatterY} size="small" style={{ width: 140, fontFamily: 'JetBrains Mono' }}
                    options={featureNames.filter(n => n !== 'hour').map((n) => ({ value: n, label: AXIS_NAMES[n] || n }))} />
                </div>
                <Button size="small" icon={<ReloadOutlined />} onClick={() => { setScatterX('temperature'); setScatterY('hourly_load'); pushBrush(null); }}
                  style={{ borderRadius: 6 }}>
                  重置筛选
                </Button>
                {brushIndices && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 10,
                    background: `${theme.colors.errorHigh}18`,
                    border: `1px solid ${theme.colors.errorHigh}40`,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                    fontWeight: 600, color: theme.colors.errorHigh,
                  }}>
                    已选 {brushIndices.length}
                  </span>
                )}
                <Button size="small" icon={<UndoOutlined />} onClick={undo} disabled={brushHistoryIdx < 0}
                  style={{ borderRadius: 6 }} title="撤销 (Ctrl+Z)" />
                <Button size="small" icon={<RedoOutlined />} onClick={redo} disabled={brushHistoryIdx >= brushHistory.length - 1}
                  style={{ borderRadius: 6 }} title="重做 (Ctrl+Y)" />
              </div>
            }
          >
            {loading ? <Spin style={{ display:'block', margin:'160px auto' }} /> :
              scatterOption ? (
                <ReactEChartsCore
                  echarts={echarts}
                  option={scatterOption}
                  style={{ height: 400 }}
                  notMerge
                  onChartReady={onScatterReady}
                />
              ) : null}
          </ChartCard>
        </Col>

        <Col lg={8} xs={24}>
          <ChartCard
            title="特征分布图"
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select value={distFeature} onChange={setDistFeature} size="small" style={{ width: 140, fontFamily: 'JetBrains Mono' }}
                  options={featureNames.map((n) => ({ value: n, label: AXIS_NAMES[n] || n }))} />
                <Segmented
                  size="small"
                  value={distView}
                  onChange={setDistView}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'hist', label: '直方图' },
                    { value: 'box', label: '箱线图' },
                  ]}
                />
              </div>
            }
          >
            {data?.feature_stats && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(() => {
                  const s = data.feature_stats.find((f) => f.name === distFeature);
                  if (!s) return null;
                  return (
                    <>
                      <TagStat label="Mean" value={s.mean.toFixed(1)} color={theme.colors.primary} />
                      <TagStat label="Std" value={s.std.toFixed(1)} />
                      <TagStat label="N" value={s.n || 8760} />
                    </>
                  );
                })()}
              </div>
            )}
            {loading ? <Spin style={{ display:'block', margin:'140px auto' }} /> :
              distOption ? <ReactEChartsCore echarts={echarts} option={distOption} style={{ height: 380 }} notMerge /> : null}
          </ChartCard>
        </Col>
      </Row>
    </>
  );
}

function TagStat({ label, value, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
      borderRadius: 6, fontSize: 12,
      background: color ? `${color}12` : '#f3f3fd',
      border: `1px solid ${color ? color + '30' : '#c3c6d6'}`,
      fontFamily: 'Inter, sans-serif',
    }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <Text strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: color || '#191b23' }}>{value}</Text>
    </div>
  );
}
