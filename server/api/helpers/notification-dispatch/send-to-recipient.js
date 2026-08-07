/*!
 * Fork addition — delivers one already-built message to one recipient.
 * Shared by every fork-added notification source (due-date reminders,
 * project inactivity nudges, ...): knows nothing about tiers/wording or
 * scanning — its only job is picking a delivery channel. Not to be confused
 * with api/helpers/notifications/*, which is stock Planka's in-app
 * Notification-model system (card moved, comment, mention, ...) — this is a
 * different, external-delivery-only concern.
 *
 * Discord: when recipient.discordUserId is set, the message is routed to the
 * separate notifications-bot service over HTTP (POST {BOT_SERVICE_URL}/dm,
 * authenticated via the X-Bot-Secret header). `meta` is passed through
 * as-is so the bot has whatever identifying info the caller has (e.g.
 * projectId for nudges, cardId for due-date reminders) — the bot uses
 * projectId to attach snooze buttons (customId embeds it directly, no
 * server-side lookup needed). If the call
 * fails for any reason (bot down, network error, timeout, non-2xx response
 * — including the bot not being configured/deployed yet, since
 * BOT_SERVICE_URL is then unset), delivery falls back to Apprise for that
 * recipient rather than losing the notification, and the fallback is
 * logged clearly.
 *
 * Apprise dispatch reuses the exact mechanism Planka's own notifications
 * (card moved, comment, mention, etc. — see notifications/create-many.js)
 * already use: each user's own NotificationService rows (personal Apprise
 * URLs, configured in account settings) via sails.helpers.utils.sendNotifications.
 */

const BOT_REQUEST_TIMEOUT = 10000;

const dispatchViaApprise = async (recipient, message, meta) => {
  const notificationServices = await NotificationService.qm.getByUserId(recipient.id);

  if (notificationServices.length === 0) {
    sails.log.warn(
      `[notification-dispatch] Recipient ${recipient.id} (${recipient.email}) has no ` +
        `notification services configured — nothing to dispatch. meta=${JSON.stringify(meta)}`,
    );

    return { dispatched: false, method: 'apprise' };
  }

  const services = notificationServices.map((service) => _.pick(service, ['url', 'format']));

  await sails.helpers.utils.sendNotifications(services, message.title, message.bodyByFormat);

  sails.log.info(
    `[notification-dispatch] Dispatched via Apprise to recipient=${recipient.id} ` +
      `(${notificationServices.length} service(s)). meta=${JSON.stringify(meta)}`,
  );

  return { dispatched: true, method: 'apprise' };
};

// Sends title/body/url/color/fields/meta as separate values rather than a
// pre-formatted markdown string: the bot builds a native Discord embed
// (linkTitle as the linked title, body as the description, metadata as
// fields) instead of relying on Discord auto-embedding a link pasted into
// plain message content, which it doesn't do for markdown-style links.
const dispatchViaDiscordBot = async (recipient, message, meta) => {
  const response = await fetch(`${sails.config.custom.botServiceUrl}/dm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bot-Secret': sails.config.custom.botServiceSecret,
    },
    body: JSON.stringify({
      discordUserId: recipient.discordUserId,
      title: message.linkTitle,
      body: message.body,
      url: message.url,
      color: message.color,
      fields: message.discordFields,
      meta,
    }),
    signal: AbortSignal.timeout(BOT_REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    throw new Error(`Bot service responded with status ${response.status}: ${responseText}`);
  }
};

module.exports = {
  inputs: {
    recipient: {
      type: 'ref',
      required: true,
    },
    message: {
      type: 'ref',
      required: true, // { title, linkTitle, url, body, color, discordFields, bodyByFormat }
    },
    meta: {
      type: 'ref',
      defaultsTo: {},
    },
  },

  async fn(inputs) {
    const { recipient, message, meta } = inputs;

    if (recipient.discordUserId) {
      try {
        await dispatchViaDiscordBot(recipient, message, meta);

        sails.log.info(
          `[notification-dispatch] Dispatched via Discord bot to recipient=${recipient.id} ` +
            `(discordUserId=${recipient.discordUserId}). meta=${JSON.stringify(meta)}`,
        );

        return { dispatched: true, method: 'discord' };
      } catch (error) {
        sails.log.warn(
          `[notification-dispatch] Discord bot dispatch failed for recipient=${recipient.id} ` +
            `(discordUserId=${recipient.discordUserId}): ${error.message} — falling back to ` +
            `Apprise. meta=${JSON.stringify(meta)}`,
        );

        return dispatchViaApprise(recipient, message, meta);
      }
    }

    return dispatchViaApprise(recipient, message, meta);
  },
};
