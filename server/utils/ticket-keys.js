/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Keep in sync with client/src/utils/ticket-key.js.

// Used by projects without their own prefix. Every prefix has its own counter
// (the ticket_counter table, bumped by a database trigger on card insert).
const DEFAULT_TICKET_PREFIX = 'BLAPP';

// 2-10 capital letters only (no lowercase, digits or symbols).
const TICKET_PREFIX_REGEX = /^[A-Z]{2,10}$/;

const isValidTicketPrefix = (value) => TICKET_PREFIX_REGEX.test(value);

// A card's key: <prefix>-<number>, e.g. BLAPP-42.
const formatTicketKey = (ticketPrefix, ticketNumber) =>
  `${ticketPrefix || DEFAULT_TICKET_PREFIX}-${ticketNumber}`;

module.exports = {
  DEFAULT_TICKET_PREFIX,
  isValidTicketPrefix,
  formatTicketKey,
};
