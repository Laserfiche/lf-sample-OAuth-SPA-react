import React from "react";
import "./App.css";
import {
  LfFieldContainerComponent,
  LfLoginComponent,
  LfRepositoryBrowserComponent,
  LfToolbarComponent,
  LfTreeNode,
  ToolbarOption,
  ColumnDef,
} from "@laserfiche/types-lf-ui-components";
import { NgElement, WithProperties } from "@angular/elements";
import { LfLocalizationService } from "@laserfiche/lf-js-utils";
import {
  IRepositoryApiClientEx,
  LfFieldsService,
  LfRepoTreeNode,
  LfRepoTreeNodeService,
} from "@laserfiche/lf-ui-components-services";
import { PathUtils } from "@laserfiche/lf-js-utils";
import {
  PostEntryWithEdocMetadataRequest,
  RepositoryApiClient,
  FileParameter,
  PutFieldValsRequest,
  IRepositoryApiClient,
  FieldToUpdate,
  ValueToUpdate,
  EntryType,
  Shortcut,
  PostEntryChildrenRequest,
  PostEntryChildrenEntryType,
} from "@laserfiche/lf-repository-api-client";
import { getEntryWebAccessUrl } from "./url-utils";
import NewFolderModal from "./NewFolderModal/NewFolderModal";
import EditColumnsModal from "./EditColumnsModal/EditColumnsModal";

const resources: Map<string, object> = new Map<string, object>([
  [
    "en-US",
    {
      FOLDER_BROWSER_PLACEHOLDER: "No folder selected",
      SAVE_TO_LASERFICHE: "Save to Laserfiche",
      CLICK_TO_UPLOAD: "Click to upload file",
      SELECTED_FOLDER: "Selected Folder: ",
      FILE_NAME: "File Name: ",
      BROWSE: "Browse",
      OPEN_IN_LASERFICHE: "Open in Laserfiche",
      OPEN: "Open",
      REFRESH: "Refresh",
      NEW_FOLDER: "New Folder",
      ADD_REMOVE_COLUMNS: "Add/Remove Columns",
      SELECT: "Select",
      CANCEL: "Cancel",
      ERROR_SAVING: "Error Saving",
      UNKNOWN_ERROR: "Unknown Error",
    },
  ],
  [
    "es-MX",
    {
      FOLDER_BROWSER_PLACEHOLDER: "No folder selected - Spanish",
      SAVE_TO_LASERFICHE: "Save to Laserfiche - Spanish",
      CLICK_TO_UPLOAD: "Click to upload file - Spanish",
      SELECTED_FOLDER: "Selected Folder: - Spanish",
      FILE_NAME: "File Name: - Spanish",
      BROWSE: "Browse - Spanish",
      OPEN_IN_LASERFICHE: "Open in Laserfiche - Spanish",
      OPEN: "Open - Spanish",
      REFRESH: "Refresh - Spanish",
      NEW_FOLDER: "New Folder - Spanish",
      ADD_REMOVE_COLUMNS: "Add/Remove Columns - Spanish",
      SELECT: "Select - Spanish",
      CANCEL: "Cancel - Spanish",
      ERROR_SAVING: "Error Saving - Spanish",
      UNKNOWN_ERROR: "Unknown Error - Spanish",
    },
  ],
]);

interface IRepositoryApiClientExInternal extends IRepositoryApiClientEx {
  clearCurrentRepo: () => void;
  _repoId?: string;
  _repoName?: string;
}

interface ILfSelectedFolder {
  selectedNodeUrl: string; // url to open the selected node in Web Client
  selectedFolderPath: string; // path of selected folder
  selectedFolderName: string; // name of the selected folder
}

export default class App extends React.Component<
  any,
  {
    expandFolderBrowser: boolean;
    lfSelectedFolder?: ILfSelectedFolder;
    selectedFile?: File;
    isLoggedIn: boolean;
    shouldShowOpen: boolean;
    shouldShowSelect: boolean;
    shouldDisableSelect: boolean;
    showNewFolderDialog: boolean;
    showEditColumnsDialog: boolean;
    popupErrorMessage: string;
    selectedColumns: ColumnDef[];
    allPossibleColumns: ColumnDef[];
  }
