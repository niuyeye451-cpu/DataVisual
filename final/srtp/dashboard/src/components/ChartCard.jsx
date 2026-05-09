import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

/**
 * Reusable chart wrapper card.
 * Provides title bar, optional action area, and a content slot for ECharts.
 */
export default function ChartCard({ title, icon, extra, children, style, bodyStyle }) {
  return (
    <Card
      style={{
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #DFE1E6',
        height: '100%',
        ...style,
      }}
      bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', ...bodyStyle }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #c3c6d6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#faf8ff',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <Text
          strong
          style={{
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: 18,
            fontWeight: 600,
            color: '#191b23',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {icon}
          {title}
        </Text>
        {extra && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{extra}</div>}
      </div>

      {/* Chart content */}
      <div style={{ flex: 1, padding: 20, minHeight: 0 }}>{children}</div>
    </Card>
  );
}
