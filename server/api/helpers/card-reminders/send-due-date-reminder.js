/*!
 * Fork addition — delivers one already-built due-date reminder message to
 * one recipient. Knows nothing about tiers/wording (see templates.js) or
 * scanning (see scan.js) — its only job is picking a delivery channel.
 *
 * Discord: when recipient.discordUserId is set, the message is routed to the
 * separate notifications-bot service over HTTP (POST {BOT_SERVICE_URL}/dm,
 * authenticated via the X-Bot-Secret header — exact endpoint/port/auth to be
 * finalized once the bot side is built). If that call fails for any reason
 * (bot down, network error, timeout, non-2xx response — including the bot
 * not being configured/deployed yet, since BOT_SERVICE_URL is then unset),
 * delivery falls back to Apprise for that recipient rather than losing the
 * notification, and the fallback is logged clearly.
 *
 * Apprise dispatch reuses the exact mechanism Planka's other notifications
 * (card moved, comment, mention, etc. — see notifications/create-many.js)
 * already use: each user's own NotificationService rows (personal Apprise
 * URLs, configured in account settings) via sails.helpers.utils.sendNotifications.
 */

const BOT_REQUEST_TIMEOUT = 10000;

const dispatchViaApprise = async (recipient, message, meta) => {
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
};

// Discord renders basic markdown in DMs, so the markdown-formatted body
// (already built alongside text/html in templates.js) is the right fit here.
const dispatchViaDiscordBot = async (recipient, message) => {
  const response = await fetch(`${sails.config.custom.botServiceUrl}/dm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bot-Secret': sails.config.custom.botServiceSecret,
    },
    body: JSON.stringify({
      discordUserId: recipient.discordUserId,
      title: message.title,
      body: message.bodyByFormat.markdown,
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
      try {
        await dispatchViaDiscordBot(recipient, message);

        sails.log.info(
          `[card-reminders] Dispatched via Discord bot to recipient=${recipient.id} ` +
            `(discordUserId=${recipient.discordUserId}). meta=${JSON.stringify(meta)}`,
        );

        return { dispatched: true, method: 'discord' };
      } catch (error) {
        sails.log.warn(
          `[card-reminders] Discord bot dispatch failed for recipient=${recipient.id} ` +
            `(discordUserId=${recipient.discordUserId}): ${error.message} — falling back to ` +
            `Apprise. meta=${JSON.stringify(meta)}`,
        );

        return dispatchViaApprise(recipient, message, meta);
      }
    }

    return dispatchViaApprise(recipient, message, meta);
  },
};
