import { factories } from '@strapi/strapi';

const SET_POPULATE = {
  set: { fields: ['documentId', 'setNumber', 'name', 'slug'] },
} as any;

export default factories.createCoreController('api::collection-item.collection-item', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const entries = await strapi.documents('api::collection-item.collection-item').findMany({
      filters: { user: { documentId: user.documentId } },
      populate: SET_POPULATE,
      sort: { createdAt: 'desc' },
      limit: 100,
    });

    return { data: entries };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const body = ctx.request.body as any;
    const data = body?.data || {};

    const entry = await strapi.documents('api::collection-item.collection-item').create({
      data: { ...data, user: user.documentId },
      populate: SET_POPULATE,
    });

    return { data: entry };
  },

  async batchCreate(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const body = ctx.request.body as any;
    const items = body?.data || [];

    if (!Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('No items provided');
    }
    if (items.length > 200) {
      return ctx.badRequest('Maximum 200 items per batch');
    }

    const results = [];
    for (const item of items) {
      try {
        const entry = await strapi.documents('api::collection-item.collection-item').create({
          data: { ...item, user: user.documentId },
          populate: SET_POPULATE,
        });
        results.push({ success: true, data: entry });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    return { data: results };
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

    await strapi.documents('api::collection-item.collection-item').delete({ documentId: id });
    return { data: { documentId: id } };
  },
}));
