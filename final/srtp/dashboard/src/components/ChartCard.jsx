import React, { useState, useRef } from 'react';
import { Card, Typography, Modal, Button } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ChartCard({ title, icon, extra, children, style, bodyStyle, chartHeight }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const openFullscreen = () => {
    setModalKey((k) => k + 1);
    setFullscreen(true);
  };

  const fullscreenBtn = (
    <div
      onClick={openFullscreen}
      title="全屏显示"
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#737685',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#003d9b';
        e.currentTarget.style.background = '#e7e7f2';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#737685';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <FullscreenOutlined style={{ fontSize: 16 }} />
    </div>
  );

  return (
    <>
      <Card
        style={{
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #DFE1E6',
          height: '100%',
          ...style,
        }}
        styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', ...bodyStyle } }}
      >
        {/* Title bar with left accent border */}
        <div
          style={{
            padding: '16px 20px 16px 17px',
            borderBottom: '1px solid #c3c6d6',
            borderLeft: '3px solid #0052cc',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {extra && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{extra}</div>}
            {fullscreenBtn}
          </div>
        </div>

        {/* Chart content */}
        <div style={{ flex: 1, padding: 20, minHeight: 0 }}>{children}</div>
      </Card>

      <Modal
        key={modalKey}
        open={fullscreen}
        onCancel={() => setFullscreen(false)}
        footer={null}
        width="96vw"
        style={{ top: 16, maxWidth: 'none' }}
        styles={{
          body: { padding: 0, height: 'calc(96vh - 72px)', display: 'flex', flexDirection: 'column' },
          content: { borderRadius: 12, overflow: 'hidden' },
        }}
        destroyOnHidden
      >
        {/* Fullscreen header */}
        <div
          style={{
            padding: '14px 24px 14px 21px',
            borderBottom: '1px solid #c3c6d6',
            borderLeft: '3px solid #0052cc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#faf8ff',
            flexShrink: 0,
          }}
        >
          <Text strong style={{ fontFamily: 'IBM Plex Sans', fontSize: 20, fontWeight: 600, color: '#191b23', display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon}
            {title}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {extra && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{extra}</div>}
            <div
              onClick={() => setFullscreen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#434654',
                cursor: 'pointer',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 13,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#003d9b';
                e.currentTarget.style.background = '#e7e7f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#434654';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <FullscreenExitOutlined style={{ fontSize: 15 }} />
              退出全屏
            </div>
          </div>
        </div>

        {/* Fullscreen chart — override children heights to fill available space */}
        <div style={{ flex: 1, padding: 24, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            return React.cloneElement(child, {
              style: {
                ...(child.props.style || {}),
                height: '100%',
                width: '100%',
              },
            });
          })}
        </div>
      </Modal>
    </>
  );
}
