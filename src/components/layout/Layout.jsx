import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="app-main">
      <div className="app-content">
        {children}
      </div>
    </main>
  </div>
);

export default Layout;
