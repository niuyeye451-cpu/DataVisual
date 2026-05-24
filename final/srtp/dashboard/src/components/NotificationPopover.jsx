import React, { useState, useEffect } from 'react';
import { Popover, Button, Typography, Tag, Space, Badge } from 'antd';
import {
  BellOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useSettings } from '../context/SettingsContext';

const { Text, Title } = Typography;

export default function NotificationPopover({ onRefresh }) {
  const { lastRefresh } = useSettings();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!lastRefresh) return;
    setRefreshing(false);
    const timer = setTimeout(() => setRefreshing(false), 500);
    return () => clearTimeout(timer);
  }, [lastRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (onRefresh) onRefresh();
  };

  const formatTime = (ts) => {
    if (!ts) return '--';
    return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const content = (
    <div style={{ width: 260 }}>
      <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
        系统通知
      </Title>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CheckCircleOutlined style={{ color: '#36B37E' }} />
          <Text>数据加载完成</Text>
          <Tag color="success" style={{ marginLeft: 'auto', fontSize: 11 }}>OK</Tag>
        </div>
        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 24 }}>
          4 个模型已就绪 (MLP, RF, MLP+RF, DT)
        </Text>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ClockCircleOutlined style={{ color: '#FF8B00' }} />
          <Text>上次刷新</Text>
          <Text strong style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
            {formatTime(lastRefresh)}
          </Text>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <SyncOutlined style={{ color: '#0052CC' }} spin={refreshing} />
          <Text>模型状态</Text>
          <Tag icon={<CheckCircleOutlined />} color="processing" style={{ marginLeft: 'auto', fontSize: 11 }}>
            正常运行
          </Tag>
        </div>
      </div>

      <Button
        type="primary"
        block
        icon={<ReloadOutlined spin={refreshing} />}
        onClick={handleRefresh}
        loading={refreshing}
      >
        刷新全部数据
      </Button>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      title={null}
    >
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
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#003d9b';
          e.currentTarget.style.background = '#e7e7f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#434654';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Badge dot status="processing" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </div>
    </Popover>
  );
}
