import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './core/contexts/AuthContext'
import { Provider } from 'react-redux'
import store from './core/redux/store'
import { BrowserRouter } from 'react-router-dom'
import ALLRoutes from './feature-module/router/router'
import { base_path } from './environment'
import './assets/css/bootstrap.min.css'
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
// import '@tabler/icons-webfont/dist/tabler-icons.css'
import './assets/fonts/tabler-icons/tabler-icons.css'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/css/iconsax.css'
import './index.scss';
import './firebase';



createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter basename={base_path}>
          <ALLRoutes />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
)
