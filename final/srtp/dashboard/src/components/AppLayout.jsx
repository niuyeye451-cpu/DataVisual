import React from 'react';
import { Layout, Menu, Avatar, Typography, Input } from 'antd';
import {
  DashboardOutlined,
  FundOutlined,
  BarChartOutlined,
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const iconMap = {
  dashboard: <DashboardOutlined />,
  analytics: <FundOutlined />,
  query_stats: <BarChartOutlined />,
};

export default function AppLayout({ tabs, activeTab, onTabChange, pageTitle, children }) {
  const menuItems = tabs.map((t) => ({
    key: t.key,
    icon: iconMap[t.icon] || <DashboardOutlined />,
    label: t.label,
  }));

  return (
    <Layout style={{ height: '100vh' }}>
      {/* -- SideNavBar -- */}
      <Sider
        width={240}
        style={{
          background: '#f3f3fd',
          borderRight: '1px solid #c3c6d6',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ padding: '24px 16px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#003d9b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
                fontFamily: 'IBM Plex Sans, sans-serif',
              }}
            >
              G
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 18, color: '#003d9b', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                Grid Analytics
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Load Forecast v2.1
              </Text>
            </div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={({ key }) => onTabChange(key)}
          items={menuItems}
          style={{
            flex: 1,
            background: 'transparent',
            borderRight: 'none',
            padding: '0 16px',
          }}
        />

        {/* User profile at bottom */}
        <div style={{ padding: '16px', borderTop: '1px solid #c3c6d6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              size={32}
              style={{ backgroundColor: '#e1e2ec', border: '1px solid #c3c6d6' }}
            >
              A
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Analyst 01</div>
              <Text type="secondary" style={{ fontSize: 12 }}>Admin</Text>
            </div>
          </div>
        </div>
      </Sider>

      {/* -- Main area -- */}
      <Layout style={{ marginLeft: 240 }}>
        {/* -- TopAppBar -- */}
        <Header
          style={{
            background: '#faf8ff',
            borderBottom: '1px solid #c3c6d6',
            height: 64,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <h2
            style={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: 24,
              fontWeight: 600,
              margin: 0,
              color: '#191b23',
            }}
          >
            电力负荷预测可视化分析
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#737685' }} />}
              placeholder="Search data..."
              style={{
                width: 256,
                borderRadius: 20,
                backgroundColor: '#f3f3fd',
                border: '1px solid #c3c6d6',
              }}
            />
            <BellOutlined style={{ fontSize: 20, color: '#434654', cursor: 'pointer' }} />
            <SettingOutlined style={{ fontSize: 20, color: '#434654', cursor: 'pointer' }} />
            <QuestionCircleOutlined style={{ fontSize: 20, color: '#434654', cursor: 'pointer' }} />
          </div>
        </Header>

        {/* -- Content -- */}
        <Content
          style={{
            padding: 24,
            background: '#F4F5F7',
            minHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          {/* Breadcrumb */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Dashboard</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>/</Text>
            <Text strong style={{ fontSize: 12, color: '#003d9b' }}>{pageTitle}</Text>
          </div>

          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
