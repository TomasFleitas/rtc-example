import { Chat } from 'pages';
import Counter from 'pages/test';

export const ROUTE = {
  chat: '/',
  chatSecure: '/:secureCode',
  test: '/test',
};

export const ROUTES_DATA = [
  {
    path: ROUTE.chat,
    component: <Chat />,
  },
  {
    path: ROUTE.chatSecure,
    component: <Chat />,
  },
  {
    path: ROUTE.test,
    component: <Counter />,
  },
];
