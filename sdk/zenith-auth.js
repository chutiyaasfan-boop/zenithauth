/**
 * Zenith Auth - Official JavaScript SDK (Browser & Node.js)
 */

class ZenithAuth {
  constructor(appId, publicKey, host = 'http://127.0.0.1:3000') {
    this.appId = appId;
    this.publicKey = publicKey;
    this.baseUrl = `${host.replace(/\/$/, '')}/api/v1/client`;
    this.sessionToken = null;
  }

  async init(clientVersion = '2.4.0') {
    const res = await fetch(`${this.baseUrl}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, public_key: this.publicKey, client_version: clientVersion })
    });
    const data = await res.json();
    return data.status === true;
  }

  async login(username, password, hwid = 'BROWSER-SESSION') {
    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, hwid, app_id: this.appId })
    });
    const data = await res.json();
    if (data.status) {
      this.sessionToken = data.token;
    }
    return data;
  }

  async register(username, email, password, licenseKey, hwid = 'BROWSER-SESSION') {
    const res = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, license_key: licenseKey, hwid, app_id: this.appId })
    });
    return await res.json();
  }

  async verifyLicense(licenseKey, hwid = 'BROWSER-SESSION') {
    const res = await fetch(`${this.baseUrl}/license/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, hwid, app_id: this.appId })
    });
    return await res.json();
  }

  async getVariables(username) {
    const res = await fetch(`${this.baseUrl}/vars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, username })
    });
    return await res.json();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZenithAuth;
}
