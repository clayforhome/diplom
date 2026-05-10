import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './router';
import { GlobalLoader } from './components/ui/GlobalLoader/GlobalLoader';
import { configureHttpClientActivityHandlers } from './http/httpClient';
import { beginRequest, endRequest } from './store/slices/uiSlice';
import './styles/global.scss';

configureHttpClientActivityHandlers({
  onRequestStart: () => store.dispatch(beginRequest()),
  onRequestEnd: () => store.dispatch(endRequest())
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <GlobalLoader />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
