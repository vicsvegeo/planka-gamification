/*!
 * Fork addition — delivers one already-built due-date reminder message to
 * one recipient. Knows nothing about tiers/wording (see templates.js) or
 * scanning (see scan.js) — its only job is picking a delivery channel.
 *
 * Discord isn't built yet (separate "Discord bot: base process" / "Discord
 * bot DM delivery" cards). `recipient.discordUserId` doesn't exist as a User
 * attribute yet either — this check is a forward-looking seam: once a future
 * migration adds it and it's populated for a user, this starts routing to
 * the bot for that user with no other changes needed here. Until then it's
 * always undefined, so every recipient falls through to Apprise.
 *
 * Apprise dispatch reuses the exact mechanism Planka's other notifications
 * (card moved, comment, mention, etc. — see notifications/create-many.js)
 * already use: each user's own NotificationService rows (personal Apprise
 * URLs, configured in account settings) via sails.helpers.utils.sendNotifications.
 */

module.exports = {
  inputs: {
    recipient: {
      type: 'ref',
      required: true,
    },
    message: {
      type: 'ref',
      required: true, // { title, bodyByFormat: { text, markdown, html } }
    },
    meta: {
      type: 'ref',
      defaultsTo: {},
    },
  },

  async fn(inputs) {
    const { recipient, message, meta } = inputs;

    if (recipient.discordUserId) {
      // TODO: route to the Discord bot once it exists.
      sails.log.info(
        `[card-reminders] Recipient ${recipient.id} has Discord delivery configured, ` +
          `but Discord dispatch isn't implemented yet — skipping. meta=${JSON.stringify(meta)}`,
      );

      return { dispatched: false, method: 'discord' };
    }

    const notificationServices = await NotificationService.qm.getByUserId(recipient.id);

    if (notificationServices.length === 0) {
      sails.log.warn(
        `[card-reminders] Recipient ${recipient.id} (${recipient.email}) has no notification ` +
          `services configured — nothing to dispatch. meta=${JSON.stringify(meta)}`,
      );

      return { dispatched: false, method: 'apprise' };
    }

    const services = notificationServices.map((service) => _.pick(service, ['url', 'format']));

    await sails.helpers.utils.sendNotifications(services, message.title, message.bodyByFormat);

    sails.log.info(
      `[card-reminders] Dispatched via Apprise to recipient=${recipient.id} ` +
        `(${notificationServices.length} service(s)). meta=${JSON.stringify(meta)}`,
    );

    return { dispatched: true, method: 'apprise' };
  },
};
