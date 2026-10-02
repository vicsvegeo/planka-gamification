/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

export const TICKET_KEY_PREFIX = 'BLAPP';

export const formatTicketKey = (ticketNumber) =>
  ticketNumber === null || ticketNumber === undefined
    ? null
    : `${TICKET_KEY_PREFIX}-${ticketNumber}`;
