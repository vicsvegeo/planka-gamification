/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { dequal } from 'dequal';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Form, Header, Input, Tab } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { useForm } from '../../../hooks';
import NotificationServices from '../../notification-services/NotificationServices';

import styles from './NotificationsPane.module.scss';

const NotificationsPane = React.memo(() => {
  const user = useSelector(selectors.selectCurrentUser);
  const notificationServiceIds = useSelector(selectors.selectNotificationServiceIdsForCurrentUser);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const handleCreate = useCallback(
    (data) => {
      dispatch(entryActions.createNotificationServiceInCurrentUser(data));
    },
    [dispatch],
  );

  const defaultData = useMemo(
    () => ({
      discordUserId: user.discordUserId,
    }),
    [user.discordUserId],
  );

  const [data, handleFieldChange] = useForm(() => ({
    ...defaultData,
    discordUserId: defaultData.discordUserId || '',
  }));

  const cleanData = useMemo(
    () => ({
      discordUserId: data.discordUserId.trim() || null,
    }),
    [data],
  );

  const handleDiscordSubmit = useCallback(() => {
    dispatch(entryActions.updateUser(user.id, cleanData));
  }, [user.id, dispatch, cleanData]);

  return (
    <Tab.Pane attached={false} className={styles.wrapper}>
      <Divider horizontal section>
        <Header as="h4">Discord</Header>
      </Divider>
      <Form onSubmit={handleDiscordSubmit}>
        <div className={styles.text}>{t('common.discordUserId')}</div>
        <Input
          fluid
          name="discordUserId"
          value={data.discordUserId}
          maxLength={32}
          className={styles.field}
          onChange={handleFieldChange}
        />
        <div className={styles.helperText}>{t('common.discordUserIdHelperText')}</div>
        <Button
          positive
          disabled={dequal(cleanData, defaultData)}
          content={t('action.save')}
          className={styles.saveButton}
        />
      </Form>
      <NotificationServices ids={notificationServiceIds} onCreate={handleCreate} />
    </Tab.Pane>
  );
});

export default NotificationsPane;
