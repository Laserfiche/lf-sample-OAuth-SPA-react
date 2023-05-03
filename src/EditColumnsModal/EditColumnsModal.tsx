import { LfLocalizationService } from "@laserfiche/lf-js-utils";
import React from "react";
import { ColumnDef } from '@laserfiche/types-lf-ui-components';
import './EditColumnsModal.css';

const resources: Map<string, object> = new Map<string, object>([
    ['en-US', {
      'NAME': 'Name',
      'OK': 'Ok',
      'CANCEL': 'Cancel',
      'ADD_REMOVE_COLUMNS': 'Add/Remove Columns',
    }],
    ['es-MX', {
      'NAME': 'Name -Spanish',
      'OK': 'Ok - Spanish',
      'CANCEL': 'Cancel - Spanish',
      'ADD_REMOVE_COLUMNS': 'Add/Remove Columns - Spanish',
    }]
]);

export default class EditColumnsModal extends React.Component<{onClose: (columns?: ColumnDef[]) => Promise<void>; errorMessage: string; initialColumnsSelected: ColumnDef[];allColumnOptions: ColumnDef[] }, {columnsSelected: ColumnDef[]; open: boolean}> {

    localizationService: LfLocalizationService = new LfLocalizationService(resources);
    closeOnEscapeKeyDown = (e:KeyboardEvent) => {
        if ((e.code === 'Escape')) {
            this.props.onClose();
        }
    };

    constructor(props: any) {
        super(props);
        this.state = {
            columnsSelected: this.props.initialColumnsSelected,
            open: false

        };
        console.log(this.state.columnsSelected);
    }

    componentDidMount() {
        document.body.addEventListener("keydown", this.closeOnEscapeKeyDown);
        const container = document.getElementById('edit-columns-dialog-content');
        container?.addEventListener("focusout", (ev)=>{
          if (!container.contains(ev.relatedTarget as Node)) 
          document.getElementById('edit-columns-dialog-modal-close-dialog')?.focus();
        });
        setTimeout(() => {
            this.setState({open: true});
          document.getElementById('edit-columns-name-input')?.focus();
        });
      }
  
  
      closeDialog = (columns?: ColumnDef[]) => {
          this.props.onClose(columns);
      };

      onCheckboxChange(column: ColumnDef) {
        // we provide a new array (not just new values) to trigger change detection
        let newSelected: ColumnDef[];
        if (this.state.columnsSelected.includes(column)) {
            newSelected = this.state.columnsSelected.filter(c => c != column).map(value => value);
        } else {
            newSelected = this.state.columnsSelected.map(value => value);
            newSelected.push(column);
        }
        this.setState({columnsSelected: newSelected});
      }


      render() {

        return (
            <div className="edit-columns-dialog-modal" onClick={() => this.closeDialog()}>
                <div className={`edit-columns-dialog-modal-content ${this.state?.open ? 'show' : ''}`}  id="edit-columns-dialog-content" onClick={e => e.stopPropagation()}>
                    <div className="edit-columns-dialog-modal-title">
                        <span className="lf-dialog-title lf-popup-dialog-title">{this.ADD_REMOVE_COLUMNS}</span>
                        <button className="lf-close-buttton" id="edit-columns-dialog-modal-close-dialog" onClick={()=> this.closeDialog()}>
                            <span id="edit-columns-dialog-close-icon" className="material-icons">close</span>
                        </button>
                    </div>
                    <div className="lf-dialog-message">
                        <p hidden={!this.props.errorMessage} className="popup-error">{this.props.errorMessage}</p>
                        <div className="column-list">
                            {this.props.allColumnOptions.map((column: ColumnDef) => (
                                <div key={column.id}>
                                    <input type="checkbox" checked={this.state.columnsSelected.includes(column)} id={`${column.id}-checkbox`} onChange={() => this.onCheckboxChange(column)}></input>
                                    <label htmlFor={`${column.id}-checkbox`}>  {column.displayName}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lf-dialog-actions">
                        <button onClick={() => this.closeDialog(this.state.columnsSelected)} className="lf-button primary-button">{this.OK}</button>
                        <button onClick={() => this.closeDialog()} className="lf-button sec-button margin-left-button">{this.CANCEL}</button>
                    </div>
                </div>
            </div>
        );
      }
      OK = this.localizationService.getString('OK');
      CANCEL = this.localizationService.getString('CANCEL');
      ADD_REMOVE_COLUMNS: string = this.localizationService.getString("ADD_REMOVE_COLUMNS");
}