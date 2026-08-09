/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Icon, Message } from 'semantic-ui-react';

const XpGainedToast = React.memo(({ xp }) => {
  const [t] = useTranslation();

  return (
    <Message visible positive size="tiny">
      <Icon name="star" />
      {t('common.xpGainedToastBody', { xp })}
    </Message>
  );
});

XpGainedToast.propTypes = {
  xp: PropTypes.number.isRequired,
};

export default XpGainedToast;
