/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Icon, Message } from 'semantic-ui-react';

const LevelUpToast = React.memo(({ level }) => {
  const [t] = useTranslation();

  return (
    <Message visible positive size="tiny">
      <Icon name="level up" />
      <Message.Content>
        <Message.Header>{t('common.levelUpToastTitle')}</Message.Header>
        {t('common.levelUpToastBody', { level })}
      </Message.Content>
    </Message>
  );
});

LevelUpToast.propTypes = {
  level: PropTypes.number.isRequired,
};

export default LevelUpToast;
