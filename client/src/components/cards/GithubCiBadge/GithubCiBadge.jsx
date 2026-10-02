/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';

import { GithubCiStates } from '../../../constants/Enums';

import styles from './GithubCiBadge.module.scss';

const ICON_BY_STATE = {
  [GithubCiStates.RUNNING]: 'sync alternate',
  [GithubCiStates.PASSED]: 'check',
  [GithubCiStates.FAILED]: 'times',
};

const GithubCiBadge = React.memo(({ state, url }) => {
  const [t] = useTranslation();

  const handleClick = useCallback((event) => {
    event.stopPropagation(); // Don't open the card from the board tile.
  }, []);

  if (!state) {
    return null;
  }

  const contentNode = (
    <>
      <Icon
        name={ICON_BY_STATE[state]}
        loading={state === GithubCiStates.RUNNING}
        className={styles.icon}
      />
      {t(`common.githubCiState_${state}`)}
    </>
  );

  const className = classNames(styles.wrapper, styles[`wrapper_${state}`]);

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={classNames(className, styles.wrapperLink)}
      onClick={handleClick}
    >
      {contentNode}
    </a>
  ) : (
    <span className={className}>{contentNode}</span>
  );
});

GithubCiBadge.propTypes = {
  state: PropTypes.oneOf(Object.values(GithubCiStates)),
  url: PropTypes.string,
};

GithubCiBadge.defaultProps = {
  state: undefined,
  url: undefined,
};

export default GithubCiBadge;
