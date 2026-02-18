import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::collection-item.collection-item', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    ctx.query = {
      ...ctx.query,
      filters: {
        ...(ctx.query.filters as any || {}),
        user: { documentId: user.documentId },
      },
    };

    return await super.find(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const body = ctx.request.body as any;
    if (!body.data) body.data = {};
    body.data.user = user.documentId;

    return await super.create(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const entry = await strapi.documents('api::collection-item.collection-item').findOne({
      documentId: id,
      populate: ['user'],
    });

    if (!entry || (entry as any).user?.documentId !== user.documentId) {
      return ctx.forbidden('You can only delete your own items');
    }

    return await super.delete(ctx);
  },
}));
