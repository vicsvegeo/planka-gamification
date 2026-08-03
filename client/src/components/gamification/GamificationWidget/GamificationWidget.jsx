/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Icon, Menu } from 'semantic-ui-react';
import { usePopup } from '../../../lib/popup';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import GamificationProfileStep from '../GamificationProfileStep';

import styles from './GamificationWidget.module.scss';

const POPUP_PROPS = {
  position: 'bottom right',
};

const GamificationWidget = React.memo(() => {
  const { level, xpIntoLevel, xpForNextLevel, badges } = useSelector(
    selectors.selectGamificationStats,
  );

  const dispatch = useDispatch();
  const [t] = useTranslation();

  useEffect(() => {
    dispatch(entryActions.fetchGamificationStats());
  }, [dispatch]);

  const unlockedBadgeCount = badges.filter((badge) => badge.unlockedAt).length;
  const progressPercentage = xpForNextLevel > 0 ? (xpIntoLevel / xpForNextLevel) * 100 : 0;

  const GamificationProfilePopup = usePopup(GamificationProfileStep, POPUP_PROPS);

  return (
    <GamificationProfilePopup>
      <Menu.Item className={styles.item}>
        <span className={styles.level}>
          {t('common.levelShort')} {level}
        </span>
        <span className={styles.progressTrack}>
          <span className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
        </span>
        <span className={styles.badgeCount}>
          <Icon fitted name="trophy" className={styles.badgeIcon} />
          {unlockedBadgeCount}
        </span>
      </Menu.Item>
    </GamificationProfilePopup>
  );
});

export default GamificationWidget;
