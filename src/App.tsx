import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileProvider } from '@ui/context/ProfileContext';
import { MainLayout } from '@ui/layouts/MainLayout';
import { Dashboard } from '@ui/pages/Dashboard';
import { Settings } from '@ui/pages/Settings';
import { Debug } from '@ui/pages/Debug';

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/debug" element={<Debug />} />
          </Route>
        </Routes>
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;
