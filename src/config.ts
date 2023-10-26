// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

const config = {
  REDIRECT_URI: 'REPLACE_WITH_YOUR_REDIRECT_URI', // i.e http://localhost:3000, https://serverName/lf-sample/index.html
  CLIENT_ID: 'REPLACE_WITH_YOUR_CLIENT_ID',
  HOST_NAME: 'laserfiche.com', // only update this if you are using a different environment (e.g. a.clouddev.laserfiche.com)
  SCOPE: 'repository.Read repository.Write', // Scope(s) requested by the app
};

export default config;
