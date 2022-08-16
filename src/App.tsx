import React from 'react';
import './App.css';
import { LfFieldContainerComponent, LfFileExplorerComponent, LfLoginComponent, TreeNode } from '@laserfiche/types-lf-ui-components';
import { NgElement, WithProperties } from '@angular/elements';
import { LfLocalizationService } from '@laserfiche/lf-js-utils';
import { IRepositoryApiClientEx, LfFieldsService, LfFolder, LfRepoTreeEntryType, LfRepoTreeService } from '@laserfiche/lf-ui-components-services';
import { PathUtils } from '@laserfiche/lf-js-utils';
import { PostEntryWithEdocMetadataRequest, RepositoryApiClient, FileParameter, PutFieldValsRequest, IRepositoryApiClient, FieldToUpdate, ValueToUpdate } from '@laserfiche/lf-repository-api-client';
import { getEntryWebAccessUrl } from './url-utils';

const resources: Map<string, object> = new Map<string, object>([
  ['en-US', {
    'FOLDER_BROWSER_PLACEHOLDER': 'No folder selected',
    'SAVE_TO_LASERFICHE': 'Save to Laserfiche',
    'CLICK_TO_UPLOAD': 'Click to upload file',
    'SELECTED_FOLDER': 'Selected Folder: ',
    'FILE_NAME': 'File Name: ',
    'BROWSE': 'Browse',
    'OPEN_IN_LASERFICHE': 'Open in Laserfiche',
    'SELECT': 'Select',
    'CANCEL': 'Cancel',
    'ERROR_SAVING': 'Error Saving'
  }],
  ['es-MX', {
    'FOLDER_BROWSER_PLACEHOLDER': 'No folder selected - Spanish',
    'SAVE_TO_LASERFICHE': 'Save to Laserfiche - Spanish',
    'CLICK_TO_UPLOAD': 'Click to upload file - Spanish',
    'SELECTED_FOLDER': 'Selected Folder: - Spanish',
    'FILE_NAME': 'File Name: - Spanish',
    'BROWSE': 'Browse - Spanish',
    'OPEN_IN_LASERFICHE': 'Open in Laserfiche - Spanish',
    'SELECT': 'Select - Spanish',
    'CANCEL': 'Cancel - Spanish',
    'ERROR_SAVING': 'Error Saving - Spanish'
  }]
]);

interface IRepositoryApiClientExInternal extends IRepositoryApiClientEx {
  clearCurrentRepo: () => void;
  _repoId?: string;
  _repoName?: string;
}

export default class App extends React.Component<{}, { expandFolderBrowser: boolean, selectedFolder: LfFolder | undefined, selectedFile?: File; isLoggedIn: boolean }> {
  REDIRECT_URI: string = 'REPLACE_WITH_YOUR_REDIRECT_URI'; // i.e http://localhost:3000, https://serverName/lf-sample/index.html
  CLIENT_ID: string = 'REPLACE_WITH_YOUR_CLIENT_ID';
  HOST_NAME: string = ''; // only add this if you are using a different region or environment (i.e. laserfiche.ca, eu.laserfiche.com)
  REGIONAL_DOMAIN: string = 'laserfiche.com' // only update this if you are using a different region or environment

  loginComponent: React.RefObject<NgElement & WithProperties<LfLoginComponent>>;
  folderBrowser: React.RefObject<NgElement & WithProperties<LfFileExplorerComponent>>;
  repoClient?: IRepositoryApiClientExInternal;
  creationDate?: string;
  lfRepoTreeService?: LfRepoTreeService;
  selectedNodeUrl: string | undefined;
  selectedFolderDisplayName: string | undefined;
  fileName: string | undefined;
  fileExtension: string | undefined;
  fileInput: React.RefObject<HTMLInputElement> | undefined;
  fieldContainer: React.RefObject<NgElement & WithProperties<LfFieldContainerComponent>>;
  fieldsService?: LfFieldsService;
  localizationService = new LfLocalizationService(resources);

  constructor(props: any) {
    super(props);
    this.loginComponent = React.createRef();
    this.folderBrowser = React.createRef();
    this.fileInput = React.createRef();
    this.fieldContainer = React.createRef();
    this.setState(() => { return { expandFolderBrowser: false, isLoggedIn: false, selectedFolder: undefined } });
  }

  componentDidMount = async () => {
    this.loginComponent?.current?.addEventListener('loginCompleted', this.loginCompleted);
    this.loginComponent?.current?.addEventListener('logoutCompleted', this.logoutCompleted);
    this.fileInput?.current?.addEventListener('change', this.selectFile);
    await this.getAndInitializeRepositoryClientAndServicesAsync();
  }

