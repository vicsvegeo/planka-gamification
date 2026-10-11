/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import buildSearchParts from './build-search-parts';
import { formatTicketKey } from './ticket-key';

// Returns a predicate for the board search: a card matches on its name,
// description or ticket key (BLAPP-<n>). A leading "/" makes it a regex.
export default (search) => {
  if (search.startsWith('/')) {
    let searchRegex;
    try {
      searchRegex = new RegExp(search.substring(1), 'i');
    } catch {
      return () => false;
    }

    return (card) => {
      const ticketKey = formatTicketKey(card.ticketNumber);

      return (
        searchRegex.test(card.name) ||
        (!!card.description && searchRegex.test(card.description)) ||
        (!!ticketKey && searchRegex.test(ticketKey))
      );
    };
  }

  const searchParts = buildSearchParts(search);

  return (card) => {
    const name = card.name.toLowerCase();
    const description = card.description && card.description.toLowerCase();
    const ticketKey = formatTicketKey(card.ticketNumber);
    const lowerTicketKey = ticketKey && ticketKey.toLowerCase();

    return searchParts.every(
      (searchPart) =>
        name.includes(searchPart) ||
        (description && description.includes(searchPart)) ||
        (lowerTicketKey && lowerTicketKey.includes(searchPart)),
    );
  };
};
