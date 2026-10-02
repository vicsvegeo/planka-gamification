/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { dequal } from 'dequal';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Form, Input, Tab } from 'semantic-ui-react';

import api from '../../../../api';
import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { useForm } from '../../../../hooks';
import { isGithubBranchName, isGithubRepo } from '../../../../utils/validator';

import styles from './GithubPane.module.scss';

const GithubPane = React.memo(() => {
  const project = useSelector(selectors.selectCurrentProject);
  const accessToken = useSelector(selectors.selectAccessToken);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const defaultData = useMemo(
    () => ({
      githubRepo: project.githubRepo,
      githubBaseBranch: project.githubBaseBranch,
    }),
    [project.githubRepo, project.githubBaseBranch],
  );

  // Repositories the server's GitHub token can access; null while loading. On
  // failure the field falls back to free text.
  const [repositories, setRepositories] = useState(null);
  const [repositoriesError, setRepositoriesError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    api
      .getGithubRepositories({
        Authorization: `Bearer ${accessToken}`,
      })
      .then(({ items }) => {
        if (!isCancelled) {
          setRepositories(items);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setRepositoriesError(error.message || 'Could not load repositories');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken]);

  const [data, handleFieldChange, setData] = useForm(() => ({
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

  // Branches of the selected repo, tagged with the repo they belong to so a
  // late response for a previously selected repo is ignored. On failure the
  // field falls back to free text.
  const [branches, setBranches] = useState({
    repo: null,
    items: null,
    error: null,
  });

  const branchesRepo = isRepoValid && !repositoriesError ? cleanData.githubRepo : null;

  useEffect(() => {
    if (!branchesRepo) {
      return undefined;
    }

    let isCancelled = false;
    setBranches({ repo: branchesRepo, items: null, error: null });

    api
      .getGithubBranches(branchesRepo, {
        Authorization: `Bearer ${accessToken}`,
      })
      .then(({ items }) => {
        if (!isCancelled) {
          setBranches({ repo: branchesRepo, items, error: null });
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setBranches({
            repo: branchesRepo,
            items: null,
            error: error.message || 'Could not load branches',
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [branchesRepo, accessToken]);

  const isCurrentBranches = !!branchesRepo && branches.repo === branchesRepo;
  const branchItems = isCurrentBranches ? branches.items : null;
  const branchesError = repositoriesError || (isCurrentBranches ? branches.error : null);

  const isBaseBranchValid =
    !cleanData.githubBaseBranch || isGithubBranchName(cleanData.githubBaseBranch);

  const repositoryOptions = useMemo(() => {
    if (!repositories) {
      return [];
    }

    const options = repositories.map((repository) => ({
      key: repository.fullName,
      value: repository.fullName,
      text: repository.fullName,
      description: repository.isPrivate ? t('common.private') : undefined,
    }));

    // Keep showing the linked repo even if the token lost access to it.
    if (project.githubRepo && !repositories.some((r) => r.fullName === project.githubRepo)) {
      options.unshift({
        key: project.githubRepo,
        value: project.githubRepo,
        text: project.githubRepo,
      });
    }

    return options;
  }, [repositories, project.githubRepo, t]);

  const branchOptions = useMemo(() => {
    if (!branchItems) {
      return [];
    }

    const repository =
      repositories && repositories.find(({ fullName }) => fullName === cleanData.githubRepo);
    const defaultBranch = repository && repository.defaultBranch;

    const options = branchItems.map(({ name }) => ({
      key: name,
      value: name,
      text: name,
      description: name === defaultBranch ? t('common.default') : undefined,
    }));

    // Keep showing the chosen branch even if it no longer exists.
    if (
      cleanData.githubBaseBranch &&
      !branchItems.some(({ name }) => name === cleanData.githubBaseBranch)
    ) {
      options.unshift({
        key: cleanData.githubBaseBranch,
        value: cleanData.githubBaseBranch,
        text: cleanData.githubBaseBranch,
      });
    }

    return options;
  }, [branchItems, repositories, cleanData.githubRepo, cleanData.githubBaseBranch, t]);

  const handleRepositoryChange = useCallback(
    (_, { value }) => {
      const repository = repositories.find(({ fullName }) => fullName === value);

      setData((prevData) => ({
        ...prevData,
        githubRepo: value || '',
        // A branch of the previous repo means nothing here: start from the
        // new repo's default branch.
        githubBaseBranch:
          value === prevData.githubRepo
            ? prevData.githubBaseBranch
            : (repository && repository.defaultBranch) || '',
      }));
    },
    [repositories, setData],
  );

  const handleBranchChange = useCallback(
    (_, { value }) => {
      setData((prevData) => ({
        ...prevData,
        githubBaseBranch: value || '',
      }));
    },
    [setData],
  );

  const handleSubmit = useCallback(() => {
    if (!isRepoValid || !isBaseBranchValid) {
      return;
    }

    dispatch(entryActions.updateCurrentProject(cleanData));
  }, [dispatch, cleanData, isRepoValid, isBaseBranchValid]);

  return (
    <Tab.Pane attached={false} className={styles.wrapper}>
      <p className={styles.hint}>{t('common.githubSettingsHint')}</p>
      <Form onSubmit={handleSubmit}>
        <div className={styles.text}>{t('common.githubRepository')}</div>
        {repositoriesError ? (
          <>
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
            <div className={styles.note}>{repositoriesError}</div>
          </>
        ) : (
          <Dropdown
            fluid
            search
            selection
            clearable
            loading={!repositories}
            disabled={!repositories}
            options={repositoryOptions}
            value={data.githubRepo}
            placeholder={t('common.selectRepository')}
            noResultsMessage={t('common.noRepositoriesFound')}
            className={styles.field}
            onChange={handleRepositoryChange}
          />
        )}
        {!isRepoValid && <div className={styles.error}>{t('common.invalidGithubRepository')}</div>}
        <div className={styles.text}>{t('common.githubBaseBranch')}</div>
        {branchesError ? (
          <>
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
            {!repositoriesError && <div className={styles.note}>{branchesError}</div>}
          </>
        ) : (
          <Dropdown
            fluid
            search
            selection
            clearable
            loading={!!branchesRepo && !branchItems}
            disabled={!branchItems}
            options={branchOptions}
            value={data.githubBaseBranch}
            placeholder={t('common.selectBranch')}
            noResultsMessage={t('common.noBranchesFound')}
            className={styles.field}
            onChange={handleBranchChange}
          />
        )}
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
