const fs = require("fs")

const logAppName = '[hashicorp-vault-secrets]';

const secretsCache = {
    _secrets: {},
    getSecret(secretName) {
        return this._secrets[secretName] ?? null;
    },
    setSecret(secretName, secretValue) {
        this._secrets[secretName] = secretValue;
    },
};

const getKeyVaultSecret3 = async function fetchData (hcToken, hcUrl, hcMount, hcKvVersion, secretName) {
    let secretValue = '';
    try {
        const axios = require('axios');
        const urlApi = `${hcUrl}/v1/${hcMount}/data/${secretName}`;
        console.log(logAppName, 'urlApi:', urlApi);
        // Set custom headers
        const config = {
            headers: {
              'X-Vault-Token': hcToken
            }
          };          
          
        const response = await axios.get(urlApi, config);
        console.log(logAppName, 'Response Data:', response.data);
        secretValue = response.data.data.data.client_id;
        console.log(logAppName, `secretValue=${secretValue}`);

    } catch (error) {
        console.error(logAppName, 'Error:', error);
    }
    return secretValue;
}

const getKeyVaultSecret2 = async function fetchData(hcToken, hcUrl, hcMount, hcKvVersion, secretName) {
    const cacheSecretName = `${hcMount}${secretName}`;
    const cachedSecretValue = secretsCache.getSecret(cacheSecretName);
    let secretValue = "";

    return new Promise((resolve, reject) => {
        let httpTans;
        const options = {
            headers: {
              'X-Vault-Token': hcToken
            }
          };          
        const urlApi = `${hcUrl}/v1/${hcMount}/data/${secretName}`;
        
        if (hcUrl.indexOf ("https://") == 0) {
            httpTans = require('https');
        }
        else if (hcUrl.indexOf ("http://") == 0) {
            httpTans = require('http');
        }
        else {
            console.error(logAppName, `failed to read secret ${secretName} from ${url}: ${error}`);
            return;
        }
        httpTans.get(urlApi, options, (res) => {
        let data = '';
  
        // Receive chunks of data
        res.on('data', (chunk) => {
          data += chunk;
        });
  
        // When the response ends, resolve the promise with the response data
        res.on('end', () => {
            resolve(data);
            /*const jsonObject = JSON.parse(data)
            console.log(logAppName, `HTTP code=${resp.statusCode} ${data}`);
            secretValue = jsonObject.data.data.client_id;
            console.log(logAppName, `secretValue=${secretValue}`);*/
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

const getKeyVaultSecret = async function (hcToken, hcUrl, hcMount, hcKvVersion, secretName) {
    const cacheSecretName = `${hcMount}${secretName}`;
    const cachedSecretValue = secretsCache.getSecret(cacheSecretName);
    let secretValue = "";

    /*if (cachedSecretValue !== null) {
        console.log(logAppName, `read secret ${secretName} from cache`);
        return cachedSecretValue;
    }*/



    try {
        let httpTans;
        if (hcUrl.indexOf ("https://") == 0) {
            httpTans = require('https');
        }
        else if (hcUrl.indexOf ("http://") == 0) {
            httpTans = require('http');
        }
        else {
            console.error(logAppName, `failed to read secret ${secretName} from ${url}: ${error}`);
            return;
        }

        const options = {
            headers: {
              'X-Vault-Token': hcToken
            }
          };          
        const urlApi = `${hcUrl}/v1/${hcMount}/data/${secretName}`;
        httpTans.get(urlApi, options, (resp) => {
            let data = '';
          
            // Un morceau de réponse est reçu
            resp.on('data', (chunk) => {
              data += chunk;
            });
          
            // La réponse complète à été reçue. On affiche le résultat.
            resp.on('end', () => {
              const jsonObject = JSON.parse(data)
              console.log(logAppName, `HTTP code=${resp.statusCode} ${data}`);
              secretValue = jsonObject.data.data.client_id;
              console.log(logAppName, `secretValue=${secretValue}`);
            });
          
          }).on("error", (err) => {
            console.log("Error: " + err.message);
          });
        console.log(logAppName, `read secret '${secretName}' from '${urlApi}'`);
        
        //secretsCache.setSecret(cacheSecretName, secretValue);
        return secretValue;
    } catch (error) {
        console.error(logAppName, `failed to read secret ${secretName} from ${hcUrl}: ${error}`);
        return null;
    }
};

const secretTag = {
    name: 'hashiCorpSecret',
    displayName: 'HashiCorp Vault Secret',
    liveDisplayName: (args) => {
        return `Secret => ${args[0].value}`;
    },
    description: 'Retrieve an HashiCorp Vault KV Secret by name',
    args: [{
        displayName: 'KV Secret Name',
        description: 'The name of the KV secret',
        type: 'string',
        defaultValue: ''
    }],
    async run(context, secretName) {

        const hcToken = await context.context.HASHICORP_TOKEN;
        const hcUrl = await context.context.HASHICORP_URL;
        const hcMount = await context.context.HASHICORP_MOUNT;
        const hcKvVersion = await context.context.HASHICORP_KV_VERSION;
        
        if (typeof hcToken === 'undefined') {
            console.error(logAppName, 'missing HASHICORP_TOKEN environment variable');
            return '';
        }

        if (typeof hcMount === 'undefined') {
            console.error(logAppName, 'missing HASHICORP_MOUNT environment variable');
            return '';
        }

        if (typeof hcKvVersion === 'undefined') {
            console.error(logAppName, 'missing HASHICORP_VERSION environment variable');
            return '';
        }
        else if (hcKvVersion != '2') {
            console.error(logAppName, 'HASHICORP_VERSION should be 2');
            return '';
        }

        //const secretValue = "jeromeg";
        const secretValue = getKeyVaultSecret3(hcToken, hcUrl, hcMount, hcKvVersion, secretName);

        return secretValue;
    }
}

module.exports.templateTags = [secretTag];