import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import AppRouter from './routes';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
            },
          }}
        >
          <AntApp>
            <BrowserRouter>
              <NotificationProvider>
                <AppRouter />
              </NotificationProvider>
            </BrowserRouter>
          </AntApp>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App; 