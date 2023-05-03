import { LfLocalizationService } from "@laserfiche/lf-js-utils";
import React, { ChangeEvent } from "react";
import './NewFolderModal.css';

const resources: Map<string, object> = new Map<string, object>([
  ['en-US', {
    'NAME': 'Name',
    'OK': 'Ok',
    'CANCEL': 'Cancel',
    'NEW_FOLDER': 'New Folder',
  }],
  ['es-MX', {
    'NAME': 'Name -Spanish',
    'OK': 'Ok - Spanish',
    'CANCEL': 'Cancel - Spanish',
    'NEW_FOLDER': 'New Folder - Spanish',
  }]
]);
export default class NewFolderModal extends React.Component<{onClose: (folderName?: string) => Promise<void>; errorMessage: string}, {folderName: string; open: boolean}> {

    localizationService: LfLocalizationService = new LfLocalizationService(resources);
    closeOnEscapeKeyDown = (e:KeyboardEvent) => {
        if ((e.code === 'Escape')) {
            this.props.onClose();
        }
    };

    constructor(props: any) {
        super(props);
        this.setState({
          folderName: '',
          open: false});
    }

    componentDidMount() {
      document.body.addEventListener("keydown", this.closeOnEscapeKeyDown);
      const container = document.getElementById('new-folder-dialog-content');
      container?.addEventListener("focusout", (ev)=>{
        if (!container.contains(ev.relatedTarget as Node)) 
        document.getElementById('new-folder-dialog-modal-close-dialog')?.focus();
      });
      setTimeout(() => {
        this.setState({open: true});
        document.getElementById('new-folder-name-input')?.focus();
      });
    }

    handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        const folderName = target?.value;

        this.setState({
          folderName: folderName
        });
    };

    closeDialog = (folderName?: string) => {
        this.props.onClose(folderName);
    };

    render() {

    return (
      <div className="new-folder-dialog-modal" onClick={() => this.closeDialog()}>
        <div className={`new-folder-dialog-modal-content ${this.state?.open ? 'show' : ''}`} id="new-folder-dialog-content" onClick={e => e.stopPropagation()}>
            <div className="new-folder-dialog-modal-title"> 
            <span className="lf-dialog-title lf-popup-dialog-title">{this.NEW_FOLDER}</span>
            <button className="lf-close-button" id="new-folder-dialog-modal-close-dialog" onClick={() => this.closeDialog()}>
                <span id="new-folder-dialog-close-icon" className="material-icons">close</span>
            </button>
            </div>
          <div className="lf-dialog-message">
            <p hidden={!this.props.errorMessage} className="popup-error">{this.props.errorMessage}</p>  
            <p className="new-folder-label">{this.NAME}</p>
                <input id="new-folder-name-input" className="new-folder-name-input" onChange={e => this.handleInputChange(e)} ></input>
        </div>
        <div className="lf-dialog-actions">
            <button onClick={() => this.closeDialog(this.state?.folderName)} disabled={!this.state?.folderName || this.state?.folderName.trim().length === 0} className="lf-button primary-button">{this.OK}</button>
            <button onClick={() => this.closeDialog()} className="lf-button sec-button margin-left-button">{this.CANCEL}</button>
        </div>
        </div>
      </div>
    );

  }

  NAME = this.localizationService.getString('NAME');
  OK = this.localizationService.getString('OK');
  CANCEL = this.localizationService.getString('CANCEL');
  NEW_FOLDER = this.localizationService.getString('NEW_FOLDER');
}