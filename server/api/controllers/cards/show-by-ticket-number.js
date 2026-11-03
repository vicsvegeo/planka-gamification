/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /cards/ticket/{ticketKey}:
 *   get:
 *     summary: Get card details by ticket key
 *     description: Retrieves a card by its ticket key (e.g. `BLAPP-42` or `SHOP-3`, case-insensitive). A bare number means a BLAPP key. Returns the same payload as getCard.
 *     tags:
 *       - Cards
 *     operationId: getCardByTicketNumber
 *     parameters:
 *       - name: ticketKey
 *         in: path
 *         required: true
 *         description: Ticket key (or BLAPP ticket number) of the card to retrieve
 *         schema:
 *           type: string
 *           example: BLAPP-42
 *     responses:
 *       200:
 *         description: Card details retrieved successfully (same shape as getCard)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *                 - included
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/Card'
 *                 included:
 *                   type: object
 *                   description: Same related records as getCard
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { DEFAULT_TICKET_PREFIX } = require('../../../utils/ticket-keys');

const TICKET_KEY_REGEX = /^(?:([A-Za-z]{2,10})-)?([1-9][0-9]{0,8})$/;

const Errors = {
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
};

module.exports = {
  inputs: {
    ticketKey: {
      type: 'string',
      regex: TICKET_KEY_REGEX,
      required: true,
    },
  },

  exits: {
    cardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const [, ticketPrefix = DEFAULT_TICKET_PREFIX, ticketNumber] =
      inputs.ticketKey.match(TICKET_KEY_REGEX);

    const card = await Card.qm.getOneByTicketKey(
      ticketPrefix.toUpperCase(),
      parseInt(ticketNumber, 10),
    );

    if (!card) {
      throw Errors.CARD_NOT_FOUND;
    }

    const { project } = await sails.helpers.lists
      .getPathToProjectById(card.listId)
      .intercept('pathNotFound', () => Errors.CARD_NOT_FOUND);

    return sails.helpers.cards.buildShowResponse
      .with({ card, project, currentUser })
      .intercept('notAccessible', () => Errors.CARD_NOT_FOUND); // Forbidden
  },
};
