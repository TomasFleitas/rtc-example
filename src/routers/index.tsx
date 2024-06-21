import { memo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ROUTES_DATA } from './routeData';

export const Routers = memo(() => {
  return (
    <Router>
      <Routes>
        {ROUTES_DATA.map((route) => (
          <Route key={route.path} path={route.path} element={route.component} />
        ))}
        <Route key="not-found" path="*" element={<>NOT FOUND</>} />
      </Routes>
    </Router>
  );
});
