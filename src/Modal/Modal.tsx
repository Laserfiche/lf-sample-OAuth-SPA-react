import React from "react";
import './Modal.css';

export default class Modal extends React.Component<{show: boolean; onClose: (folderName?: string) => void}, {folderName: string}> {

    newFolderNameInput: React.RefObject<HTMLInputElement>;
    closeOnEscapeKeyDown = (e:KeyboardEvent) => {
        if ((e.code === 'Escape')) {
            this.props.onClose();
        }
    };

    constructor(props: any) {
        super(props);
        this.setState({folderName: ''});
        this.newFolderNameInput = React.createRef();
    }

    componentDidMount() {
        document.body.addEventListener("keydown", this.closeOnEscapeKeyDown);
        this.newFolderNameInput.current?.focus();
    }

    handleInputChange = (event: any) => {
        const target = event.target;
        const value = target.value;

        this.setState({
          folderName: value
        });
    };

    render() {
    if (!this.props.show) {
        return null;
    }

    return (
      <div className="new-folder-dialog-modal" onClick={() => this.props.onClose()}>
        <div className="new-folder-dialog-modal-content" onClick={e => e.stopPropagation()}>
            <div className="new-folder-dialog-modal-title"> 
            <span className="lf-dialog-title lf-popup-dialog-title">New Folder</span>
            <button className="lf-close-button" onClick={() => this.props.onClose()}>
                <span id="new-folder-dialog-close-icon" className="material-icons">close</span>
            </button>
            </div>
          <div className="lf-dialog-message">
            <p className="new-folder-label">Name</p>
                <input ref={this.newFolderNameInput} className="new-folder-name-input" onChange={this.handleInputChange} ></input>
        </div>
        <div className="lf-dialog-actions">
            <button onClick={() => this.props.onClose(this.state?.folderName)} className="lf-button primary-button">OK</button>
            <button onClick={() => this.props.onClose()} className="lf-button sec-button margin-left-button">Cancel</button>
        </div>
        </div>
      </div>
    );

  }
}