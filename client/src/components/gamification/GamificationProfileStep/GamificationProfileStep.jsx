/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';

import styles from './GamificationProfileStep.module.scss';

const GamificationProfileStep = React.memo(() => {
  const { level, xp, xpIntoLevel, xpForNextLevel, totalCompletions, onTimeRate, badges } =
    useSelector(selectors.selectGamificationStats);

  const [t] = useTranslation();

  const progressPercentage = xpForNextLevel > 0 ? (xpIntoLevel / xpForNextLevel) * 100 : 0;

  return (
    <>
      <Popup.Header>
        {t('common.gamificationProfile', {
          context: 'title',
        })}
      </Popup.Header>
      <Popup.Content>
        <div className={styles.summary}>
          <div className={styles.level}>
            {t('common.level')} {level}
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className={styles.progressText}>
            {xpIntoLevel} / {xpForNextLevel} {t('common.xpToNextLevel')}
          </div>
          <div className={styles.stats}>
            <span>
              {t('common.cardsCompleted')}: {totalCompletions}
            </span>
            <span>
              {t('common.onTimeRate')}: {Math.round(onTimeRate * 100)}%
            </span>
          </div>
          <div className={styles.totalXp}>
            {xp} {t('common.xp')}
          </div>
        </div>
        <div className={styles.badges}>
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={classNames(styles.badge, !badge.unlockedAt && styles.badgeLocked)}
            >
              <div className={styles.badgeIcon}>{badge.icon}</div>
              <div className={styles.badgeText}>
                <div className={styles.badgeName}>
                  {badge.name}
                  {!badge.unlockedAt && (
                    <span className={styles.badgeStatus}>{t('common.lockedBadge')}</span>
                  )}
                </div>
                <div className={styles.badgeDescription}>{badge.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Popup.Content>
    </>
  );
});

export default GamificationProfileStep;
