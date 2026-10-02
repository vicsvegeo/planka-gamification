/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { DEFAULT_BRANCH_TYPE } = require('./github-branches');

// Type labels double as branch prefixes. The labels themselves are created on
// boards by the Planka MCP; docs, ci and design deliberately fall under chore.
const TYPE_LABEL_NAMES = ['feat', 'fix', 'chore', 'refactor', 'spike'];

// The branch type of a card: its first type label in label order, else feat.
const pickBranchType = (labels) => {
  const typeLabel = [...labels]
    .sort((a, b) => a.position - b.position || (BigInt(a.id) < BigInt(b.id) ? -1 : 1))
    .find(({ name }) => name && TYPE_LABEL_NAMES.includes(name.trim().toLowerCase()));

  return typeLabel ? typeLabel.name.trim().toLowerCase() : DEFAULT_BRANCH_TYPE;
};

module.exports = {
  TYPE_LABEL_NAMES,
  pickBranchType,
};
