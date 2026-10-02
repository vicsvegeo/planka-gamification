/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Keep in sync with client/src/utils/ticket-key.js.
const TICKET_KEY_PREFIX = 'BLAPP';

const formatTicketKey = (ticketNumber) => `${TICKET_KEY_PREFIX}-${ticketNumber}`;

module.exports = {
  TICKET_KEY_PREFIX,
  formatTicketKey,
};
