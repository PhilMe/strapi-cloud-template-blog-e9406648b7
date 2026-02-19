import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async me(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const fullUser = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { id: user.id },
        populate: ['avatar'],
      });

    return {
      id: fullUser.id,
      documentId: fullUser.documentId,
      username: fullUser.username,
      email: fullUser.email,
      slogan: fullUser.slogan || null,
      avatar: fullUser.avatar || null,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    };
  },

  async updateMe(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { slogan, avatar } = ctx.request.body as any;

    const updateData: Record<string, any> = {};
    if (slogan !== undefined) updateData.slogan = slogan;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updated = await strapi.db
      .query('plugin::users-permissions.user')
      .update({
        where: { id: user.id },
        data: updateData,
        populate: ['avatar'],
      });

    return {
      id: updated.id,
      documentId: updated.documentId,
      username: updated.username,
      email: updated.email,
      slogan: updated.slogan || null,
      avatar: updated.avatar || null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },
});
