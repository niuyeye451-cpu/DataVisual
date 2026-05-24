import React, { useState } from 'react';
import { Drawer, Typography, Divider, Tabs, Table, Tag } from 'antd';
import {
  QuestionCircleOutlined,
  NodeIndexOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

const FEATURE_COLUMNS = [
  { key: 'radiation', name: '辐射强度', unit: 'W/m²', desc: '地表太阳辐射强度' },
  { key: 'temperature', name: '温度', unit: '°C', desc: '逐时气温' },
  { key: 'relative_humidity', name: '相对湿度', unit: '%', desc: '空气相对湿度百分比' },
  { key: 'L_h_minus_24', name: 'L(h-24)', unit: 'kWh', desc: '24小时前同时刻负荷' },
  { key: 'L_h_minus_1', name: 'L(h-1)', unit: 'kWh', desc: '1小时前负荷（最强预测因子）' },
  { key: 'T_h_minus_1', name: 'T(h-1)', unit: '°C', desc: '1小时前温度' },
  { key: 'hourly_load', name: '逐时负荷', unit: 'kWh', desc: '预测目标变量' },
];

const METRIC_COLUMNS = [
  { key: 'r2', name: 'R²', desc: '决定系数，越接近1越好，反映模型解释力', range: '(-∞, 1]', good: '>0.85' },
  { key: 'mae', name: 'MAE', desc: '平均绝对误差，单位与目标一致，越小越好', range: '[0, +∞)', good: '<30' },
  { key: 'rmse', name: 'RMSE', desc: '均方根误差，对大误差更敏感，越小越好', range: '[0, +∞)', good: '<50' },
  { key: 'mape', name: 'MAPE', desc: '平均绝对百分比误差，便于跨量纲比较', range: '[0%, +∞)', good: '<10%' },
];

const MODEL_COLUMNS = [
  { key: 'mlp', name: 'MLP', desc: '多层感知机分类器，判断负荷是否超过阈值(300 kWh)' },
  { key: 'rf', name: 'RandomForest', desc: '随机森林回归器，对高负荷样本进行精确预测' },
  { key: 'mlp_rf', name: 'MLP+RF 混合', desc: '先MLP分类，低负荷→0，高负荷→RF回归，综合准确率最高' },
  { key: 'dt', name: 'DecisionTree', desc: '决策树回归器，作为基线对比模型' },
];

const tabItems = [
  {
    key: 'flow',
    label: (
      <span>
        <NodeIndexOutlined /> 算法流程
      </span>
    ),
    children: (
      <div style={{ padding: '16px 0' }}>
        <Paragraph>
          本系统采用<Text strong> MLP + 随机森林混合模型</Text>进行电力负荷预测，算法流程如下：
        </Paragraph>

        <div
          style={{
            background: '#f3f3fd',
            borderRadius: 8,
            padding: 16,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            lineHeight: 1.8,
            marginBottom: 16,
          }}
        >
          <div style={{ textAlign: 'center', fontWeight: 600, marginBottom: 8, color: '#003d9b' }}>
            Mermaid 流程图
          </div>
          <div style={{ color: '#434654' }}>
            数据加载 → 数据预处理 → 阈值分类(300kWh)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;→ 数据集划分(80/20)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;→ MLP分类模型训练
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ 分类为0 → 预测输出为0
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ 分类不为0 → 随机森林模型训练 → 模型预测 → 输出预测值
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;→ 模型综合评估 → 结果可视化
          </div>
        </div>

        <Paragraph type="secondary" style={{ fontSize: 12 }}>
          核心思路：MLP 先判断负荷高低，低负荷直接归零，高负荷交给随机森林精确预测。
          这种混合策略结合了深度学习的分类能力和传统机器学习的回归能力。
        </Paragraph>
      </div>
    ),
  },
  {
    key: 'features',
    label: (
      <span>
        <InfoCircleOutlined /> 特征说明
      </span>
    ),
    children: (
      <div style={{ padding: '16px 0' }}>
        <Table
          dataSource={FEATURE_COLUMNS}
          columns={[
            { title: '变量名', dataIndex: 'name', key: 'name', render: (t, r) => <Text code>{r.key}</Text> },
            { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
            { title: '说明', dataIndex: 'desc', key: 'desc' },
          ]}
          rowKey="key"
          size="small"
          pagination={false}
          style={{ marginBottom: 16 }}
        />
        <Paragraph type="secondary" style={{ fontSize: 12 }}>
          目标变量 <Text code>hourly_load</Text>（逐时负荷/kWh）为预测对象，其余 6 个特征为输入变量。
          其中 <Text strong>L(h-1)</Text> 是特征重要性最高的预测因子。
        </Paragraph>
      </div>
    ),
  },
  {
    key: 'metrics',
    label: (
      <span>
        <BarChartOutlined /> 指标说明
      </span>
    ),
    children: (
      <div style={{ padding: '16px 0' }}>
        <Table
          dataSource={METRIC_COLUMNS}
          columns={[
            { title: '指标', dataIndex: 'name', key: 'name', width: 60 },
            { title: '含义', dataIndex: 'desc', key: 'desc' },
            { title: '取值范围', dataIndex: 'range', key: 'range', width: 80 },
            { title: '优秀值', dataIndex: 'good', key: 'good', width: 70, render: (t) => <Tag color="success">{t}</Tag> },
          ]}
          rowKey="key"
          size="small"
          pagination={false}
          style={{ marginBottom: 16 }}
        />
        <Divider />
        <Paragraph type="secondary" style={{ fontSize: 12 }}>
          「模型分析」页面可切换不同模型查看各自的指标表现，帮助选择最适合的预测方案。
        </Paragraph>
      </div>
    ),
  },
];

export default function HelpDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#434654',
          transition: 'all 0.2s',
        }}
        className="header-icon-btn"
        onClick={() => setOpen(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#003d9b';
          e.currentTarget.style.background = '#e7e7f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#434654';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <QuestionCircleOutlined style={{ fontSize: 20 }} />
      </div>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QuestionCircleOutlined style={{ color: '#003d9b' }} />
            <span>帮助文档</span>
          </div>
        }
        placement="right"
        width={520}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ marginBottom: 4 }}>
            电力负荷预测可视化分析
          </Title>
          <Text type="secondary">Load Forecast Dashboard — 帮助文档</Text>
        </div>

        <Tabs items={tabItems} defaultActiveKey="flow" />
      </Drawer>
    </>
  );
}
