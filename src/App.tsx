import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ProfileProvider } from '@ui/context/ProfileContext';
import { MainLayout } from '@ui/layouts/MainLayout';
import { Dashboard } from '@ui/pages/Dashboard';
import { Settings } from '@ui/pages/Settings';
import { Debug } from '@ui/pages/Debug';
import { ExerciseMappingPage } from '@ui/pages/ExerciseMappingPage';
import { DefaultMappingsEditor } from '@ui/pages/DefaultMappingsEditor';

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/exercise-mappings" element={<ExerciseMappingPage />} />
            <Route path="/settings/default-mappings" element={<DefaultMappingsEditor />} />
            <Route path="/debug" element={<Debug />} />
          </Route>
        </Routes>
        <Analytics />
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;
