import { LfLocalizationService } from "@laserfiche/lf-js-utils";
import React from "react";
import './Modal.css';

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
export default class Modal extends React.Component<{onClose: (folderName?: string) => void; errorMessage: string}, {folderName: string}> {

    localizationService: LfLocalizationService = new LfLocalizationService(resources);
    closeOnEscapeKeyDown = (e:KeyboardEvent) => {
        if ((e.code === 'Escape')) {
            this.props.onClose();
        }
    };

    constructor(props: any) {
        super(props);
        this.setState({folderName: ''});
    }

    componentDidMount() {
      setTimeout(() => {
        document.body.addEventListener("keydown", this.closeOnEscapeKeyDown);
        document.getElementById('new-folder-name-input')?.focus();
      });
    }

    handleInputChange = (event: any) => {
        const target = event.target;
        const value = target.value;

        this.setState({
          folderName: value
        });
    };

    render() {

    return (
      <div className="new-folder-dialog-modal" onClick={() => this.props.onClose()}>
        <div className="new-folder-dialog-modal-content" onClick={e => e.stopPropagation()}>
            <div className="new-folder-dialog-modal-title"> 
            <span className="lf-dialog-title lf-popup-dialog-title">{this.NEW_FOLDER}</span>
            <button className="lf-close-button" onClick={() => this.props.onClose()}>
                <span id="new-folder-dialog-close-icon" className="material-icons">close</span>
            </button>
            </div>
          <div className="lf-dialog-message">
            <p hidden={!this.props.errorMessage} className="popup-error">{this.props.errorMessage}</p>  
            <p className="new-folder-label">{this.NAME}</p>
                <input id="new-folder-name-input" className="new-folder-name-input" onChange={this.handleInputChange} ></input>
        </div>
        <div className="lf-dialog-actions">
            <button onClick={() => this.props.onClose(this.state?.folderName)} disabled={!this.state?.folderName || this.state?.folderName.trim().length === 0} className="lf-button primary-button">{this.OK}</button>
            <button onClick={() => this.props.onClose()} className="lf-button sec-button margin-left-button">{this.CANCEL}</button>
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