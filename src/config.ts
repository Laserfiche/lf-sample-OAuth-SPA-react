const config = {
  REDIRECT_URI: "REPLACE_WITH_YOUR_REDIRECT_URI", // i.e http://localhost:3000, https://serverName/lf-sample/index.html
  CLIENT_ID: "REPLACE_WITH_YOUR_CLIENT_ID",
  SCOPE: "repository.Read repository.Write", // Scope(s) requested by the app
  HOST_NAME: "laserfiche.com", // only add this if you are using a different environment (e.g. a.clouddev.laserfiche.com)
};

export default config;
