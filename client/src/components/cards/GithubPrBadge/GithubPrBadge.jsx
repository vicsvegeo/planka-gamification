/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';

import { GithubPrStates } from '../../../constants/Enums';
import buildGithubBranchUrl from '../../../utils/build-github-branch-url';

import styles from './GithubPrBadge.module.scss';

const ICON_BY_STATE = {
  [GithubPrStates.BRANCH]: 'code branch',
  [GithubPrStates.OPEN]: 'circle outline',
  [GithubPrStates.MERGED]: 'check circle',
  [GithubPrStates.CLOSED]: 'times circle',
};

const GithubPrBadge = React.memo(({ state, prUrl, prNumber, repo, branch }) => {
  const [t] = useTranslation();

  const handleClick = useCallback((event) => {
    event.stopPropagation(); // Don't open the card from the board tile.
  }, []);

  if (!state) {
    return null;
  }

  const href = state === GithubPrStates.BRANCH || !prUrl ? branch && repo && buildGithubBranchUrl(repo, branch) : prUrl;

  const contentNode = (
    <>
      <Icon name={ICON_BY_STATE[state]} className={styles.icon} />
      {t(`common.githubPrState_${state}`)}
      {state !== GithubPrStates.BRANCH && prNumber && (
        <span className={styles.number}>#{prNumber}</span>
      )}
    </>
  );

  const className = classNames(styles.wrapper, styles[`wrapper_${state}`]);

  return href ? (
    <a
      href={href}
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

GithubPrBadge.propTypes = {
  state: PropTypes.oneOf(Object.values(GithubPrStates)),
  prUrl: PropTypes.string,
  prNumber: PropTypes.number,
  repo: PropTypes.string,
  branch: PropTypes.string,
};

GithubPrBadge.defaultProps = {
  state: undefined,
  prUrl: undefined,
  prNumber: undefined,
  repo: undefined,
  branch: undefined,
};

export default GithubPrBadge;
