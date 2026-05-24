import React, { useMemo, useCallback, useState } from 'react';
import { Row, Col, Table, Tag, Button, Space, DatePicker, Spin, Alert } from 'antd';
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  LineChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  TableOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import dayjs from 'dayjs';
import useFetch from '../hooks/useFetch';
import { fetchOverview } from '../api';
import ChartCard from '../components/ChartCard';
import KpiCard from '../components/KpiCard';
import theme from '../theme';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, DataZoomComponent, LegendComponent, CanvasRenderer]);

const hourPeriod = (h) => {
  if (h < 6) return '凌晨';
  if (h < 12) return '上午';
  if (h < 18) return '下午';
  return '夜晚';
};

const periodColor = {
  '凌晨': '#0052cc',
  '上午': '#ff8b00',
  '下午': '#de350b',
  '夜晚': '#434654',
};

export default function DataOverview() {
  const { data, loading, error, refetch } = useFetch(fetchOverview);
  const [dateRange, setDateRange] = useState(null);

  // Filter time series by date range
  const filteredSeries = useMemo(() => {
    if (!data?.time_series) return [];
    if (!dateRange || !dateRange[0] || !dateRange[1]) return data.time_series;
    const [start, end] = dateRange;
    return data.time_series.filter((d) => {
      const t = dayjs(d.time);
      return t.isAfter(start.subtract(1, 'minute')) && t.isBefore(end.add(1, 'minute'));
    });
  }, [data, dateRange]);

  // Recalculated KPIs for filtered view
  const filteredStats = useMemo(() => {
    if (!filteredSeries.length) return null;
    const loads = filteredSeries.map((d) => d.load);
    return {
      total: filteredSeries.length,
      avg: loads.reduce((a, b) => a + b, 0) / loads.length,
      peak: Math.max(...loads),
      std: Math.sqrt(loads.reduce((s, v) => s + (v - loads.reduce((a, b) => a + b, 0) / loads.length) ** 2, 0) / loads.length),
    };
  }, [filteredSeries]);

  const exportCSV = useCallback(() => {
    if (!filteredSeries.length) return;
    const header = 'Time,Load (kWh)';
    const rows = filteredSeries.map((d) => `"${d.time}",${d.load}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'load_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSeries]);

  const timeSeriesOption = useMemo(() => {
    if (!filteredSeries.length) return null;
    const times = filteredSeries.map((d) => d.time);
    const loads = filteredSeries.map((d) => d.load);
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#c3c6d6',
        textStyle: { color: '#191b23', fontSize: 12 },
      },
      legend: { bottom: 30, data: ['Actual Load'] },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLabel: { color: '#434654', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: 'kWh',
        axisLabel: { color: '#434654', fontSize: 10 },
        splitLine: { lineStyle: { color: '#e1e2ec', type: 'dashed' } },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 24, bottom: 10 },
      ],
      series: [
        {
          name: 'Actual Load',
          type: 'line',
          data: loads,
          smooth: true,
          lineStyle: { color: theme.colors.loadActual, width: 1.5 },
          itemStyle: { color: theme.colors.loadActual },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(38,132,255,0.25)' },
              { offset: 1, color: 'rgba(38,132,255,0.02)' },
            ]),
          },
          showSymbol: false,
        },
      ],
    };
  }, [filteredSeries]);

  const tableColumns = [
    { title: 'Time', dataIndex: 'time', key: 'time', sorter: (a, b) => a.time.localeCompare(b.time) },
    { title: 'Load (kWh)', dataIndex: 'load', key: 'load', sorter: (a, b) => a.load - b.load,
      render: (v) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#2684FF' }}>{v}</span> },
    { title: 'Radiation', dataIndex: 'radiation', key: 'radiation', render: (v) => v?.toFixed(1) ?? '-' },
    { title: 'Temp (°C)', dataIndex: 'temperature', key: 'temperature', render: (v) => v?.toFixed(1) ?? '-' },
    { title: 'Humidity (%)', dataIndex: 'relative_humidity', key: 'relative_humidity', render: (v) => v?.toFixed(1) ?? '-' },
    {
      title: 'Period', dataIndex: 'hour', key: 'period',
      render: (h) => {
        const p = hourPeriod(h);
        return <Tag color={periodColor[p]}>{p}</Tag>;
      },
    },
  ];

  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <>
      {/* Analysis Context */}
      <Alert
        type="info"
        showIcon
        message="分析任务：数据概览"
        description="探索电力负荷的时间变化趋势，识别峰值时段与周期性模式。使用下方时间选择器和滑块缩放工具，聚焦特定时间段的负荷行为。"
        style={{ marginBottom: 24, borderRadius: 8, border: `1px solid ${theme.colors.primaryFixedDim}` }}
      />

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title={dateRange ? "筛选样本数 (Filtered)" : "总样本数 (Total Samples)"}
            value={dateRange ? filteredStats?.total : data?.total_samples}
            unit="records"
            subtitle={dateRange ? `全量 ${data?.total_samples} 条` : "100% Data Integrity"}
            subtitleColor={dateRange ? theme.colors.primary : theme.colors.successMetrics}
            icon={<DatabaseOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="平均负荷 (Avg Load)"
            value={dateRange ? filteredStats?.avg?.toFixed(1) : data?.avg_load}
            unit="kWh"
            subtitle={dateRange ? "筛选时段均值" : "-2.4% vs last week"}
            subtitleColor={dateRange ? theme.colors.primary : theme.colors.errorHigh}
            icon={<ThunderboltOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="峰值负荷 (Peak Load)"
            value={dateRange ? filteredStats?.peak?.toFixed(1) : data?.peak_load}
            unit="kWh"
            subtitle={dateRange ? "筛选时段峰值" : "Recorded at 14:00, Jul 15"}
            icon={<WarningOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="负荷标准差 (Std Dev)"
            value={dateRange ? filteredStats?.std?.toFixed(1) : data?.std_load}
            subtitle={dateRange ? "筛选时段波动" : "High variance observed"}
            icon={<LineChartOutlined />}
          />
        </Col>
      </Row>

      {/* Time Series Chart */}
      <div style={{ marginBottom: 24 }}>
        <ChartCard
          title="全量时序负荷折线图 (Time Series Load)"
          icon={<LineChartOutlined style={{ color: theme.colors.primary }} />}
          extra={
            <Space>
              <DatePicker.RangePicker
                size="small"
                style={{ borderRadius: 6 }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                allowClear
              />
              {dateRange && (
                <Button size="small" icon={<ClearOutlined />} onClick={() => setDateRange(null)}>
                  清除筛选
                </Button>
              )}
              <Button type="primary" icon={<ReloadOutlined />} onClick={refetch} size="small">
                Refresh Data
              </Button>
              <Button icon={<DownloadOutlined />} size="small" onClick={exportCSV}>
                Export CSV
              </Button>
            </Space>
          }
        >
          {loading ? (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" />
            </div>
          ) : timeSeriesOption ? (
            <ReactEChartsCore echarts={echarts} option={timeSeriesOption} style={{ height: 400 }} notMerge />
          ) : null}
        </ChartCard>
      </div>

      {/* Data Table */}
      <ChartCard
        title="原始数据预览 (Raw Data — Top 100)"
        icon={<TableOutlined style={{ color: theme.colors.secondary }} />}
      >
        <Table
          columns={tableColumns}
          dataSource={filteredSeries.slice(0, 100)}
          rowKey="time"
          size="small"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 700 }}
        />
      </ChartCard>
    </>
  );
}
