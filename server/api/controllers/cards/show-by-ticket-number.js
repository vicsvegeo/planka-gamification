/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /cards/ticket/{ticketNumber}:
 *   get:
 *     summary: Get card details by ticket number
 *     description: Retrieves a card by its instance-wide ticket number. Returns the same payload as getCard.
 *     tags:
 *       - Cards
 *     operationId: getCardByTicketNumber
 *     parameters:
 *       - name: ticketNumber
 *         in: path
 *         required: true
 *         description: Ticket number of the card to retrieve
 *         schema:
 *           type: integer
 *           example: 42
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

const Errors = {
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
};

module.exports = {
  inputs: {
    ticketNumber: {
      type: 'number',
      isInteger: true,
      min: 1,
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

    const card = await Card.qm.getOneByTicketNumber(inputs.ticketNumber);

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
