import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import { SettingsProvider } from './context/SettingsContext';
import theme from './theme';
import './styles/global.css';

// Map our design tokens into Ant Design 5 theme
const antdTheme = {
  token: {
    colorPrimary: theme.colors.primary,
    colorBgContainer: theme.colors.surfaceContainerLowest,
    colorBgLayout: theme.colors.neutralSurface,
    fontFamily: theme.typography.bodyBase.fontFamily,
    fontSize: theme.typography.bodyBase.fontSize,
    borderRadius: theme.borderRadius.DEFAULT,
    colorText: theme.colors.onSurface,
    colorTextSecondary: theme.colors.onSurfaceVariant,
    colorBorder: theme.colors.outlineVariant,
    colorBorderSecondary: theme.colors.outlineVariant,
  },
  components: {
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: theme.colors.primaryFixed,
      itemSelectedColor: theme.colors.primary,
      itemHoverBg: theme.colors.surfaceContainerHigh,
      itemHoverColor: theme.colors.primary,
    },
    Card: {
      paddingLG: theme.spacing.cardPadding,
    },
    Layout: {
      siderBg: theme.colors.surfaceContainerLow,
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={antdTheme}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ConfigProvider>
  </React.StrictMode>
);