  // login handlers and helpers

  loginCompleted = async () => {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
  }

  logoutCompleted = () => {
    this.setState(() => { return { isLoggedIn: false } });
  }

  private async getAndInitializeRepositoryClientAndServicesAsync() {
    const accessToken = this.loginComponent?.current?.authorization_credentials?.accessToken;
    if (accessToken) {
      this.setState(() => { return { isLoggedIn: true } });
      await this.ensureRepoClientInitializedAsync();

      // create the tree service to interact with the LF Api
      this.lfRepoTreeService = new LfRepoTreeService(this.repoClient!);
      // by default all entries are viewable
      this.lfRepoTreeService.viewableEntryTypes = [LfRepoTreeEntryType.Folder, LfRepoTreeEntryType.ShortcutFolder];

      // create the fields service to let the field component interact with Laserfiche
      this.fieldsService = new LfFieldsService(this.repoClient!);
      this.fieldContainer.current?.addEventListener('dialogOpened', this.onDialogOpened);
      this.fieldContainer.current?.addEventListener('dialogClosed', this.onDialogClosed);
      await this.fieldContainer.current?.initAsync(this.fieldsService);
    }
    else {
      // user is not logged in
    }
  }

  private beforeFetchRequestAsync = async (url: string, request: RequestInit) => {
    // TODO trigger authorization flow if no accessToken
    const accessToken = this.loginComponent?.current?.authorization_credentials?.accessToken;
    if (accessToken) {
      this.addAuthorizationHeader(request, accessToken);
      return { regionalDomain: this.REGIONAL_DOMAIN } // update this if you are using a different region
    }
    else {
      throw new Error('No access token');
    }
  }

  private afterFetchResponseAsync = async (url: string, response: ResponseInit, request: RequestInit) => {
    if (response.status === 401) {
      const refresh = await this.loginComponent.current?.refreshTokenAsync(true);
      if (refresh) {
        const accessToken = this.loginComponent.current?.authorization_credentials?.accessToken;
        this.addAuthorizationHeader(request, accessToken);
        return true;
      }
      else {
        this.repoClient?.clearCurrentRepo();
        return false;
      }
    }
    return false;
  }

  private getCurrentRepo = async () => {
    const repos = await this.repoClient!.repositoriesClient.getRepositoryList({});
    const repo = repos[0];
    if (repo.repoId && repo.repoName) {
      return { repoId: repo.repoId, repoName: repo.repoName };
    }
    throw new Error('Current repoId undefined.')
  };

  async ensureRepoClientInitializedAsync(): Promise<void> {
    if (!this.repoClient) {
      const partialRepoClient: IRepositoryApiClient =
        RepositoryApiClient.createFromHttpRequestHandler(
          {
            beforeFetchRequestAsync: this.beforeFetchRequestAsync,
            afterFetchResponseAsync: this.afterFetchResponseAsync
          });
      const clearCurrentRepo = () => {
        this.repoClient!._repoId = undefined;
        this.repoClient!._repoName = undefined;
      }
      this.repoClient = {
        clearCurrentRepo,
        _repoId: undefined,
        _repoName: undefined,
        getCurrentRepoId: async () => {
          if (this.repoClient?._repoId) {
            console.log('getting id from cache')
            return this.repoClient._repoId
          }
          else {
            console.log('getting id from api')
            const repo = (await this.getCurrentRepo()).repoId;
            this.repoClient!._repoId = repo;
            return repo;
          }
        },
        getCurrentRepoName: async () => {
          if (this.repoClient?._repoName) {
            return this.repoClient._repoName;
          }
          else {
            const repo = (await this.getCurrentRepo()).repoName;
            this.repoClient!._repoName = repo;
            return repo;
          }
        },
        ...partialRepoClient
      }
    }
  }


  private addAuthorizationHeader(request: RequestInit, accessToken: string | undefined) {
    const headers: Headers | undefined = new Headers(request.headers);
    const AUTH = 'Authorization';
    headers.set(AUTH, 'Bearer ' + accessToken);
    request.headers = headers;
  }

  // folder-browser handlers

  private getFolderPathTooltip(path: string): string {
    const FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
    return path ? PathUtils.createDisplayPath(path) : FOLDER_BROWSER_PLACEHOLDER;
  }

  private getFolderNameText(entryId: number, path: string): string {
    if (path) {
      const displayPath: string = path;
      if (!entryId) {
        return displayPath;
      }
      else {
        const baseName: string = PathUtils.getLastPathSegment(displayPath);
        if (!baseName || baseName.length === 0) {
          return '\\';
        }
        else {
          return baseName;
        }
      }
    }
    else {
      return this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
    }
  }

