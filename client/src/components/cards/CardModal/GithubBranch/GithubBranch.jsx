/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import buildGithubBranchUrl from '../../../../utils/build-github-branch-url';
import GithubPrBadge from '../../GithubPrBadge';
import GithubCiBadge from '../../GithubCiBadge';

import styles from './GithubBranch.module.scss';

const GithubBranch = React.memo(({ canCreate }) => {
  const project = useSelector(selectors.selectCurrentProject);
  const card = useSelector(selectors.selectCurrentCard);

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isCommandCopied, setIsCommandCopied] = useState(false);

  const handleCreateClick = useCallback(() => {
    dispatch(entryActions.createCardGithubBranch(card.id));
  }, [card.id, dispatch]);

  const handleCopyClick = useCallback(() => {
    if (isCommandCopied) {
      return;
    }

    navigator.clipboard.writeText(`git fetch origin && git switch ${card.githubBranch}`);
    setIsCommandCopied(true);
    setTimeout(() => setIsCommandCopied(false), 1000);
  }, [card.githubBranch, isCommandCopied]);

  const hasBadges = !!(card.githubPrState || card.githubCiState);
  const canCreateBranch = !card.githubBranch && !!project.githubRepo && canCreate;

  if (!card.githubBranch && !hasBadges && !canCreateBranch) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Icon name="github" className={styles.moduleIcon} />
      <div className={styles.moduleHeader}>{t('common.github')}</div>
      {(hasBadges || card.githubBranch) && (
        <div className={styles.row}>
          {card.githubPrState && (
            <GithubPrBadge
              state={card.githubPrState}
              prUrl={card.githubPrUrl}
              prNumber={card.githubPrNumber}
              repo={project.githubRepo}
              branch={card.githubBranch}
            />
          )}
          {card.githubCiState && (
            <GithubCiBadge state={card.githubCiState} url={card.githubCiUrl} />
          )}
          {card.githubBranch && project.githubRepo && (
            <Button
              as="a"
              href={buildGithubBranchUrl(project.githubRepo, card.githubBranch)}
              target="_blank"
              rel="noreferrer"
              className={styles.actionButton}
            >
              <Icon name="external alternate" />
              {t('action.openOnGithub')}
            </Button>
          )}
        </div>
      )}
      {card.githubBranch && (
        <div className={styles.branch}>
          <code className={styles.branchName}>{card.githubBranch}</code>
          <Button
            className={styles.copyButton}
            title={t('action.copyCheckoutCommand')}
            onClick={handleCopyClick}
          >
            <Icon fitted name={isCommandCopied ? 'check' : 'copy outline'} size="small" />
          </Button>
        </div>
      )}
      {canCreateBranch && (
        <>
          <Button
            loading={card.isGithubBranchCreating}
            disabled={card.isGithubBranchCreating}
            className={styles.actionButton}
            onClick={handleCreateClick}
          >
            <Icon name="code branch" />
            {t('action.createBranch')}
          </Button>
          {card.githubBranchError && <div className={styles.error}>{card.githubBranchError}</div>}
        </>
      )}
    </div>
  );
});

GithubBranch.propTypes = {
  canCreate: PropTypes.bool.isRequired,
};

export default GithubBranch;
