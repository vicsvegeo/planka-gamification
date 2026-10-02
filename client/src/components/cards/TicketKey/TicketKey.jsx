/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { formatTicketKey } from '../../../utils/ticket-key';

import styles from './TicketKey.module.scss';

const TicketKey = React.memo(({ ticketNumber, className }) => {
  const ticketKey = formatTicketKey(ticketNumber);

  if (!ticketKey) {
    return null;
  }

  return <span className={classNames(styles.wrapper, className)}>{ticketKey}</span>;
});

TicketKey.propTypes = {
  ticketNumber: PropTypes.number,
  className: PropTypes.string,
};

TicketKey.defaultProps = {
  ticketNumber: undefined,
  className: undefined,
};

export default TicketKey;