  onOkClick = async (ev: Event) => {
    const selectedNode = (ev as CustomEvent<TreeNode>).detail;
    const breadcrumbs = this.folderBrowser.current?.breadcrumbs;
    const entryId = Number.parseInt(selectedNode.id, 10);
    const path = selectedNode.path;
    const selectedFolder: LfFolder = {
      entryId,
      path,
      displayName: this.getFolderNameText(entryId, path),
      displayPath: this.getFolderPathTooltip(path)
    };
    if (breadcrumbs) {
      selectedFolder.breadcrumbs = breadcrumbs;
    }
    const nodeId = selectedNode.id;
    const repoId = (await this.repoClient?.getCurrentRepoId());
    const waUrl = this.loginComponent.current?.account_endpoints?.webClientUrl;
    this.selectedNodeUrl = getEntryWebAccessUrl(nodeId, repoId!, waUrl!, selectedNode.isContainer);
    this.selectedFolderDisplayName = selectedFolder?.displayName;
    this.setState(() => { return { expandFolderBrowser: false, selectedFolder: selectedFolder } });
  }
  folderCancelClick = () => {
    this.setState(() => { return { expandFolderBrowser: false } });
  }

  onClickBrowse = async () => {
    this.setState(() => { return { expandFolderBrowser: true } }, async () => {
      await this.initializeTreeAsync()
    });
  }

  async initializeTreeAsync() {
    this.folderBrowser.current?.addEventListener('okClick', this.onOkClick);
    this.folderBrowser.current?.addEventListener('cancelClick', this.folderCancelClick);
    await this.folderBrowser?.current?.initAsync({
      treeService: this.lfRepoTreeService!
    });
  }

  // metadata handlers

  onDialogOpened = () => {
    // "hack" for add remove dialog on smaller screen
    window.scrollTo({ top: 0, left: 0 });
    document.body.style.overflow = 'hidden';
  }

  onDialogClosed = () => {
    // "hack" for add remove dialog on smaller screen
    document.body.scrollTo({ top: 0, left: 0 });
    document.body.style.overflow = 'auto';
  }

  private async createMetadataRequestAsync(): Promise<PostEntryWithEdocMetadataRequest> {
    const fieldValues = this.fieldContainer?.current?.getFieldValues() ?? {};
    const templateName = this.fieldContainer?.current?.getTemplateValue()?.name ?? '';
    let formattedFieldValues: {
      [key: string]: FieldToUpdate;
    } | undefined = {};

    for (const key in fieldValues) {
      const value = fieldValues[key];
      formattedFieldValues[key] = new FieldToUpdate({ ...value, values: value!.values!.map(val => new ValueToUpdate(val)) });
    }

    const requestMetadata: PostEntryWithEdocMetadataRequest = this.getPostEntryRequest(templateName, formattedFieldValues);
    return requestMetadata;
  }

  private getPostEntryRequest(templateName: string | undefined, allFields: {
    [key: string]: FieldToUpdate;
  }): PostEntryWithEdocMetadataRequest {
    const entryRequest: PostEntryWithEdocMetadataRequest = new PostEntryWithEdocMetadataRequest({
      metadata: new PutFieldValsRequest({
        fields: allFields
      })
    });
    if (templateName && templateName.length > 0) {
      entryRequest.template = templateName;
    }
    return entryRequest;
  }

  // input handler methods

  get displayFileName(): string {
    const rawFileName = this.state?.selectedFile?.name ?? '';
    return PathUtils.removeFileExtension(rawFileName);
  }

  onInputAreaClick = () => {
    this.fileInput?.current?.click();
  }

  selectFile = () => {
    const files = this.fileInput?.current?.files;
    const fileSelected = files?.item(0) ?? undefined;
    this.fileName = PathUtils.removeFileExtension(fileSelected?.name ?? '');
    this.fileExtension = PathUtils.getFileExtension(fileSelected?.name ?? '');
    this.setState(() => { return { selectedFile: fileSelected } });
  }

  clearFileSelected = () => {
    // TODO this causes a loud warning because it changes the component to controlled
    this.fileInput!.current!.files = null;
    this.fileName = undefined;
    this.fileExtension = undefined;
    this.setState(() => { return { selectedFile: undefined } })
  }

