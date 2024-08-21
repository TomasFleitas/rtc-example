import { Chat } from 'pages';

export const ROUTE = {
  chat: '/',
  test: '/test',
};

export const ROUTES_DATA = [
  {
    path: ROUTE.chat,
    component: <Chat />,
  },
];
