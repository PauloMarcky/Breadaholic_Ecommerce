// pages/adminPages/ProductManager.jsx
import '../../admin-index.css';
import { SidebarAdmin } from '../../components/SidebarAdmin';
import SalesReportBody from '../../components/SalesReportComponents/SalesReportBody';

export function SalesReport() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SidebarAdmin />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg)',
          minHeight: '100vh'
        }}
      >
        <SalesReportBody />
      </main>
    </div>
  );
}