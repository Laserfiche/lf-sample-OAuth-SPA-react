const config = {
  REDIRECT_URI: 'http://localhost/lf-sample-app-react', // i.e http://localhost:3000, https://serverName/lf-sample/index.html
  CLIENT_ID: 'afd96c0c-fe6a-40bc-8992-565ff6af3984',
  HOST_NAME: 'laserfiche.com', // only update this if you are using a different environment (e.g. a.clouddev.laserfiche.com)
  SCOPE: 'repository.Read repository.Write', // Scope(s) requested by the app
};

export default config;
