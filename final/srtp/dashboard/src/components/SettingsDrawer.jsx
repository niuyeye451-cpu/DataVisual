import React, { useState } from 'react';
import { Drawer, Select, Slider, Typography, Divider, Button, Tag, Space, InputNumber } from 'antd';
import { SettingOutlined, ExportOutlined, SaveOutlined } from '@ant-design/icons';
import { useSettings } from '../context/SettingsContext';

const { Text, Title, Paragraph } = Typography;

const MODEL_OPTIONS = [
  { value: 'mlp_rf', label: 'MLP + RandomForest (推荐)' },
  { value: 'rf', label: 'RandomForest' },
  { value: 'mlp', label: 'MLP' },
  { value: 'dt', label: 'DecisionTree' },
];

export default function SettingsDrawer() {
  const { defaultModel, setDefaultModel, threshold, setThreshold } = useSettings();
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
        <SettingOutlined style={{ fontSize: 20 }} />
      </div>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ color: '#003d9b' }} />
            <span>仪表盘设置</span>
          </div>
        }
        placement="right"
        width={380}
        open={open}
        onClose={() => setOpen(false)}
      >
        {/* ---- Model Selection ---- */}
        <Title level={5} style={{ marginBottom: 8 }}>
          默认预测模型
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          切换后将应用于「模型分析」页面的误差分析和指标对比
        </Paragraph>
        <Select
          value={defaultModel}
          onChange={setDefaultModel}
          options={MODEL_OPTIONS}
          style={{ width: '100%', marginBottom: 24 }}
        />

        <Divider />

        {/* ---- Load Threshold ---- */}
        <Title level={5} style={{ marginBottom: 8 }}>
          负荷分类阈值
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          用于 MLP 分类器的高低负荷判定边界。当前阈值：<Tag>{threshold} kWh</Tag>
        </Paragraph>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>低负荷区</Text>
          <Slider
            style={{ flex: 1 }}
            min={100}
            max={800}
            step={10}
            value={threshold}
            onChange={setThreshold}
            trackStyle={{ background: threshold <= 300 ? '#36B37E' : '#FF8B00' }}
          />
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>高负荷区</Text>
        </div>
        <div style={{ textAlign: 'center', marginTop: 4, marginBottom: 24 }}>
          <InputNumber
            size="small"
            min={100}
            max={800}
            step={10}
            value={threshold}
            onChange={(v) => setThreshold(v || 300)}
            style={{ width: 100 }}
            addonAfter="kWh"
          />
        </div>

        <Divider />

        {/* ---- Model Architecture Info ---- */}
        <Title level={5} style={{ marginBottom: 12 }}>
          模型架构
        </Title>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Tag color="blue" style={{ fontSize: 12, padding: '4px 8px' }}>
            MLP: 多层感知机 (2隐藏层: 20→8) — 高低负荷分类
          </Tag>
          <Tag color="green" style={{ fontSize: 12, padding: '4px 8px' }}>
            RandomForest: 随机森林 (48棵树, max_depth=17) — 高负荷回归
          </Tag>
          <Tag color="purple" style={{ fontSize: 12, padding: '4px 8px' }}>
            MLP+RF 混合: MLP 先分类→高负荷用 RF 预测, 低负荷输出 0
          </Tag>
          <Tag color="orange" style={{ fontSize: 12, padding: '4px 8px' }}>
            DecisionTree: 决策树回归 (baseline 对比)
          </Tag>
        </Space>

        <Divider />

        {/* ---- Data Source ---- */}
        <Title level={5} style={{ marginBottom: 8 }}>
          数据源信息
        </Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            原始数据：负荷预测数据4attention.xlsx
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            特征维度：辐射强度、温度、相对湿度、L(h-24)、L(h-1)、T(h-1)
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            样本总量：11,664 条小时级记录
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            时间范围：2018年7月
          </Text>
        </Space>
      </Drawer>
    </>
  );
}
