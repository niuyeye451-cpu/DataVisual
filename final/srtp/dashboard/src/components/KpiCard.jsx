import React from 'react';
import { Card, Typography, Spin } from 'antd';

const { Text } = Typography;

/**
 * Glass-morphism KPI card matching the Stitch design.
 */
export default function KpiCard({ title, value, unit, subtitle, subtitleColor, icon }) {
  return (
    <Card
      style={{
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #DFE1E6',
        height: '100%',
      }}
      styles={{ body: { padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <Text type="secondary" style={{ fontWeight: 500 }}>
          {title}
        </Text>
        <div
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: '#f3f3fd',
            color: '#003d9b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        {value != null ? (
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#191b23',
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
            {unit && (
              <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 400, color: '#737685' }}>
                {unit}
              </span>
            )}
          </div>
        ) : (
          <Spin size="small" />
        )}

        {subtitle && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: 500,
              color: subtitleColor || '#434654',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
}