  updateFileName = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.fileName = ev.target.value;
  }

  // save handlers/helpers

  onClickSave = async () => {
    const valid = this.fieldContainer?.current?.forceValidation();
    if (valid) {
      const fileNameWithExtension = this.fileName + '.' + this.fileExtension;
      const edocBlob: FileParameter = { data: (this.state?.selectedFile as Blob), fileName: fileNameWithExtension };
      const parentEntryId = this.state?.selectedFolder!.entryId!;

      const metadataRequest = await this.createMetadataRequestAsync();
      const entryRequest: PostEntryWithEdocMetadataRequest = new PostEntryWithEdocMetadataRequest({
        metadata: metadataRequest.metadata,
        template: metadataRequest.template
      });
      await this.repoClient?.entriesClient.importDocument({
        repoId: (await this.repoClient.getCurrentRepoId()),
        parentEntryId,
        fileName: this.fileName!,
        autoRename: true,
        electronicDocument: edocBlob,
        request: entryRequest
      });
      window.alert('Successfully saved document to Laserfiche')
    }
    else {
      console.warn('metadata invalid');
      window.alert('One or more fields is invalid. Please fix and try again');
    }
  }

  get enableSave(): boolean {
    const fileSelected: boolean = !!this.state?.selectedFile;
    const folderSelected: boolean = !!this.state?.selectedFolder;

    return fileSelected && folderSelected;
  }

  async onClickRefreshAsync() {
    await this.loginComponent.current?.refreshTokenAsync(true);
  }

  // react render method
  render() {
    return (
      <div className="App">
        <header className="App-header"></header>
        <h2 className="lf-sample-app-title">Save to Laserfiche Sample Application</h2>

        <div className="lf-component-container lf-right-button">
          <lf-login redirect_uri={this.REDIRECT_URI}
            authorize_url_host_name={this.HOST_NAME} redirect_behavior="Replace" client_id={this.CLIENT_ID}
            ref={this.loginComponent}>
          </lf-login>
        </div>

        <div hidden={!this.state?.isLoggedIn}>

          <button className="lf-refresh-button" onClick={() => this.onClickRefreshAsync()}>Refresh</button>
          <div className="folder-browse-select lf-component-container">
            <span>
              {this.FILE_NAME}
              <input disabled={this.state?.selectedFile === undefined} type="text" value={this.displayFileName} onChange={this.updateFileName} />
              .{this.fileExtension}
            </span>
            <div>
              <button className="lf-button primary-button" onClick={this.onInputAreaClick}>{this.CLICK_TO_UPLOAD}</button>
              <input ref={this.fileInput} type="file" hidden />

              <button className="lf-multivalue-remove-button" disabled={!this.state?.selectedFile} onClick={this.clearFileSelected}>
                <svg id="close" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                  <path
                    d="M19 6.41l-1.41-1.41-5.59 5.59-5.59-5.59-1.41 1.41 5.59 5.59-5.59 5.59 1.41 1.41 5.59-5.59 5.59 5.59 1.41-1.41-5.59-5.59z" />
                </svg>
              </button>
            </div>
          </div >

          <div className="lf-component-container">
            <div className="folder-browse-select">
              {this.SELECTED_FOLDER}: {this.state?.selectedFolder?.displayName ?? this.FOLDER_BROWSER_PLACEHOLDER}
              <button onClick={this.onClickBrowse} hidden={this.state?.expandFolderBrowser} className="lf-button primary-button" >{this.BROWSE}</button>
            </div>
            <a hidden={!this.selectedNodeUrl} className="open-in-lf-link" href={this.selectedNodeUrl} target="_blank"
              rel="noopener noreferrer">{this.OPEN_IN_LASERFICHE}</a>
            <div className="lf-folder-browser-sample-container">
              {this.state?.expandFolderBrowser && <lf-folder-browser ref={this.folderBrowser}
                ok_button_text="SELECT" cancel_button_text="CANCEL">
              </lf-folder-browser>}
            </div>
          </div>

          <div className="lf-component-container">
            <lf-field-container ref={this.fieldContainer} collapsible="true" startCollapsed="true">
            </lf-field-container>
          </div>
          <div className="lf-component-container lf-right-button">
            <button className="lf-button primary-button" disabled={!this.enableSave} onClick={this.onClickSave}>{this.SAVE_TO_LASERFICHE}</button>
          </div>
        </div>
      </div >
    );
  }

  // localization helpers

  BROWSE = this.localizationService.getString('BROWSE');
  FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString('FOLDER_BROWSER_PLACEHOLDER');
  SAVE_TO_LASERFICHE = this.localizationService.getString('SAVE_TO_LASERFICHE');
  CLICK_TO_UPLOAD = this.localizationService.getString('CLICK_TO_UPLOAD');
  SELECTED_FOLDER = this.localizationService.getString('SELECTED_FOLDER');
  FILE_NAME = this.localizationService.getString('FILE_NAME');
  OPEN_IN_LASERFICHE = this.localizationService.getString('OPEN_IN_LASERFICHE');
  SELECT = this.localizationService.getString('SELECT');
  CANCEL = this.localizationService.getString('CANCEL');

}
