import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::price-alert.price-alert', ({ strapi }) => ({
  // GET /price-alerts — nur eigene Alerts
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    ctx.query = {
      ...ctx.query,
      filters: {
        ...(ctx.query.filters as any || {}),
        user: user.id,
      },
    };

    return await super.find(ctx);
  },

  // POST /price-alerts — user automatisch setzen
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const body = ctx.request.body as any;
    if (!body.data) body.data = {};
    body.data.user = user.id;

    return await super.create(ctx);
  },

  // PUT /price-alerts/:id — nur eigene
  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const entry = await strapi.documents('api::price-alert.price-alert').findOne({
      documentId: id,
      populate: ['user'],
    });

    if (!entry || (entry as any).user?.id !== user.id) {
      return ctx.forbidden('You can only update your own alerts');
    }

    return await super.update(ctx);
  },

  // DELETE /price-alerts/:id — nur eigene
  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const entry = await strapi.documents('api::price-alert.price-alert').findOne({
      documentId: id,
      populate: ['user'],
    });

    if (!entry || (entry as any).user?.id !== user.id) {
      return ctx.forbidden('You can only delete your own alerts');
    }

    return await super.delete(ctx);
  },
}));
