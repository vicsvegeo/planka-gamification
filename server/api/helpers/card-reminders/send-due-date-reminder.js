/*!
 * Fork addition — thin adapter over the shared dispatch helper (see
 * api/helpers/notification-dispatch/send-to-recipient.js) for due-date
 * reminders specifically. Kept as its own named helper since scan.js already
 * calls it by this name; the actual Discord-vs-Apprise logic lives in the
 * shared helper so it isn't duplicated between this and project-nudges.
 */

module.exports = {
  inputs: {
    recipient: {
      type: 'ref',
      required: true,
    },
    message: {
      type: 'ref',
      required: true, // { title, cardName, cardUrl, body, color, discordFields, bodyByFormat }
    },
    meta: {
      type: 'ref',
      defaultsTo: {},
    },
  },

  fn(inputs) {
    const { recipient, message, meta } = inputs;

    return sails.helpers.notificationDispatch.sendToRecipient(
      recipient,
      {
        title: message.title,
        linkTitle: message.cardName,
        url: message.cardUrl,
        body: message.body,
        color: message.color,
        discordFields: message.discordFields,
        bodyByFormat: message.bodyByFormat,
      },
      meta,
    );
  },
};
