import { Route, Routes } from 'react-router';
import { AssistantApiContext } from './api/assistant-api-context.js';
import type { AssistantApi } from './api/assistant-api.js';
import { ClauseApiContext } from './api/clause-api-context.js';
import type { ClauseApi } from './api/clause-api.js';
import { Layout } from './app/Layout.js';
import { AskPage } from './pages/ask/AskPage.js';
import { Home } from './pages/Home.js';
import { MoveOutPage } from './pages/move-out/MoveOutPage.js';
import { NotFound } from './pages/NotFound.js';
import { ReviewPage } from './pages/review/ReviewPage.js';
import { TenancyPage } from './pages/tenancy/TenancyPage.js';
import { WorkspaceProvider } from './state/WorkspaceProvider.js';
import type { WorkspaceStorage } from './storage/workspace-storage.js';

interface AppProps {
  readonly storage: WorkspaceStorage;
  readonly clauseApi: ClauseApi;
  readonly assistantApi: AssistantApi;
}

/** FRONTEND.md Pages. The caller chooses the router, the storage and the APIs. */
export function App({ storage, clauseApi, assistantApi }: AppProps) {
  return (
    <ClauseApiContext value={clauseApi}>
      <AssistantApiContext value={assistantApi}>
        <WorkspaceProvider storage={storage}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="move-out" element={<MoveOutPage />} />
              <Route path="lease-review" element={<ReviewPage />} />
              <Route path="ask" element={<AskPage />} />
              <Route path="tenancy" element={<TenancyPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </WorkspaceProvider>
      </AssistantApiContext>
    </ClauseApiContext>
  );
}
