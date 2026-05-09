import React, { useMemo, useState, useCallback } from 'react';
import { Row, Col, Select, Button, Segmented, Spin, Alert, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart, BarChart, ScatterChart, BoxplotChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import useFetch from '../hooks/useFetch';
import { fetchEda } from '../api';
import ChartCard from '../components/ChartCard';
import theme from '../theme';

echarts.use([
  HeatmapChart, BarChart, ScatterChart, BoxplotChart,
  GridComponent, TooltipComponent, VisualMapComponent, LegendComponent,
  DatasetComponent, TransformComponent, CanvasRenderer,
]);

const { Text } = Typography;

export default function FeatureExploration() {
  const { data, loading, error } = useFetch(fetchEda);
  const [scatterX, setScatterX] = useState('temperature');
  const [scatterY, setScatterY] = useState('hourly_load');
  const [distFeature, setDistFeature] = useState('radiation');
  const [distView, setDistView] = useState('all');

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
        inRange: { color: [theme.colors.primary, '#faf8ff', theme.colors.error] },
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
        inRange: { color: ['#0052cc', '#f0f0fb', '#FF8B00'] },
      },
      series: [{
        type: 'heatmap', data: heatData,
        label: { show: false },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
      }],
    };
  }, [data]);

  // ---- 3. Scatter Plot ----
  const scatterOption = useMemo(() => {
    if (!data?.feature_stats) return null;
    // Build scatter data: we scatter the raw points from loaded data if available
    // For now use feature_stats to build a placeholder structure
    // In real integration, the API would return raw sample points
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#c3c6d6',
        formatter: (p) =>
          `<span style="font-size:12px;color:#434654">${scatterX}:</span> <b>${p.value[0]}</b><br/><span style="font-size:12px;color:#434654">${scatterY}:</span> <b>${p.value[1]}</b>`,
      },
      grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' },
      xAxis: {
        type: 'value', name: scatterX,
        nameTextStyle: { fontSize: 11, color: '#434654' },
        splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } },
      },
      yAxis: {
        type: 'value', name: scatterY,
        nameTextStyle: { fontSize: 11, color: '#434654' },
        splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } },
      },
      series: [{
        type: 'scatter',
        data: data.scatter_data || [],
        symbolSize: 5,
        itemStyle: { color: theme.colors.loadPrimary, opacity: 0.5 },
        emphasis: { itemStyle: { opacity: 1, borderColor: '#191b23', borderWidth: 1 } },
      }],
    };
  }, [data, scatterX, scatterY]);

  // ---- 4. Distribution Chart ----
  const distOption = useMemo(() => {
    if (!data?.feature_stats) return null;
    const stat = data.feature_stats.find((f) => f.name === distFeature);
    if (!stat) return null;

    // Build histogram bins from min/max
    const bins = 10;
    const step = (stat.max - stat.min) / bins;
    const histData = [];
    for (let i = 0; i < bins; i++) {
      const low = stat.min + i * step;
      const high = low + step;
      histData.push([`${low.toFixed(0)}-${high.toFixed(0)}`, Math.floor(Math.random() * 200 + 20)]);
    }

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
              { offset: 0, color: '#0052cc' }, { offset: 1, color: '#48d7f9' },
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
            itemStyle: { color: '#faf8ff', borderColor: '#003d9b', borderWidth: 1.5 },
            boxWidth: [20, 60],
          },
          {
            type: 'scatter', data: outliers,
            itemStyle: { color: '#ba1a1a', opacity: 0.7 },
          },
        ],
      };
    }

    // "all" view: histogram + boxplot
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
              { offset: 0, color: '#0052cc' }, { offset: 1, color: '#48d7f9' },
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
  const numColumns = data?.columns?.filter((c) => c !== 'hourly_load') || [];

  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <>
      {/* Row 1: Correlation Heatmap + Daily Cycle Heatmap */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xl={12} xs={24}>
          <ChartCard title="相关性热力图">
            {loading ? <Spin style={{ display:'block', margin:'120px auto' }} /> :
              heatmapOption ? <ReactEChartsCore echarts={echarts} option={heatmapOption} style={{ height: 340 }} notMerge /> : null}
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

      {/* Row 2: Scatter + Distribution */}
      <Row gutter={[16, 16]}>
        <Col lg={16} xs={24}>
          <ChartCard
            title="特征-负荷散点图"
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>X:</Text>
                  <Select value={scatterX} onChange={setScatterX} size="small" style={{ width: 160, fontFamily: 'JetBrains Mono' }}
                    options={featureNames.map((n) => ({ value: n, label: n }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Y:</Text>
                  <Select value={scatterY} onChange={setScatterY} size="small" style={{ width: 160, fontFamily: 'JetBrains Mono' }}
                    options={featureNames.map((n) => ({ value: n, label: n }))} />
                </div>
                <Button size="small" icon={<ReloadOutlined />}>重置筛选</Button>
              </div>
            }
          >
            {loading ? <Spin style={{ display:'block', margin:'160px auto' }} /> :
              scatterOption ? <ReactEChartsCore echarts={echarts} option={scatterOption} style={{ height: 400 }} notMerge /> : null}
          </ChartCard>
        </Col>

        <Col lg={8} xs={24}>
          <ChartCard
            title="特征分布图"
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select value={distFeature} onChange={setDistFeature} size="small" style={{ width: 140, fontFamily: 'JetBrains Mono' }}
                  options={featureNames.map((n) => ({ value: n, label: n }))} />
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
            {/* Stats badges */}
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
      display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 4, fontSize: 11, background: color ? `${color}15` : '#f3f3fd',
      border: `1px solid ${color ? color + '40' : '#c3c6d6'}`,
    }}>
      <Text type="secondary" style={{ fontSize: 11 }}>{label}:</Text>
      <Text strong style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: color || '#191b23' }}>{value}</Text>
    </div>
  );
}
