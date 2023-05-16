import { LfLocalizationService } from '@laserfiche/lf-js-utils';
import React, { ChangeEvent, useEffect, useState } from 'react';
import './NewFolderModal.css';

const resources: Map<string, object> = new Map<string, object>([
  [
    'en-US',
    {
      NAME: 'Name',
      OK: 'Ok',
      CANCEL: 'Cancel',
      NEW_FOLDER: 'New Folder',
    },
  ],
  [
    'es-MX',
    {
      NAME: 'Name -Spanish',
      OK: 'Ok - Spanish',
      CANCEL: 'Cancel - Spanish',
      NEW_FOLDER: 'New Folder - Spanish',
    },
  ],
]);

export default function NewFolderModalComponent(props: {
  onClose: (folderName?: string) => Promise<void>;
  errorMessage?: string;
}) {
  const [folderName, setFolderName] = useState('');
  const localizationService: LfLocalizationService = new LfLocalizationService(
    resources
  );

  const NAME = localizationService.getString('NAME');
  const OK = localizationService.getString('OK');
  const CANCEL = localizationService.getString('CANCEL');
  const NEW_FOLDER = localizationService.getString('NEW_FOLDER');

  const closeOnEscapeKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      props.onClose();
    }
  };

  useEffect(() => {
    document.body.addEventListener('keydown', closeOnEscapeKeyDown);
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const folderName = target?.value;

    setFolderName(folderName);
  };

  const closeDialog = (folderName?: string) => {
    props.onClose(folderName);
  };

  return (
    <div className='new-folder-dialog-modal'>
      <div
        className='new-folder-dialog-modal-content'
        id='new-folder-dialog-content'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='new-folder-dialog-modal-title'>
          <span className='lf-dialog-title lf-popup-dialog-title'>
            {NEW_FOLDER}
          </span>
          <button
            className='lf-close-button'
            id='new-folder-dialog-modal-close-dialog'
            onClick={() => closeDialog()}
          >
            <span id='new-folder-dialog-close-icon' className='material-icons'>
              close
            </span>
          </button>
        </div>
        <div className='lf-dialog-message'>
          <p hidden={!props.errorMessage} className='popup-error'>
            {props.errorMessage}
          </p>
          <p className='new-folder-label'>{NAME}</p>
          <input
            id='new-folder-name-input'
            className='new-folder-name-input'
            onChange={(e) => handleInputChange(e)}
          ></input>
        </div>
        <div className='lf-dialog-actions'>
          <button
            onClick={() => closeDialog(folderName)}
            disabled={!(folderName.length > 0)}
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
