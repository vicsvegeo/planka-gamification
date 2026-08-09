/*!
 * Fork addition — lets the current user silence due-date reminders for this
 * specific card, for themselves only (per-user state, matches the
 * card_snooze schema — mirrors SnoozeProjectStep exactly, scoped to a card
 * instead of a project; a fully separate mechanism, doesn't touch project
 * nudges).
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button } from 'semantic-ui-react';
import { Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';

import styles from './SnoozeCardStep.module.scss';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SnoozeCardStep = React.memo(({ cardId, onClose }) => {
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);

  const card = useSelector((state) => selectCardById(state, cardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const snooze = useCallback(
    (days) => {
      dispatch(
        entryActions.updateCard(cardId, {
          snoozedUntil: new Date(Date.now() + days * MS_PER_DAY),
        }),
      );

      onClose();
    },
    [cardId, dispatch, onClose],
  );

  const handleSnoozeFor1DayClick = useCallback(() => snooze(1), [snooze]);
  const handleSnoozeFor1WeekClick = useCallback(() => snooze(7), [snooze]);
  const handleSnoozeFor2WeeksClick = useCallback(() => snooze(14), [snooze]);
  const handleSnoozeFor1MonthClick = useCallback(() => snooze(30), [snooze]);

  const handleUnsnoozeClick = useCallback(() => {
    dispatch(
      entryActions.updateCard(cardId, {
        snoozedUntil: null,
      }),
    );

    onClose();
  }, [cardId, dispatch, onClose]);

  return (
    <>
      <Popup.Header>
        {t('common.snoozeReminders', {
          context: 'title',
        })}
      </Popup.Header>
      <Popup.Content>
        {card.snoozedUntil ? (
          <>
            <div className={styles.text}>
              {t('common.remindersSnoozedUntil', {
                date: t('format:dateTime', {
                  postProcess: 'formatDate',
                  value: card.snoozedUntil,
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

SnoozeCardStep.propTypes = {
  cardId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SnoozeCardStep;
