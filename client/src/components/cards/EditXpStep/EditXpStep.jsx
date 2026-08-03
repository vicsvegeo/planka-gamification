/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'semantic-ui-react';
import { Input, Popup } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { useForm, useNestedRef } from '../../../hooks';

const EditXpStep = React.memo(({ cardId, onBack, onClose }) => {
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);

  const defaultValue = useSelector((state) => selectCardById(state, cardId).baseXp);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [data, handleFieldChange] = useForm(() => ({
    baseXp: defaultValue,
  }));

  const [xpFieldRef, handleXpFieldRef] = useNestedRef('inputRef');

  const handleSubmit = useCallback(() => {
    const baseXp = Math.round(Number(data.baseXp));

    if (!Number.isInteger(baseXp) || baseXp <= 0) {
      xpFieldRef.current.select();
      return;
    }

    if (baseXp !== defaultValue) {
      dispatch(
        entryActions.updateCard(cardId, {
          baseXp,
        }),
      );
    }

    onClose();
  }, [cardId, onClose, defaultValue, dispatch, data, xpFieldRef]);

  useEffect(() => {
    xpFieldRef.current.select();
  }, [xpFieldRef]);

  return (
    <>
      <Popup.Header onBack={onBack}>{t('common.xpValue', { context: 'title' })}</Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <Input
            ref={handleXpFieldRef}
            type="number"
            name="baseXp"
            value={data.baseXp}
            min={1}
            autoFocus
            onChange={handleFieldChange}
          />
          <Button positive content={t('action.save')} style={{ marginTop: 8 }} />
        </Form>
      </Popup.Content>
    </>
  );
});

EditXpStep.propTypes = {
  cardId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

EditXpStep.defaultProps = {
  onBack: undefined,
};

export default EditXpStep;
