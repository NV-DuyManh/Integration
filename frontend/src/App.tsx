import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Default redirect */}
          <Route index element={<Navigate to="/employee360" replace />} />

          {/* Placeholder pages — will be replaced by real components later */}
          <Route
            path="/employee360"
            element={
              <div className="p-10 glow-text text-3xl font-bold">
                Employee 360 — coming soon
              </div>
            }
          />
          <Route
            path="/dashboard"
            element={
              <div className="p-10 glow-text text-3xl font-bold">
                Dashboard — coming soon
              </div>
            }
          />
          <Route
            path="/reconciliation"
            element={
              <div className="p-10 glow-text text-3xl font-bold">
                Reconciliation — coming soon
              </div>
            }
          />
          <Route
            path="/reports"
            element={
              <div className="p-10 glow-text text-3xl font-bold">
                Reports — coming soon
              </div>
            }
          />
          <Route
            path="/management"
            element={
              <div className="p-10 glow-text text-3xl font-bold">
                Data Management — coming soon
              </div>
            }
          />
          <Route
            path="/api-explorer"
            element={
              <div className="p-10 glow-text text-3xl font-bold">
                API Explorer — coming soon
              </div>
            }
          />
          <Route
            path="/settings"
            element={
              <div className="p-10 glow-text text-3xl font-bold">
                Settings — coming soon
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}