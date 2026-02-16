'use strict';

/**
 * youtube-video service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::youtube-video.youtube-video');
