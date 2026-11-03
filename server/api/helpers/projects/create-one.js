/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    values: {
      type: 'json',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  exits: {
    ticketPrefixAlreadyInUse: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    let project;
    let projectManager;

    try {
      ({ project, projectManager } = await Project.qm.createOne(values, {
        user: inputs.actorUser,
      }));
    } catch (error) {
      if (error.code === 'E_UNIQUE') {
        throw 'ticketPrefixAlreadyInUse';
      }

      throw error;
    }

    const scoper = sails.helpers.projects.makeScoper.with({
      record: project,
    });

    scoper.projectManagerUserIds = [projectManager.userId];
    const userIdsWithFullProjectVisibility = await scoper.getUserIdsWithFullProjectVisibility();

    userIdsWithFullProjectVisibility.forEach((userId) => {
      // TODO: send projectManager in included
      sails.sockets.broadcast(
        `user:${userId}`,
        'projectCreate',
        {
          item: project,
        },
        inputs.request,
      );
    });

    const webhooks = await Webhook.qm.getAll();

    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.PROJECT_CREATE,
      buildData: () => ({
        item: project,
      }),
      user: inputs.actorUser,
    });

    return {
      project,
      projectManager,
    };
  },
};