> {
  REDIRECT_URI: string = "http://localhost:3000"; // i.e http://localhost:3000, https://serverName/lf-sample/index.html
  SCOPE: string = "repository.Read repository.Write"; // Scope(s) requested by the app
  CLIENT_ID: string = "6bd54321-2737-4a42-985d-abac41375af5";
  HOST_NAME: string = "a.clouddev.laserfiche.com"; // only add this if you are using a different environment (e.g. a.clouddev.laserfiche.com)

  loginComponent: React.RefObject<NgElement & WithProperties<LfLoginComponent>>;
  repositoryBrowser: React.RefObject<
    NgElement & WithProperties<LfRepositoryBrowserComponent>
  >;
  repoClient?: IRepositoryApiClientExInternal;
  creationDate?: string;
  lfRepoTreeService?: LfRepoTreeNodeService;
  fileName: string | undefined;
  fileExtension: string | undefined;
  fileInput: React.RefObject<HTMLInputElement> | undefined;
  fieldContainer: React.RefObject<
    NgElement & WithProperties<LfFieldContainerComponent>
  >;
  fieldsService?: LfFieldsService;
  localizationService: LfLocalizationService = new LfLocalizationService(
    resources
  );
  entrySelected: LfRepoTreeNode | undefined;
  toolBarElement: React.RefObject<
    NgElement & WithProperties<LfToolbarComponent>
  >;

  constructor(props: any) {
    super(props);
    this.loginComponent = React.createRef<
      NgElement & WithProperties<LfLoginComponent>
    >();
    this.repositoryBrowser = React.createRef();
    this.fileInput = React.createRef();
    this.fieldContainer = React.createRef();
    this.toolBarElement = React.createRef();
    const name: ColumnDef = {
      id: "name",
      displayName: "Name",
      defaultWidth: "auto",
      minWidthPx: 100,
      resizable: true,
      sortable: true,
    };
    const creationTime: ColumnDef = {
      id: "creationTime",
      displayName: "Creation Time",
      defaultWidth: "auto",
      resizable: true,
      sortable: true,
    };
    const lastModifiedTime: ColumnDef = {
      id: "lastModifiedTime",
      displayName: "Last Modified Time",
      defaultWidth: "auto",
      resizable: true,
      sortable: true,
    };
    const pageCount: ColumnDef = {
      id: "pageCount",
      displayName: "Page Count",
      defaultWidth: "auto",
      resizable: true,
      sortable: true,
    };
    const templateName: ColumnDef = {
      id: "templateName",
      displayName: "Template Name",
      defaultWidth: "auto",
      resizable: true,
      sortable: true,
    };
    const creator: ColumnDef = {
      id: "creator",
      displayName: "Author",
      defaultWidth: "auto",
      resizable: true,
      sortable: true,
    };
    this.state = {
      expandFolderBrowser: false,
      isLoggedIn: false,
      lfSelectedFolder: undefined,
      shouldShowOpen: false,
      shouldShowSelect: false,
      shouldDisableSelect: false,
      showNewFolderDialog: false,
      showEditColumnsDialog: false,
      popupErrorMessage: "",
      allPossibleColumns: [
        creationTime,
        lastModifiedTime,
        pageCount,
        templateName,
        creator,
      ],
      selectedColumns: [name, creationTime, creator],
    };
  }

  componentDidMount = async () => {
    this.loginComponent?.current?.addEventListener(
      "loginCompleted",
      this.loginCompleted
    );
    this.loginComponent?.current?.addEventListener(
      "logoutCompleted",
      this.logoutCompleted
    );
    this.fileInput?.current?.addEventListener("change", this.selectFile);
    await this.getAndInitializeRepositoryClientAndServicesAsync();
  };

  // login handlers and helpers

  loginCompleted = async () => {
    await this.getAndInitializeRepositoryClientAndServicesAsync();
  };

  logoutCompleted = () => {
    this.setState({ isLoggedIn: false });
  };

  private async getAndInitializeRepositoryClientAndServicesAsync() {
    const accessToken =
      this.loginComponent?.current?.authorization_credentials?.accessToken;
    if (accessToken) {
      this.setState({ isLoggedIn: true });
      await this.ensureRepoClientInitializedAsync();

      if (!this.repoClient) {
        throw new Error("repoClient is undefined.");
      }
      // create the tree service to interact with the LF Api
      this.lfRepoTreeService = new LfRepoTreeNodeService(this.repoClient);
      // by default all entries are viewable
      this.lfRepoTreeService.viewableEntryTypes = [
        EntryType.Folder,
        EntryType.Shortcut,
        EntryType.RecordSeries,
      ];

      // create the fields service to let the field component interact with Laserfiche
      this.fieldsService = new LfFieldsService(this.repoClient);
      this.fieldContainer.current?.addEventListener(
        "dialogOpened",
        this.onDialogOpened
      );
      this.fieldContainer.current?.addEventListener(
        "dialogClosed",
        this.onDialogClosed
      );
      await this.fieldContainer.current?.initAsync(this.fieldsService);
    } else {
      // user is not logged in
    }
  }

  private beforeFetchRequestAsync = async (
    url: string,
    request: RequestInit
  ) => {
    // TODO trigger authorization flow if no accessToken
    const accessToken =
      this.loginComponent?.current?.authorization_credentials?.accessToken;
    if (accessToken) {
      this.addAuthorizationHeader(request, accessToken);
      let regionalDomain: string | undefined =
        this.loginComponent.current?.account_endpoints?.regionalDomain;
      if (!regionalDomain) {
        console.log('could not get regionalDomain from loginComponent');
        regionalDomain = this.HOST_NAME;
      }
      return { regionalDomain };
    } else {
      throw new Error("No access token");
    }
  };

  private afterFetchResponseAsync = async (
    url: string,
    response: ResponseInit,
    request: RequestInit
  ) => {
    if (response.status === 401) {
      const refresh = await this.loginComponent.current?.refreshTokenAsync(
        true
      );
      if (refresh) {
        const accessToken =
          this.loginComponent.current?.authorization_credentials?.accessToken;
        this.addAuthorizationHeader(request, accessToken);
        return true;
      } else {
        this.repoClient?.clearCurrentRepo();
        return false;
      }
    }
    return false;
  };

  private getCurrentRepo = async () => {
    const repos = await this.repoClient!.repositoriesClient.getRepositoryList(
      {}
    );
    const repo = repos[0];
    if (repo.repoId && repo.repoName) {
      return { repoId: repo.repoId, repoName: repo.repoName };
    }
    throw new Error("Current repoId undefined.");
  };

  async ensureRepoClientInitializedAsync(): Promise<void> {
    if (!this.repoClient) {
      const partialRepoClient: IRepositoryApiClient =
        RepositoryApiClient.createFromHttpRequestHandler({
          beforeFetchRequestAsync: this.beforeFetchRequestAsync,
          afterFetchResponseAsync: this.afterFetchResponseAsync,
        });
      const clearCurrentRepo = () => {
        this.repoClient!._repoId = undefined;
        this.repoClient!._repoName = undefined;
      };
      this.repoClient = {
        clearCurrentRepo,
        _repoId: undefined,
        _repoName: undefined,
        getCurrentRepoId: async () => {
          if (this.repoClient?._repoId) {
            console.log("getting id from cache");
            return this.repoClient._repoId;
          } else {
            console.log("getting id from api");
            const repo = (await this.getCurrentRepo()).repoId;
            this.repoClient!._repoId = repo;
            return repo;
          }
        },
        getCurrentRepoName: async () => {
          if (this.repoClient?._repoName) {
            return this.repoClient._repoName;
          } else {
            const repo = (await this.getCurrentRepo()).repoName;
            this.repoClient!._repoName = repo;
            return repo;
          }
        },
        ...partialRepoClient,
      };
    }
  }

  private addAuthorizationHeader(
    request: RequestInit,
    accessToken: string | undefined
  ) {
    const headers: Headers | undefined = new Headers(request.headers);
    const AUTH = "Authorization";
    headers.set(AUTH, "Bearer " + accessToken);
    request.headers = headers;
  }

  // folder-browser handlers

  private getFolderNameText(entryId: number, path: string): string {
    if (path) {
      const displayPath: string = path;
      if (!entryId) {
        return displayPath;
      } else {
        const baseName: string = PathUtils.getLastPathSegment(displayPath);
        if (!baseName || baseName.length === 0) {
          return "\\";
        } else {
          return baseName;
        }
      }
    } else {
      return this.localizationService.getString("FOLDER_BROWSER_PLACEHOLDER");
    }
  }

  onSelectFolder = async () => {
    if (!this.repoClient) {
      throw new Error("Repo Client is undefined.");
    }
    if (!this.loginComponent.current?.account_endpoints) {
      throw new Error("LfLoginComponent is not found.");
    }
    const selectedNode = this.repositoryBrowser.current
      ?.currentFolder as LfRepoTreeNode;
    let entryId = Number.parseInt(selectedNode.id, 10);
    const selectedFolderPath = selectedNode.path;
    if (selectedNode.entryType === EntryType.Shortcut) {
      if (selectedNode.targetId) entryId = selectedNode.targetId;
    }
    const repoId = await this.repoClient.getCurrentRepoId();
    const waUrl = this.loginComponent.current.account_endpoints.webClientUrl;
    this.setState({
      lfSelectedFolder: {
        selectedNodeUrl:
          getEntryWebAccessUrl(
            entryId.toString(),
            repoId,
            waUrl,
            selectedNode.isContainer
          ) ?? "",
        selectedFolderName: this.getFolderNameText(entryId, selectedFolderPath),
        selectedFolderPath: selectedFolderPath,
      },
      shouldShowOpen: false,
      expandFolderBrowser: false,
      shouldShowSelect: false,
    });
  };

  onClickCancelButton = () => {
    this.setState({
      expandFolderBrowser: false,
      shouldShowOpen: false,
      shouldShowSelect: false,
    });
  };

  onEntrySelected = (event: any) => {
    const treeNodesSelected: LfRepoTreeNode[] = event.detail;
    this.entrySelected =
      treeNodesSelected?.length > 0 ? treeNodesSelected[0] : undefined;
    this.updateToolbarOptions();
    this.setShouldShowOpen();
    this.setShouldShowSelect();
  };

  onClickBrowse = async () => {
    this.setState({ expandFolderBrowser: true }, async () => {
      this.lfRepoTreeService!.columnIds = this.state.allPossibleColumns.map(
        (columnDef) => columnDef.id
      );
      await this.initializeTreeAsync();
      this.initializeToolbar();
      this.setShouldShowOpen();
      this.setShouldShowSelect();
      this.setColumns(this.state.selectedColumns);
    });
  };

  async initializeTreeAsync() {
    if (!this.repoClient) {
      throw new Error("RepoId is undefined");
    }
    let focusedNode: LfRepoTreeNode | undefined;
    if (this.state?.lfSelectedFolder) {
      const repoId = await this.repoClient.getCurrentRepoId();
      const focusedNodeByPath =
        await this.repoClient.entriesClient.getEntryByPath({
          repoId: repoId,
          fullPath: this.state?.lfSelectedFolder.selectedFolderPath,
        });
      const repoName = await this.repoClient.getCurrentRepoName();
      const focusedNodeEntry = focusedNodeByPath?.entry;
      if (focusedNodeEntry) {
        focusedNode = this.lfRepoTreeService?.createLfRepoTreeNode(
          focusedNodeEntry,
          repoName
        );
      }
    }
    await this.repositoryBrowser?.current?.initAsync(
      this.lfRepoTreeService!,
      focusedNode
    );
    if (this.repositoryBrowser?.current) {
      this.repositoryBrowser.current.isSelectable = this.isNodeSelectable;
      this.repositoryBrowser.current.addEventListener(
        "entrySelected",
        this.onEntrySelected
      );
    }
  }

  isNodeSelectable = async (treenode: LfTreeNode) => {
    const node = treenode as LfRepoTreeNode;
    if (node?.entryType == EntryType.Folder) {
      return true;
    } else if (
      node?.entryType == EntryType.Shortcut &&
      node?.targetType == EntryType.Folder
    ) {
      return true;
    } else {
      return false;
    }
  };

  onOpenNode = async () => {
    await this.repositoryBrowser?.current?.openSelectedNodesAsync();
    this.setShouldShowOpen();
    this.setShouldShowSelect();
  };

  // metadata handlers
  onDialogOpened = () => {
    // "hack" for add remove dialog on smaller screen
    window.scrollTo({ top: 0, left: 0 });
    document.body.style.overflow = "hidden";
  };

  onDialogClosed = () => {
    // "hack" for add remove dialog on smaller screen
    document.body.scrollTo({ top: 0, left: 0 });
    document.body.style.overflow = "auto";
  };

  private updateToolbarOptions() {
    if (this.toolBarElement.current) {
      const selectedFolder = this.repositoryBrowser.current
        ?.currentFolder as LfRepoTreeNode;
      const newFolderOption = this.toolBarElement.current.dropdown_options[1];
      if (selectedFolder) {
        if (selectedFolder.entryType === EntryType.RecordSeries) {
          newFolderOption.disabled = true;
        } else {
          newFolderOption.disabled = false;
        }
      } else {
        newFolderOption.disabled = true;
      }
    }
  }

  private initializeToolbar() {
    if (this.toolBarElement.current) {
      this.toolBarElement.current.dropdown_options = [
        {
          name: this.REFRESH,
          disabled: false,
          tag: {
            handler: async () => {
              await this.repositoryBrowser?.current?.refreshAsync();
              console.log("refresh");
            },
          },
        },
        {
          name: this.NEW_FOLDER,
          disabled: false,
          tag: {
            handler: () => {
              this.setState({ showNewFolderDialog: true });
            },
          },
        },
        {
          name: this.ADD_REMOVE_COLUMNS,
          disabled: false,
          tag: {
            handler: () => {
              this.setState({ showEditColumnsDialog: true });
            },
          },
        },
      ];
      this.updateToolbarOptions();
      this.toolBarElement.current.addEventListener(
        "optionSelected",
        this.handleToolBarOption
      );
    }
  }

  handleToolBarOption = async (event: any) => {
    const toolbarSelected: ToolbarOption = event.detail;
    await toolbarSelected.tag.handler();
  };

  private async createMetadataRequestAsync(): Promise<PostEntryWithEdocMetadataRequest> {
    const fieldValues = this.fieldContainer?.current?.getFieldValues() ?? {};
    const templateName =
      this.fieldContainer?.current?.getTemplateValue()?.name ?? "";
    const formattedFieldValues:
      | {
          [key: string]: FieldToUpdate;
        }
      | undefined = {};

    for (const key in fieldValues) {
      const value = fieldValues[key];
      formattedFieldValues[key] = new FieldToUpdate({
        ...value,
        values: value!.values!.map((val) => new ValueToUpdate(val)),
      });
    }

    const requestMetadata: PostEntryWithEdocMetadataRequest =
      this.getPostEntryRequest(templateName, formattedFieldValues);
    return requestMetadata;
  }

  private getPostEntryRequest(
    templateName: string | undefined,
    allFields: {
      [key: string]: FieldToUpdate;
    }
  ): PostEntryWithEdocMetadataRequest {
    const entryRequest: PostEntryWithEdocMetadataRequest =
      new PostEntryWithEdocMetadataRequest({
        metadata: new PutFieldValsRequest({
          fields: allFields,
        }),
      });
    if (templateName && templateName.length > 0) {
      entryRequest.template = templateName;
    }
    return entryRequest;
  }

  // input handler methods

  get displayFileName(): string {
    const rawFileName = this.state?.selectedFile?.name ?? "";
    return PathUtils.removeFileExtension(rawFileName);
  }

  onInputAreaClick = () => {
    this.fileInput?.current?.click();
  };

  selectFile = () => {
    const files = this.fileInput?.current?.files;
    const fileSelected = files?.item(0) ?? undefined;
    this.fileName = PathUtils.removeFileExtension(fileSelected?.name ?? "");
    this.fileExtension = PathUtils.getFileExtension(fileSelected?.name ?? "");
    this.setState({ selectedFile: fileSelected });
  };

  clearFileSelected = () => {
    // TODO this causes a loud warning because it changes the component to controlled
    this.fileInput!.current!.files = null;
    this.fileName = undefined;
    this.fileExtension = undefined;
    this.setState({ selectedFile: undefined });
  };

  updateFileName = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.fileName = ev.target.value;
  };

  // save handlers/helpers

  onClickSave = async () => {
    if (!this.repoClient) {
      throw new Error("repoClient is undefined");
    }
    if (!this.state?.lfSelectedFolder) {
      throw new Error("no entry is selected");
    }
    const valid = this.fieldContainer?.current?.forceValidation();
    if (valid) {
      const fileNameWithExtension = this.fileName + "." + this.fileExtension;
      const edocBlob: FileParameter = {
        data: this.state?.selectedFile as Blob,
        fileName: fileNameWithExtension,
      };

      const metadataRequest = await this.createMetadataRequestAsync();
      const entryRequest: PostEntryWithEdocMetadataRequest =
        new PostEntryWithEdocMetadataRequest({
          metadata: metadataRequest.metadata,
          template: metadataRequest.template,
        });
      try {
        const repoId = await this.repoClient.getCurrentRepoId();
        const currentSelectedByPathResponse =
          await this.repoClient.entriesClient.getEntryByPath({
            repoId,
            fullPath: this.state.lfSelectedFolder.selectedFolderPath,
          });
        const currentSelectedEntry = currentSelectedByPathResponse.entry;
        if (!currentSelectedEntry?.id) {
          throw new Error("getEntryByPath returns entry with undefined id");
        }
        let parentEntryId = currentSelectedEntry.id;
        if (currentSelectedEntry.entryType == EntryType.Shortcut) {
          const shortcut = currentSelectedEntry as Shortcut;
          if (!shortcut.targetId) {
            throw new Error("shortcut has undefined targetId");
          }
          parentEntryId = shortcut.targetId;
        }
        await this.repoClient.entriesClient.importDocument({
          repoId: await this.repoClient.getCurrentRepoId(),
          parentEntryId,
          fileName: this.fileName ?? "",
          autoRename: true,
          electronicDocument: edocBlob,
          request: entryRequest,
        });
        window.alert("Successfully saved document to Laserfiche");
      } catch (err: any) {
        console.error(err);
        window.alert(
          `${this.localizationService.getString("ERROR_SAVING")}: ${
            err.message
          }`
        );
      }
    } else {
      console.warn("metadata invalid");
      window.alert("One or more fields is invalid. Please fix and try again");
    }
  };

  get enableSave(): boolean {
    const fileSelected: boolean = !!this.state?.selectedFile;
    const folderSelected: boolean = !!this.state?.lfSelectedFolder;

    return fileSelected && folderSelected;
  }

  async onClickRefreshAsync() {
    await this.loginComponent.current?.refreshTokenAsync(true);
  }

  async setShouldShowSelect() {
    if (this.repositoryBrowser?.current?.currentFolder) {
      const isSelectable = await this.isNodeSelectable(
        this.repositoryBrowser?.current?.currentFolder
      );
      this.setState({
        shouldShowSelect: !this.entrySelected && isSelectable,
      });
      return;
    }
    this.setState({
      shouldShowSelect: false,
    });
    return;
  }

  setColumns(columns: ColumnDef[]) {
    this.repositoryBrowser?.current?.setColumnsToDisplay(columns);
  }

  setShouldShowOpen(): void {
    this.setState({
      shouldShowOpen: !!this.entrySelected,
    });
  }

  hideNewFolderDialog = async (folderName?: string) => {
    if (folderName) {
      if (!this.repositoryBrowser?.current?.currentFolder) {
        throw new Error("repositoryBrowser has no currently opened folder.");
      }
      try {
        await this.addNewFolderAsync(
          this.repositoryBrowser?.current?.currentFolder,
          folderName
        );
        await this.repositoryBrowser?.current.refreshAsync();
        this.setState({ showNewFolderDialog: false });
      } catch (e: any) {
        if (e.title) {
          this.setState({ popupErrorMessage: e.title });
        } else {
          this.setState({ popupErrorMessage: this.UNKNOWN_ERROR });
        }
      }
    } else {
      this.setState({ showNewFolderDialog: false });
    }
  };

  hideEditColumnsDialog = (newColumns?: ColumnDef[]) => {
    if (newColumns) {
      this.setState({ selectedColumns: newColumns });
      this.setColumns(newColumns);
    }
    this.setState({ showEditColumnsDialog: false });
  };

  async addNewFolderAsync(
    parentNode: LfTreeNode,
    folderName: string
  ): Promise<void> {
    if (!this.repoClient) {
      throw new Error("repoClient is undefined");
    }
    type RequestParameters = {
      entryId: number;
      postEntryChildrenRequest: PostEntryChildrenRequest;
    };

    const entryId =
      (parentNode as LfRepoTreeNode).targetId ?? parseInt(parentNode.id, 10);
    const postEntryChildrenRequest = new PostEntryChildrenRequest({
      name: folderName,
      entryType: PostEntryChildrenEntryType.Folder,
    });
    const requestParameters: RequestParameters = {
      entryId,
      postEntryChildrenRequest,
    };
    const repoId: string = await this.repoClient.getCurrentRepoId();
    await this.repoClient?.entriesClient.createOrCopyEntry({
      repoId,
      entryId: requestParameters.entryId,
      request: requestParameters.postEntryChildrenRequest,
    });
  }
  // react render method
  render() {
    return (
      <div className="App">
        <header className="App-header"></header>
        <h2 className="lf-sample-app-title">
          Save to Laserfiche Sample Application
        </h2>

        <div className="lf-component-container lf-right-button">
          <lf-login
            redirect_uri={this.REDIRECT_URI}
            scope={this.SCOPE}
            authorize_url_host_name={this.HOST_NAME}
            redirect_behavior="Replace"
            client_id={this.CLIENT_ID}
            ref={this.loginComponent}
          ></lf-login>
        </div>

        <div hidden={!this.state?.isLoggedIn}>
          {this.state?.showNewFolderDialog && (
            <NewFolderModal
              onClose={this.hideNewFolderDialog.bind(this)}
              errorMessage={this.state?.popupErrorMessage}
            />
          )}
          {this.state?.showEditColumnsDialog && (
            <EditColumnsModal
              onClose={this.hideEditColumnsDialog.bind(this)}
              initialColumnsSelected={this.state?.selectedColumns}
              allColumnOptions={this.state?.allPossibleColumns}
            />
          )}
          <button
            className="lf-refresh-button"
            onClick={() => this.onClickRefreshAsync()}
          >
            Refresh
          </button>
          <div className="folder-browse-select lf-component-container">
            <span>
              {this.FILE_NAME}
              <input
                disabled={this.state?.selectedFile === undefined}
                type="text"
                value={this.displayFileName}
                onChange={this.updateFileName}
              />
              .{this.fileExtension}
            </span>
            <div>
              <button
                className="lf-button primary-button"
                onClick={this.onInputAreaClick}
              >
                {this.CLICK_TO_UPLOAD}
              </button>
              <input ref={this.fileInput} type="file" hidden />

              <button
                className="lf-multivalue-remove-button"
                disabled={!this.state?.selectedFile}
                onClick={this.clearFileSelected}
              >
                <svg
                  id="close"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                >
                  <path d="M19 6.41l-1.41-1.41-5.59 5.59-5.59-5.59-1.41 1.41 5.59 5.59-5.59 5.59 1.41 1.41 5.59-5.59 5.59 5.59 1.41-1.41-5.59-5.59z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="lf-component-container">
            <div className="folder-browse-select">
              {this.SELECTED_FOLDER}:{" "}
              {this.state?.lfSelectedFolder?.selectedFolderName ??
                this.FOLDER_BROWSER_PLACEHOLDER}
              <button
                onClick={this.onClickBrowse}
                hidden={this.state?.expandFolderBrowser}
                className="lf-button primary-button"
              >
                {this.BROWSE}
              </button>
            </div>
            <a
              hidden={!this.state?.lfSelectedFolder}
              className="open-in-lf-link"
              href={this.state?.lfSelectedFolder?.selectedNodeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {this.OPEN_IN_LASERFICHE}
            </a>
            <div className="lf-folder-browser-sample-container">
              {this.state?.expandFolderBrowser && (
                <div className="repository-browser">
                  <div className="repo-browser-with-toolbar">
                    <lf-repository-browser
                      ref={this.repositoryBrowser}
                      multiple="false"
                      style={{ height: "420px" }}
                    ></lf-repository-browser>
                    <lf-toolbar ref={this.toolBarElement}></lf-toolbar>
                  </div>
                  <div className="repository-browser-button-containers">
                    <span>
                      <button
                        className="lf-button primary-button"
                        onClick={this.onOpenNode}
                        hidden={!this.state?.shouldShowOpen}
                      >
                        {this.OPEN}
                      </button>
                      <button
                        className="lf-button primary-button"
                        onClick={this.onSelectFolder}
                        hidden={!this.state?.shouldShowSelect}
                      >
                        {this.SELECT}
                      </button>
                      <button
                        className="sec-button lf-button margin-left-button"
                        hidden={!this.state?.expandFolderBrowser}
                        onClick={this.onClickCancelButton}
                      >
                        {this.CANCEL}
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lf-component-container">
            <lf-field-container
              ref={this.fieldContainer}
              collapsible="true"
              startCollapsed="true"
            ></lf-field-container>
          </div>
          <div className="lf-component-container lf-right-button">
            <button
              className="lf-button primary-button"
              disabled={!this.enableSave}
              onClick={this.onClickSave}
            >
              {this.SAVE_TO_LASERFICHE}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // localization helpers

  BROWSE = this.localizationService.getString("BROWSE");
  FOLDER_BROWSER_PLACEHOLDER = this.localizationService.getString(
    "FOLDER_BROWSER_PLACEHOLDER"
  );
  SAVE_TO_LASERFICHE = this.localizationService.getString("SAVE_TO_LASERFICHE");
  CLICK_TO_UPLOAD = this.localizationService.getString("CLICK_TO_UPLOAD");
  SELECTED_FOLDER = this.localizationService.getString("SELECTED_FOLDER");
  FILE_NAME = this.localizationService.getString("FILE_NAME");
  OPEN_IN_LASERFICHE = this.localizationService.getString("OPEN_IN_LASERFICHE");
  OPEN = this.localizationService.getString("OPEN");
  REFRESH = this.localizationService.getString("REFRESH");
  NEW_FOLDER = this.localizationService.getString("NEW_FOLDER");
  ADD_REMOVE_COLUMNS = this.localizationService.getString("ADD_REMOVE_COLUMNS");
  SELECT = this.localizationService.getString("SELECT");
  CANCEL = this.localizationService.getString("CANCEL");
  UNKNOWN_ERROR = this.localizationService.getString("UNKNOWN_ERROR");
}
