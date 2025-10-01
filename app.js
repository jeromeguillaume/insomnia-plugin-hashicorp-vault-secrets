const logPlugin = '[hashicorp-vault-secrets]';

const secretsCache = {
    _secrets: {},
    getSecret(secretPath) {
        return this._secrets[secretPath] ?? null;
    },
    setSecret(secretPath, secretValue) {
        this._secrets[secretPath] = secretValue;
    },
};

const getHashiCorpSecret = async function fetchData (hcToken, hcUrl, hcKvVersion, secretPath) {
    let secretValue;
    let responseStatus = 0;
    const notAvailable = '[N/A]';
    const notFound = '[Not found]';
    const cachePath = hcUrl + "/" + hcKvVersion + secretPath;
    let urlApi= notAvailable;
    
    try {

        secretValue = secretsCache.getSecret(cachePath);
        if (secretValue !== null) {
            console.log(logPlugin, `read secret from the cache with the cache_path='${cachePath}'`);
            return secretValue;
        }
        secretValue = notAvailable;
        const axios = require('axios');
        const https = require('https');

        let dataPath = '';
        if (hcKvVersion == '2' ){
          dataPath = '/data'
        }
        const splitSecretPath = secretPath.split('/').filter(Boolean)
        if (splitSecretPath.length < 3) {
            secretValue = '[Invalid "KV Secret Name". The syntax is: "/{mount_name}/{path}/{key}" ]'
            throw new Error(`The secretPath '${str}' is not valid. The syntax is: /{mount_name}/{path}/{key}`)
        }
        const mount = splitSecretPath[0]
        const path = splitSecretPath.slice(1, -1).join('/')
        const key = splitSecretPath[splitSecretPath.length - 1]
        
        urlApi = `${hcUrl}/v1/${mount}${dataPath}/${path}`
        // console.log(logPlugin, `urlApi=${urlApi}`)
        
        const axiosInstance = axios.create({
            headers: {
              'X-Vault-Token': hcToken
            },
          }); 
        
        const response = await axiosInstance.get(urlApi);
        responseStatus = response.status;
        // console.log(logPlugin, 'Response Data:', response.data);
        if (hcKvVersion.toString() == '2' && 
            response.hasOwnProperty('data') &&
            response.data.hasOwnProperty('data') &&
            response.data.data.hasOwnProperty('data') &&
            response.data.data.data.hasOwnProperty(key) ){
          secretValue = response.data.data.data[key];
        }
        else if (hcKvVersion.toString() == '1' &&
                response.hasOwnProperty('data') &&
                response.data.hasOwnProperty('data') &&
                response.data.data.hasOwnProperty(key) ){
          secretValue = response.data.data[key];
        }
        else {
          secretValue = notFound;
        }
        //console.log(logPlugin, `secretValue=${secretValue}`);

    } catch (error) {
        if (error.response) {
            console.error(logPlugin, 'Error:', error);
            if (error.hasOwnProperty('response') &&
                error.response.hasOwnProperty('status')){
                responseStatus = error.response.status;
                if (error.response.status == 404) {
                    secretValue = notFound;
                } else if (error.response.status == 403) {
                    secretValue = "[Vault token is expired or not authorized to access the secret]";
                }
            }
        }
        else if (error.request) {
            // The request was made but no response was received
            console.error(logPlugin, 'No response received:', error.request);
        }
        else {
            // Something happened in setting up the request that triggered an Error
            console.error(logPlugin, 'Error:', error.message);
        }
    }
    console.log(logPlugin, `HashiCorp URL=${urlApi} - RESPONSE status=${responseStatus}`);

    // If the sceret is retrieved correctly
    if (secretValue != notAvailable && secretValue != notFound ) {
        console.log(logPlugin, `write secret to the cache with the cache_path='${cachePath}'`);
        secretsCache.setSecret(cachePath, secretValue);
    }
    return secretValue;
}

const secretTag = {
    name: 'hashiCorpSecret',
    displayName: 'HashiCorp Vault Secret',
    liveDisplayName: (args) => {
        return `Secret => ${args[0].value}`;
    },
    description: 'Retrieve a KV Secret by path',
    args: [{
        displayName: 'KV Secret Name',
        description: 'The the KV secret path',
        type: 'string',
        defaultValue: ''
    }],
    async run(context, secretPath) {

        const confError = '[Plugin configuration Error]'
        const hcToken = await context.context.HASHICORP_TOKEN;
        const hcUrl = await context.context.HASHICORP_URL;
        const hcKvVersion = await context.context.HASHICORP_KV_VERSION;
        
        if (typeof hcToken === 'undefined') {
            console.error(logPlugin, 'missing HASHICORP_TOKEN environment variable');
            return confError;
        }
        if (typeof hcUrl === 'undefined') {
            console.error(logPlugin, 'missing HASHICORP_URL environment variable');
            return confError;
        }
        if (typeof hcKvVersion === 'undefined') {
            console.error(logPlugin, 'missing HASHICORP_KV_VERSION environment variable');
            return confError;
        }
        else if (hcKvVersion.toString() != '1' && hcKvVersion != '2') {
            console.error(logPlugin, "HASHICORP_KV_VERSION must be 1 or 2");
            return confError;
        }
        const secretValue = getHashiCorpSecret(hcToken, hcUrl, hcKvVersion, secretPath);

        return secretValue;
    }
}

module.exports.templateTags = [secretTag];
