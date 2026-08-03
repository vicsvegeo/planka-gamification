/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * Badge.js
 *
 * @description :: Catalog of badges that can be unlocked. Unlock rule logic lives in code
 *                 (see api/utils/badges.js); this table just gives unlocks a stable identity.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'badge',

  attributes: {
    slug: {
      type: 'string',
      required: true,
      unique: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      allowNull: true,
    },
    icon: {
      type: 'string',
      allowNull: true,
    },
  },
};
