# HashiCorp Vault Secrets for Insomnia plugin

![Vault](/assets/Vault_PrimaryLogo_Black.png)

## Plugin Installation

### Plugin Hub
You can install it directly from the Insomnia [Plugin Hub](https://insomnia.rest/plugins/insomnia-plugin-hashicorp-vault-secrets)

### Insomnia Preferences
Go to `Application -> Preferences -> Plugins` and enter `insomnia-plugin-hashicorp-vault-secrets` in the `npm package name` field and click on the button `Install Plugin`.

This will download and install the plugin. After installation, you will see the plugin in the list of installed plugins
and the action "Run All Requests" will be available in the context menu of a folder, no restart required.

![Insomnia Preferences](/assets/Insomnia-prefrences.png)

## How to Use
Add the following environment variables in Insomnia (see [here](https://docs.insomnia.rest/insomnia/environment-variables#environment-basics)). Adapt the values regarding your HashiCorp environment and select the right release of KV secrets engine ('1' or '2' see [here](https://developer.hashicorp.com/vault/docs/secrets/kv)).
```json
{
  "HASHICORP_URL": "https://hashicorp.client.net",
  "HASHICORP_KV_VERSION": "2",
  "HASHICORP_TOKEN": "** TO_BE_REPLACED **"
}
```
In HashiCorp: create a KV secret (or mount), a secret and a JSON

For instance: 
- KV secret (or mount): `keycloak_v2`
- secret: `dev`
- JSON:
```json
{
  "client_id": "client2",
  "client_secret": "$my_secret!"
}
```
![Vault KV 2](/assets/Vault_KV2.png)

Hit Ctrl + Space in any place where an environment variable is available and pick HashiCorp Vault Secret
![Insomnia Ctrl + Space](/assets/Insomnia_ctrl_space.png)

Set in KV Secret Name a path to the Vault Secret. The syntax is `/mount/secret/jsonName`
For instance: `/keycloak_v2/dev/client_id`
![Insomnia Edit Tag](/assets/Insomnia_Edit_Tag.png)

Repeat the same action for the client_secret (with `/keycloak_v2/dev/client_secret` path)
![Insomnia All Secrets](/assets/Insomnia_with_all_secrets.png)