/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { dequal } from 'dequal';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input, Tab } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { useForm } from '../../../../hooks';
import { isGithubBranchName, isGithubRepo } from '../../../../utils/validator';

import styles from './GithubPane.module.scss';

const GithubPane = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);

  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const defaultData = useMemo(
    () => ({
      githubRepo: board.githubRepo,
      githubBaseBranch: board.githubBaseBranch,
    }),
    [board.githubRepo, board.githubBaseBranch],
  );

  const [data, handleFieldChange] = useForm(() => ({
    githubRepo: defaultData.githubRepo || '',
    githubBaseBranch: defaultData.githubBaseBranch || '',
  }));

  const cleanData = useMemo(
    () => ({
      githubRepo: data.githubRepo.trim() || null,
      githubBaseBranch: data.githubBaseBranch.trim() || null,
    }),
    [data],
  );

  const isRepoValid = !cleanData.githubRepo || isGithubRepo(cleanData.githubRepo);
  const isBaseBranchValid =
    !cleanData.githubBaseBranch || isGithubBranchName(cleanData.githubBaseBranch);

  const handleSubmit = useCallback(() => {
    if (!isRepoValid || !isBaseBranchValid) {
      return;
    }

    dispatch(entryActions.updateBoard(boardId, cleanData));
  }, [boardId, dispatch, cleanData, isRepoValid, isBaseBranchValid]);

  return (
    <Tab.Pane attached={false} className={styles.wrapper}>
      <p className={styles.hint}>{t('common.githubSettingsHint')}</p>
      <Form onSubmit={handleSubmit}>
        <div className={styles.text}>{t('common.githubRepository')}</div>
        <Input
          fluid
          name="githubRepo"
          value={data.githubRepo}
          placeholder="owner/repo"
          maxLength={200}
          error={!isRepoValid}
          className={styles.field}
          onChange={handleFieldChange}
        />
        {!isRepoValid && <div className={styles.error}>{t('common.invalidGithubRepository')}</div>}
        <div className={styles.text}>{t('common.githubBaseBranch')}</div>
        <Input
          fluid
          name="githubBaseBranch"
          value={data.githubBaseBranch}
          placeholder="main"
          maxLength={255}
          error={!isBaseBranchValid}
          className={styles.field}
          onChange={handleFieldChange}
        />
        {!isBaseBranchValid && (
          <div className={styles.error}>{t('common.invalidGithubBranchName')}</div>
        )}
        <Button
          positive
          disabled={dequal(cleanData, defaultData) || !isRepoValid || !isBaseBranchValid}
          content={t('action.save')}
        />
      </Form>
    </Tab.Pane>
  );
});

export default GithubPane;
