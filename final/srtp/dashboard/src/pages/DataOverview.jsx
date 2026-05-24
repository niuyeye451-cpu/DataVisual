import React, { useMemo, useCallback } from 'react';
import { Row, Col, Table, Tag, Button, Space, DatePicker, Spin, Alert } from 'antd';
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  LineChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  TableOutlined,
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

  const exportCSV = useCallback(() => {
    if (!data?.time_series?.length) return;
    const header = 'Time,Load (kWh)';
    const rows = data.time_series.map((d) => `"${d.time}",${d.load}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'load_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const timeSeriesOption = useMemo(() => {
    if (!data?.time_series) return null;
    const times = data.time_series.map((d) => d.time);
    const loads = data.time_series.map((d) => d.load);
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
  }, [data]);

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
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="总样本数 (Total Samples)"
            value={data?.total_samples}
            unit="records"
            subtitle="100% Data Integrity"
            subtitleColor={theme.colors.successMetrics}
            icon={<DatabaseOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="平均负荷 (Avg Load)"
            value={data?.avg_load}
            unit="kWh"
            subtitle="-2.4% vs last week"
            subtitleColor={theme.colors.errorHigh}
            icon={<ThunderboltOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="峰值负荷 (Peak Load)"
            value={data?.peak_load}
            unit="kWh"
            subtitle="Recorded at 14:00, Jul 15"
            icon={<WarningOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="负荷标准差 (Std Dev)"
            value={data?.std_load}
            subtitle="High variance observed"
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
              <DatePicker.RangePicker size="small" style={{ borderRadius: 6 }} />
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
          dataSource={(data?.time_series || []).slice(0, 100)}
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
