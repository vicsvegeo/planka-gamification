/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';

import getDateFormat from '../../../utils/get-date-format';

import styles from './SoftDueDateChip.module.scss';

const SoftDueDateChip = React.memo(({ value, bonusAwarded, onClick }) => {
  const [t] = useTranslation();

  const dateFormat = getDateFormat(value);

  const contentNode = (
    <span
      className={classNames(
        styles.wrapper,
        bonusAwarded && styles.wrapperBonusAwarded,
        onClick && styles.wrapperHoverable,
      )}
    >
      {bonusAwarded && <Icon name="star" className={styles.icon} />}
      {t(`format:${dateFormat}`, {
        value,
        postProcess: 'formatDate',
      })}
    </span>
  );

  return onClick ? (
    <button type="button" className={styles.button} onClick={onClick}>
      {contentNode}
    </button>
  ) : (
    contentNode
  );
});

SoftDueDateChip.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired,
  bonusAwarded: PropTypes.bool,
  onClick: PropTypes.func,
};

SoftDueDateChip.defaultProps = {
  bonusAwarded: false,
  onClick: undefined,
};

export default SoftDueDateChip;
