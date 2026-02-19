export default {
  routes: [
    {
      method: 'GET',
      path: '/user-profile/me',
      handler: 'user-profile.me',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/user-profile/me',
      handler: 'user-profile.updateMe',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
