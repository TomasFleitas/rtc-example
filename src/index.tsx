import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { Routers } from './routers';
import './index.scss';

const root = document.getElementById('root');

if (!root) throw new Error('Not Found root div');

createRoot(root).render(
  <StrictMode>
    <Routers />
  </StrictMode>,
);
