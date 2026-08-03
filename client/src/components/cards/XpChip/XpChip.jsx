/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';

import styles from './XpChip.module.scss';

const XpChip = React.memo(({ value, onClick }) => {
  const [t] = useTranslation();

  const contentNode = (
    <span className={classNames(styles.wrapper, onClick && styles.wrapperHoverable)}>
      <Icon name="star" className={styles.icon} />
      {value} {t('common.xp')}
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

XpChip.propTypes = {
  value: PropTypes.number.isRequired,
  onClick: PropTypes.func,
};

XpChip.defaultProps = {
  onClick: undefined,
};

export default XpChip;
