/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { formatTicketKey } = require('./ticket-keys');

const DEFAULT_BASE_BRANCH = 'main';
const DEFAULT_BRANCH_TYPE = 'feat';
const MAX_SLUG_LENGTH = 40;

const REPO_REGEX = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
// A conservative subset of `git check-ref-format`.
const BRANCH_NAME_REGEX = /^(?!\/|.*(?:\/\/|\.\.|@\{|\/$|\.$|\.lock$))[A-Za-z0-9._/-]+$/;

const slugify = (text, maxLength = MAX_SLUG_LENGTH) => {
  const slug = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length <= maxLength) {
    return slug;
  }

  const cut = slug.slice(0, maxLength);
  const lastHyphenIndex = cut.lastIndexOf('-');

  // Prefer ending on a whole word, unless that throws away most of the slug.
  return (lastHyphenIndex >= maxLength / 2 ? cut.slice(0, lastHyphenIndex) : cut).replace(
    /-+$/,
    '',
  );
};

const buildBranchName = ({ type = DEFAULT_BRANCH_TYPE, ticketNumber, name }) => {
  const slug = slugify(name);
  const ticketKey = formatTicketKey(ticketNumber);

  return `${type}/${slug ? `${ticketKey}-${slug}` : ticketKey}`;
};

const isValidRepo = (value) => REPO_REGEX.test(value);

const isValidBranchName = (value) => value.length <= 255 && BRANCH_NAME_REGEX.test(value);

module.exports = {
  DEFAULT_BASE_BRANCH,
  DEFAULT_BRANCH_TYPE,
  slugify,
  buildBranchName,
  isValidRepo,
  isValidBranchName,
};
