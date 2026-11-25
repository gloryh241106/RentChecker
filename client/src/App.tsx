import { Route, Routes } from 'react-router';
import { ClauseApiContext } from './api/clause-api-context.js';
import type { ClauseApi } from './api/clause-api.js';
import { Layout } from './app/Layout.js';
import { Home } from './pages/Home.js';
import { MoveOutPage } from './pages/move-out/MoveOutPage.js';
import { NotFound } from './pages/NotFound.js';
import { WorkspaceProvider } from './state/WorkspaceProvider.js';
import type { WorkspaceStorage } from './storage/workspace-storage.js';

interface AppProps {
  readonly storage: WorkspaceStorage;
  readonly clauseApi: ClauseApi;
}

/** FRONTEND.md Pages. The caller chooses the router, the storage and the clause API. */
export function App({ storage, clauseApi }: AppProps) {
  return (
    <ClauseApiContext value={clauseApi}>
      <WorkspaceProvider storage={storage}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="move-out" element={<MoveOutPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </WorkspaceProvider>
    </ClauseApiContext>
  );
}
