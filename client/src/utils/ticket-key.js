/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Keep in sync with server/utils/ticket-keys.js.

// Used by projects without their own prefix.
export const DEFAULT_TICKET_PREFIX = 'BLAPP';

export const TICKET_PREFIX_MAX_LENGTH = 10;

// 2-10 capital letters only (the server rejects anything else).
export const isTicketPrefix = (value) => /^[A-Z]{2,10}$/.test(value);

// Keeps what the user types to capital letters only (typed lowercase is
// capitalized, everything else dropped).
export const sanitizeTicketPrefix = (value) =>
  value
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, TICKET_PREFIX_MAX_LENGTH);

export const formatTicketKey = (ticketPrefix, ticketNumber) =>
  ticketNumber === null || ticketNumber === undefined
    ? null
    : `${ticketPrefix || DEFAULT_TICKET_PREFIX}-${ticketNumber}`;
