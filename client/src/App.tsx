import { Route, Routes } from 'react-router';
import { Layout } from './app/Layout.js';
import { Home } from './pages/Home.js';
import { MoveOutPage } from './pages/move-out/MoveOutPage.js';
import { NotFound } from './pages/NotFound.js';
import { WorkspaceProvider } from './state/WorkspaceProvider.js';
import type { WorkspaceStorage } from './storage/workspace-storage.js';

/** FRONTEND.md Pages. The router is chosen by the caller, and so is the storage. */
export function App({ storage }: { readonly storage: WorkspaceStorage }) {
  return (
    <WorkspaceProvider storage={storage}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="move-out" element={<MoveOutPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  );
}
