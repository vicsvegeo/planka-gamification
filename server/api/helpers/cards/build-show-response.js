/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Shared by cards/show and cards/show-by-ticket-number so both return the same payload.
module.exports = {
  inputs: {
    card: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    currentUser: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    notAccessible: {},
  },

  async fn(inputs) {
    const { card, project, currentUser } = inputs;

    if (currentUser.role !== User.Roles.ADMIN || project.ownerProjectManagerId) {
      const isProjectManager = await sails.helpers.users.isProjectManager(
        currentUser.id,
        project.id,
      );

      if (!isProjectManager) {
        const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
          card.boardId,
          currentUser.id,
        );

        if (!boardMembership) {
          throw 'notAccessible';
        }
      }
    }

    card.isSubscribed = await sails.helpers.users.isCardSubscriber(currentUser.id, card.id);
    await sails.helpers.cards.attachGamification.with({ cards: card });

    const cardSnooze = await CardSnooze.qm.getOneByCardIdAndUserId(card.id, currentUser.id);
    card.snoozedUntil =
      cardSnooze && new Date(cardSnooze.snoozedUntil) > new Date() ? cardSnooze.snoozedUntil : null;

    const users = card.creatorUserId ? await User.qm.getByIds([card.creatorUserId]) : [];
    const cardMemberships = await CardMembership.qm.getByCardId(card.id);
    const cardLabels = await CardLabel.qm.getByCardId(card.id);

    const taskLists = await TaskList.qm.getByCardId(card.id);
    const taskListIds = sails.helpers.utils.mapRecords(taskLists);

    const tasks = await Task.qm.getByTaskListIds(taskListIds);
    const attachments = await Attachment.qm.getByCardId(card.id);

    const customFieldGroups = await CustomFieldGroup.qm.getByCardId(card.id);
    const customFieldGroupIds = sails.helpers.utils.mapRecords(customFieldGroups);

    const customFields = await CustomField.qm.getByCustomFieldGroupIds(customFieldGroupIds);
    const customFieldValues = await CustomFieldValue.qm.getByCardId(card.id);

    return {
      item: card,
      included: {
        cardMemberships,
        cardLabels,
        taskLists,
        tasks,
        customFieldGroups,
        customFields,
        customFieldValues,
        users: sails.helpers.users.presentMany(users, currentUser),
        attachments: sails.helpers.attachments.presentMany(attachments),
      },
    };
  },
};
