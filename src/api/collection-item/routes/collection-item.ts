export default {
  routes: [
    {
      method: 'GET',
      path: '/collection-items',
      handler: 'collection-item.find',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/collection-items/batch',
      handler: 'collection-item.batchCreate',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/collection-items',
      handler: 'collection-item.create',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/collection-items/:id',
      handler: 'collection-item.delete',
      config: { policies: [], middlewares: [] },
    },
  ],
};
