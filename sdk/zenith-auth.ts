/**
 * Zenith Auth - Official TypeScript SDK
 */

export interface ZenithInitResult {
  status: boolean;
  message: string;
  app_name?: string;
  nonce?: string;
  hwid_required?: boolean;
}

export interface ZenithLoginResult {
  status: boolean;
  message: string;
  token?: string;
  user?: {
    username: string;
    role: string;
    subscription: string;
    level: number;
    expiry: string;
  };
}

export class ZenithSDK {
  private readonly baseUrl: string;
  public token: string | null = null;

  constructor(
    private readonly appId: number,
    private readonly publicKey: string,
    host = 'http://127.0.0.1:3000'
  ) {
    this.baseUrl = `${host.replace(/\/$/, '')}/api/v1/client`;
  }

  public async init(version = '2.4.0'): Promise<ZenithInitResult> {
    const res = await fetch(`${this.baseUrl}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, public_key: this.publicKey, client_version: version })
    });
    return res.json();
  }

  public async login(username: string, pass: string, hwid: string): Promise<ZenithLoginResult> {
    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass, hwid, app_id: this.appId })
    });
    const data: ZenithLoginResult = await res.json();
    if (data.status && data.token) {
      this.token = data.token;
    }
    return data;
  }
}
