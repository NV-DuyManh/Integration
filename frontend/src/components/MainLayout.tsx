import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * MainLayout — dashboard shell.
 *
 * Reproduces the exact grid that the old vanilla TS `render()` function built:
 *   <div class="app-layout">
 *     <Sidebar />
 *     <div class="main-content">
 *       <Header />
 *       <main class="content-area"> … page … </main>
 *     </div>
 *   </div>
 */
export default function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Header />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
