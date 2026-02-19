import { factories } from '@strapi/strapi';

const SET_POPULATE = {
  set: { fields: ['documentId', 'setNumber', 'name', 'slug'], populate: { images: { fields: ['url', 'formats'] } } },
} as any;

export default factories.createCoreController('api::price-alert.price-alert', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const entries = await strapi.documents('api::price-alert.price-alert').findMany({
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

    const entry = await strapi.documents('api::price-alert.price-alert').create({
      data: { ...data, user: user.documentId },
      populate: SET_POPULATE,
    });

    return { data: entry };
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const existing = await strapi.documents('api::price-alert.price-alert').findOne({
      documentId: id,
      populate: ['user'],
    });

    if (!existing || (existing as any).user?.documentId !== user.documentId) {
      return ctx.forbidden('You can only update your own alerts');
    }

    const body = ctx.request.body as any;
    const data = body?.data || {};

    const entry = await strapi.documents('api::price-alert.price-alert').update({
      documentId: id,
      data,
      populate: SET_POPULATE,
    });

    return { data: entry };
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const entry = await strapi.documents('api::price-alert.price-alert').findOne({
      documentId: id,
      populate: ['user'],
    });

    if (!entry || (entry as any).user?.documentId !== user.documentId) {
      return ctx.forbidden('You can only delete your own alerts');
    }

    await strapi.documents('api::price-alert.price-alert').delete({ documentId: id });
    return { data: { documentId: id } };
  },
}));
