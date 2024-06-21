import { Home, Media } from 'pages';

export const ROUTE = {
  home: '/:id',
  media: '/media/:id',
};

export const ROUTES_DATA = [
  {
    path: ROUTE.home,
    component: <Home />,
  },
  {
    path: ROUTE.media,
    component: <Media />,
  },
];
