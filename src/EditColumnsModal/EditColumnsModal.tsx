import { LfLocalizationService } from '@laserfiche/lf-js-utils';
import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@laserfiche/types-lf-ui-components';
import './EditColumnsModal.css';

const resources: Map<string, object> = new Map<string, object>([
  [
    'en-US',
    {
      OK: 'Ok',
      CANCEL: 'Cancel',
      ADD_REMOVE_COLUMNS: 'Add/Remove Columns',
    },
  ],
  [
    'es-MX',
    {
      OK: 'Ok - Spanish',
      CANCEL: 'Cancel - Spanish',
      ADD_REMOVE_COLUMNS: 'Add/Remove Columns - Spanish',
    },
  ],
]);

const localizationService: LfLocalizationService = new LfLocalizationService(
  resources
);

const OK = localizationService.getString('OK');
const CANCEL = localizationService.getString('CANCEL');
const ADD_REMOVE_COLUMNS: string =
  localizationService.getString('ADD_REMOVE_COLUMNS');

export default function EditColumnsModal(props: {
  onClose: (columns?: ColumnDef[]) => void;
  initialColumnsSelected: ColumnDef[];
  allColumnOptions: ColumnDef[];
}) {
  const [columnsSelected, setColumnsSelected] = useState<ColumnDef[]>(
    props.initialColumnsSelected
  );

  const closeOnEscapeKeyDown = (keyboardEvent: KeyboardEvent) => {
    if (keyboardEvent.code === 'Escape') {
      props.onClose();
    }
  };
  useEffect(() => {
    document.body.addEventListener('keydown', closeOnEscapeKeyDown);
  }, []);

  const closeDialog = (columns?: ColumnDef[]) => {
    props.onClose(columns);
  };

  function onCheckboxChange(column: ColumnDef) {
    // we provide a new array (not just new values) to trigger change detection
    let newSelected: ColumnDef[];
    if (columnsSelected.includes(column)) {
      newSelected = [...columnsSelected.filter((c: ColumnDef) => c != column)];
    } else {
      newSelected = columnsSelected.concat([column]);
    }
    setColumnsSelected(newSelected);
  }

  return (
    <div className='edit-columns-dialog-modal'>
      <div
        className='edit-columns-dialog-modal-content'
        id='edit-columns-dialog-content'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='edit-columns-dialog-modal-title'>
          <span className='lf-dialog-title lf-popup-dialog-title'>
            {ADD_REMOVE_COLUMNS}
          </span>
          <button
            className='lf-close-buttton'
            id='edit-columns-dialog-modal-close-dialog'
            onClick={() => closeDialog()}
          >
            <span
              id='edit-columns-dialog-close-icon'
              className='material-icons'
            >
              close
            </span>
          </button>
        </div>
        <div className='lf-dialog-message'>
          <div className='column-list'>
            {props.allColumnOptions.map((column: ColumnDef) => (
              <div key={column.id}>
                <input
                  type='checkbox'
                  checked={columnsSelected.includes(column)}
                  id={`${column.id}-checkbox`}
                  onChange={() => onCheckboxChange(column)}
                ></input>
                <label htmlFor={`${column.id}-checkbox`}>
                  {' '}
                  {column.displayName}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className='lf-dialog-actions'>
          <button
            onClick={() => closeDialog(columnsSelected)}
            className='lf-button primary-button'
          >
            {OK}
          </button>
          <button
            onClick={() => closeDialog()}
            className='lf-button sec-button margin-left-button'
          >
            {CANCEL}
          </button>
        </div>
      </div>
    </div>
  );
}
