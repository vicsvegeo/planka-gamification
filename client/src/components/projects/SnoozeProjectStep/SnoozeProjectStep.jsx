/*!
 * Fork addition — lets the current user silence due-date/inactivity nudges
 * for the current project, for themselves only (per-user state, matches the
 * project_snooze schema — not a project-wide setting other members share).
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button } from 'semantic-ui-react';
import { Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';

import styles from './SnoozeProjectStep.module.scss';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SnoozeProjectStep = React.memo(({ onClose }) => {
  const project = useSelector(selectors.selectCurrentProject);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const snooze = useCallback(
    (days) => {
      dispatch(
        entryActions.updateProject(project.id, {
          snoozedUntil: new Date(Date.now() + days * MS_PER_DAY),
        }),
      );

      onClose();
    },
    [project, dispatch, onClose],
  );

  const handleSnoozeFor1DayClick = useCallback(() => snooze(1), [snooze]);
  const handleSnoozeFor1WeekClick = useCallback(() => snooze(7), [snooze]);
  const handleSnoozeFor2WeeksClick = useCallback(() => snooze(14), [snooze]);
  const handleSnoozeFor1MonthClick = useCallback(() => snooze(30), [snooze]);

  const handleUnsnoozeClick = useCallback(() => {
    dispatch(
      entryActions.updateProject(project.id, {
        snoozedUntil: null,
      }),
    );

    onClose();
  }, [project, dispatch, onClose]);

  return (
    <>
      <Popup.Header>
        {t('common.snoozeNudges', {
          context: 'title',
        })}
      </Popup.Header>
      <Popup.Content>
        {project.snoozedUntil ? (
          <>
            <div className={styles.text}>
              {t('common.nudgesSnoozedUntil', {
                date: t('format:dateTime', {
                  postProcess: 'formatDate',
                  value: project.snoozedUntil,
                }),
              })}
            </div>
            <Button
              negative
              fluid
              content={t('action.unsnooze')}
              className={styles.button}
              onClick={handleUnsnoozeClick}
            />
          </>
        ) : (
          <div className={styles.durations}>
            <Button
              content={t('action.snoozeFor1Day')}
              className={styles.button}
              onClick={handleSnoozeFor1DayClick}
            />
            <Button
              content={t('action.snoozeFor1Week')}
              className={styles.button}
              onClick={handleSnoozeFor1WeekClick}
            />
            <Button
              content={t('action.snoozeFor2Weeks')}
              className={styles.button}
              onClick={handleSnoozeFor2WeeksClick}
            />
            <Button
              content={t('action.snoozeFor1Month')}
              className={styles.button}
              onClick={handleSnoozeFor1MonthClick}
            />
          </div>
        )}
      </Popup.Content>
    </>
  );
});

SnoozeProjectStep.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SnoozeProjectStep;
