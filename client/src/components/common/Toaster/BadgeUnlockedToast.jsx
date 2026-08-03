/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Message } from 'semantic-ui-react';

const BadgeUnlockedToast = React.memo(({ badge }) => {
  const [t] = useTranslation();

  return (
    <Message visible positive size="tiny">
      <span role="img" aria-label={badge.name}>
        {badge.icon}
      </span>
      <Message.Content>
        <Message.Header>{t('common.badgeUnlockedToastTitle')}</Message.Header>
        {badge.name}
      </Message.Content>
    </Message>
  );
});

BadgeUnlockedToast.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  badge: PropTypes.object.isRequired,
};

export default BadgeUnlockedToast;
