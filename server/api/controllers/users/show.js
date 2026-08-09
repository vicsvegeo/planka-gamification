/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user details
 *     description: Retrieves a user. Use 'me' as ID to get the current user.
 *     tags:
 *       - Users
 *     operationId: getUser
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user or 'me' for current user
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *       - name: subscribe
 *         in: query
 *         required: false
 *         description: Whether to subscribe to real-time updates for this user (only for socket connections)
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: timezone
 *         in: query
 *         required: false
 *         description: IANA timezone reported by the client, stored as the current user's last-known timezone if changed
 *         schema:
 *           type: string
 *           example: America/New_York
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *                 - included
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/User'
 *                 included:
 *                   type: object
 *                   required:
 *                     - notificationServices
 *                   properties:
 *                     notificationServices:
 *                       type: array
 *                       description: Related notification services (for current user)
 *                       items:
 *                         $ref: '#/components/schemas/NotificationService'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { ID_REGEX, MAX_STRING_ID, isIdInRange, isTimezone } = require('../../../utils/validators');

const Errors = {
  USER_NOT_FOUND: {
    userNotFound: 'User not found',
  },
};

const CURRENT_USER_ID = 'me';

const ID_OR_CURRENT_USER_ID_REGEX = new RegExp(`${ID_REGEX.source}|^${CURRENT_USER_ID}$`);

const isCurrentUserIdOrIdInRange = (value) => value === CURRENT_USER_ID || isIdInRange(value);

module.exports = {
  inputs: {
    id: {
      type: 'string',
      maxLength: MAX_STRING_ID.length,
      regex: ID_OR_CURRENT_USER_ID_REGEX,
      custom: isCurrentUserIdOrIdInRange,
      required: true,
    },
    subscribe: {
      type: 'boolean',
    },
    timezone: {
      type: 'string',
      maxLength: 128,
      custom: isTimezone,
    },
  },

  exits: {
    userNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    let user;
    let notificationServices = [];

    if (inputs.id === CURRENT_USER_ID || inputs.id === currentUser.id) {
      user = currentUser;
      notificationServices = await NotificationService.qm.getByUserId(currentUser.id);

      if (inputs.subscribe && this.req.isSocket) {
        sails.sockets.join(this.req, `user:${user.id}`);
      }

      // NEW — timezone tracking: this endpoint is hit far more often than login (every
      // app boot/reconnect), so only write when the timezone actually changed, and don't
      // make the caller wait on it.
      if (inputs.timezone && inputs.timezone !== currentUser.lastTimezone) {
        User.qm.updateOne(currentUser.id, { lastTimezone: inputs.timezone }).catch((error) => {
          sails.log.error('Failed to update last timezone:', error);
        });
      }
    } else {
      if (!sails.helpers.users.isAdminOrProjectOwner(currentUser)) {
        throw Errors.USER_NOT_FOUND; // Forbidden
      }

      user = await User.qm.getOneById(inputs.id);

      if (!user) {
        throw Errors.USER_NOT_FOUND;
      }
    }

    return {
      item: sails.helpers.users.presentOne(user, currentUser),
      included: {
        notificationServices,
      },
    };
  },
};
