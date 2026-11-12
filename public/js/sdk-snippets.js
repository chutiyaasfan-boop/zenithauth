/**
 * Zenith Auth - SDK Integration Code Snippets
 * Production-ready client integration examples for 11 programming languages
 */

const ZenithSDKSnippets = {
  csharp: {
    name: 'C# (.NET 6 / 7 / 8 / Framework)',
    filename: 'ZenithAuth.cs',
    code: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ZenithSecurity
{
    public class ZenithClient
    {
        private static readonly HttpClient client = new HttpClient();
        private readonly string apiUrl = "http://127.0.0.1:3000/api/v1/client";
        private readonly int appId;
        private readonly string publicKey;

        public ZenithClient(int appId, string publicKey)
        {
            this.appId = appId;
            this.publicKey = publicKey;
        }

        public async Task<bool> InitializeAsync(string version = "2.4.0")
        {
            var payload = new { app_id = appId, public_key = publicKey, client_version = version };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{apiUrl}/init", content);
            return response.IsSuccessStatusCode;
        }

        public async Task<string> AuthenticateAsync(string username, string password, string hwid)
        {
            var payload = new { username, password, hwid, app_id = appId };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{apiUrl}/login", content);
            var result = await response.Content.ReadAsStringAsync();
            return result;
        }

        public async Task<bool> VerifyLicenseAsync(string licenseKey, string hwid)
        {
            var payload = new { license_key = licenseKey, hwid, app_id = appId };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{apiUrl}/license/verify", content);
            return response.IsSuccessStatusCode;
        }
    }
}`
  },

  cpp: {
    name: 'C++ (WinINet / CPR / C++20)',
    filename: 'ZenithAuth.hpp',
    code: `#pragma once
#include <iostream>
#include <string>
#include <windows.h>
#include <wininet.h>
#pragma comment(lib, "wininet.lib")

class ZenithAuth {
private:
    std::string apiUrl = "http://127.0.0.1:3000/api/v1/client";
    int appId;
    std::string publicKey;

    std::string HttpPost(const std::string& endpoint, const std::string& jsonData) {
        HINTERNET hSession = InternetOpenA("ZenithCppClient/2.4", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
        if (!hSession) return "";
        HINTERNET hConnect = InternetConnectA(hSession, "127.0.0.1", 3000, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
        if (!hConnect) { InternetCloseHandle(hSession); return ""; }

        HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", endpoint.c_str(), NULL, NULL, NULL, 0, 0);
        std::string headers = "Content-Type: application/json\\r\\n";
        HttpSendRequestA(hRequest, headers.c_str(), (DWORD)headers.length(), (LPVOID)jsonData.c_str(), (DWORD)jsonData.length());

        char buffer[4096];
        DWORD bytesRead = 0;
        std::string response;
        while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
            buffer[bytesRead] = '\\0';
            response.append(buffer);
        }

        InternetCloseHandle(hRequest);
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hSession);
        return response;
    }

public:
    ZenithAuth(int id, std::string key) : appId(id), publicKey(key) {}

    bool Initialize(const std::string& version = "2.4.0") {
        std::string body = "{\\"app_id\\":" + std::to_string(appId) + ",\\"public_key\\":\\"" + publicKey + "\\",\\"client_version\\":\\"" + version + "\\"}";
        std::string res = HttpPost("/api/v1/client/init", body);
        return res.find("\\"status\\":true") != std::string::npos;
    }

    std::string Login(const std::string& user, const std::string& pass, const std::string& hwid) {
        std::string body = "{\\"username\\":\\"" + user + "\\",\\"password\\":\\"" + pass + "\\",\\"hwid\\":\\"" + hwid + "\\",\\"app_id\\":" + std::to_string(appId) + "}";
        return HttpPost("/api/v1/client/login", body);
    }
};`
  },

  java: {
    name: 'Java (Java 11+ HttpClient)',
    filename: 'ZenithAuth.java',
    code: `package io.zenithauth;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ZenithAuth {
    private final String baseUrl = "http://127.0.0.1:3000/api/v1/client";
    private final int appId;
    private final String publicKey;
    private final HttpClient client = HttpClient.newHttpClient();

    public ZenithAuth(int appId, String publicKey) {
        this.appId = appId;
        this.publicKey = publicKey;
    }

    public boolean init(String version) throws Exception {
        String json = String.format("{\\"app_id\\":%d,\\"public_key\\":\\"%s\\",\\"client_version\\":\\"%s\\"}", appId, publicKey, version);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/init"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() == 200;
    }

    public String login(String username, String password, String hwid) throws Exception {
        String json = String.format("{\\"username\\":\\"%s\\",\\"password\\":\\"%s\\",\\"hwid\\":\\"%s\\",\\"app_id\\":%d}", username, password, hwid, appId);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/login"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}`
  },

  python: {
    name: 'Python (3.8+ requests / urllib)',
    filename: 'zenith_auth.py',
    code: `import requests
import json
import uuid

class ZenithAuth:
    def __init__(self, app_id: int, public_key: str, base_url: str = "http://127.0.0.1:3000/api/v1/client"):
        self.app_id = app_id
        self.public_key = public_key
        self.base_url = base_url.rstrip('/')
        self.session_token = None

    def initialize(self, client_version: str = "2.4.0") -> bool:
        payload = {"app_id": self.app_id, "public_key": self.public_key, "client_version": client_version}
        resp = requests.post(f"{self.base_url}/init", json=payload)
        return resp.status_code == 200 and resp.json().get("status") is True

    def login(self, username: str, password: str, hwid: str = None) -> dict:
        if not hwid:
            hwid = str(uuid.getnode()) # Mac-based hardware id
        payload = {"username": username, "password": password, "hwid": hwid, "app_id": self.app_id}
        resp = requests.post(f"{self.base_url}/login", json=payload)
        data = resp.json()
        if data.get("status"):
            self.session_token = data.get("token")
        return data

    def verify_license(self, license_key: str, hwid: str = None) -> dict:
        payload = {"license_key": license_key, "hwid": hwid, "app_id": self.app_id}
        resp = requests.post(f"{self.base_url}/license/verify", json=payload)
        return resp.json()

# Usage Example:
if __name__ == "__main__":
    zenith = ZenithAuth(app_id=1, public_key="za_pub_sample")
    if zenith.initialize():
        print("[+] Zenith initialized successfully")
        res = zenith.login("admin", "secure_password", hwid="HWID-TEST-001")
        print("[+] Auth Response:", res)`
  },

  php: {
    name: 'PHP (cURL / Guzzle)',
    filename: 'ZenithAuth.php',
    code: `<?php
class ZenithAuth {
    private $apiUrl = 'http://127.0.0.1:3000/api/v1/client';
    private $appId;
    private $publicKey;

    public function __construct(int $appId, string $publicKey) {
        $this->appId = $appId;
        $this->publicKey = $publicKey;
    }

    private function post(string $endpoint, array $data): array {
        $ch = curl_init($this->apiUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $res = curl_exec($ch);
        curl_close($ch);
        return json_decode($res, true) ?: [];
    }

    public function init(string $version = '2.4.0'): bool {
        $resp = $this->post('/init', ['app_id' => $this->appId, 'public_key' => $this->publicKey, 'client_version' => $version]);
        return isset($resp['status']) && $resp['status'] === true;
    }

    public function login(string $user, string $pass, string $hwid): array {
        return $this->post('/login', ['username' => $user, 'password' => $pass, 'hwid' => $hwid, 'app_id' => $this->appId]);
    }
}
?>`
  },

  vbnet: {
    name: 'VB.NET (.NET 6 / Framework)',
    filename: 'ZenithAuth.vb',
    code: `Imports System.Net.Http
Imports System.Text
Imports System.Text.Json
Imports System.Threading.Tasks

Public Class ZenithClient
    Private Shared ReadOnly client As New HttpClient()
    Private ReadOnly apiUrl As String = "http://127.0.0.1:3000/api/v1/client"
    Private ReadOnly appId As Integer
    Private ReadOnly publicKey As String

    Public Sub New(ByVal id As Integer, ByVal key As String)
        Me.appId = id
        Me.publicKey = key
    End Sub

    Public Async Function InitializeAsync(Optional ByVal version As String = "2.4.0") As Task(Of Boolean)
        Dim payload = New With {Key .app_id = appId, Key .public_key = publicKey, Key .client_version = version}
        Dim content = New StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        Dim response = Await client.PostAsync($"{apiUrl}/init", content)
        Return response.IsSuccessStatusCode
    End Function

    Public Async Function LoginAsync(ByVal username As String, ByVal password As String, ByVal hwid As String) As Task(Of String)
        Dim payload = New With {Key .username = username, Key .password = password, Key .hwid = hwid, Key .app_id = appId}
        Dim content = New StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        Dim response = Await client.PostAsync($"{apiUrl}/login", content)
        Return Await response.Content.ReadAsStringAsync()
    End Function
End Class`
  },

  javascript: {
    name: 'JavaScript (Browser / Node.js)',
    filename: 'zenith-auth.js',
    code: `class ZenithAuth {
  constructor(appId, publicKey, baseUrl = 'http://127.0.0.1:3000/api/v1/client') {
    this.appId = appId;
    this.publicKey = publicKey;
    this.baseUrl = baseUrl.replace(/\\/$/, '');
    this.token = null;
  }

  async init(clientVersion = '2.4.0') {
    const res = await fetch(\`\${this.baseUrl}/init\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, public_key: this.publicKey, client_version: clientVersion })
    });
    const data = await res.json();
    return data.status === true;
  }

  async login(username, password, hwid = 'BROWSER-SESSION') {
    const res = await fetch(\`\${this.baseUrl}/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, hwid, app_id: this.appId })
    });
    const data = await res.json();
    if (data.status) this.token = data.token;
    return data;
  }

  async verifyLicense(licenseKey, hwid = 'BROWSER-SESSION') {
    const res = await fetch(\`\${this.baseUrl}/license/verify\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, hwid, app_id: this.appId })
    });
    return await res.json();
  }
}`
  },

  typescript: {
    name: 'TypeScript (Strict Typed)',
    filename: 'zenith-auth.ts',
    code: `export interface ZenithInitResponse {
  status: boolean;
  message: string;
  app_name?: string;
  nonce?: string;
}

export interface ZenithAuthResponse {
  status: boolean;
  message: string;
  token?: string;
  user?: {
    username: string;
    role: string;
    subscription: string;
    expiry: string;
  };
}

export class ZenithSDK {
  private readonly baseUrl: string;
  public token: string | null = null;

  constructor(private readonly appId: number, private readonly publicKey: string, host = 'http://127.0.0.1:3000') {
    this.baseUrl = \`\${host}/api/v1/client\`;
  }

  public async init(version = '2.4.0'): Promise<ZenithInitResponse> {
    const res = await fetch(\`\${this.baseUrl}/init\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, public_key: this.publicKey, client_version: version })
    });
    return res.json();
  }

  public async login(username: string, pass: string, hwid: string): Promise<ZenithAuthResponse> {
    const res = await fetch(\`\${this.baseUrl}/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass, hwid, app_id: this.appId })
    });
    const data: ZenithAuthResponse = await res.json();
    if (data.status && data.token) this.token = data.token;
    return data;
  }
}`
  },

  rust: {
    name: 'Rust (reqwest / tokio)',
    filename: 'zenith_auth.rs',
    code: `use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Serialize)]
struct InitPayload<'a> {
    app_id: u32,
    public_key: &'a str,
    client_version: &'a str,
}

#[derive(Serialize)]
struct LoginPayload<'a> {
    username: &'a str,
    password: &'a str,
    hwid: &'a str,
    app_id: u32,
}

#[derive(Deserialize, Debug)]
pub struct AuthResponse {
    pub status: bool,
    pub message: String,
    pub token: Option<String>,
}

pub struct ZenithAuth {
    client: Client,
    app_id: u32,
    public_key: String,
    base_url: String,
}

impl ZenithAuth {
    pub fn new(app_id: u32, public_key: &str) -> Self {
        Self {
            client: Client::new(),
            app_id,
            public_key: public_key.to_string(),
            base_url: "http://127.0.0.1:3000/api/v1/client".to_string(),
        }
    }

    pub async fn login(&self, user: &str, pass: &str, hwid: &str) -> Result<AuthResponse, reqwest::Error> {
        let payload = LoginPayload {
            username: user,
            password: pass,
            hwid,
            app_id: self.app_id,
        };
        let res = self.client.post(&format!("{}/login", self.base_url))
            .json(&payload)
            .send()
            .await?
            .json::<AuthResponse>()
            .await?;
        Ok(res)
    }
}`
  },

  go: {
    name: 'Go (net/http / encoding/json)',
    filename: 'zenith_auth.go',
    code: `package zenith

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type ZenithClient struct {
	AppID     int
	PublicKey string
	BaseURL   string
	HTTP      *http.Client
}

func NewZenithClient(appID int, pubKey string) *ZenithClient {
	return &ZenithClient{
		AppID:     appID,
		PublicKey: pubKey,
		BaseURL:   "http://127.0.0.1:3000/api/v1/client",
		HTTP:      &http.Client{},
	}
}

func (z *ZenithClient) Login(username, password, hwid string) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"username": username,
		"password": password,
		"hwid":     hwid,
		"app_id":   z.AppID,
	}
	body, _ := json.Marshal(payload)
	resp, err := z.HTTP.Post(z.BaseURL+"/login", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}`
  },

  ruby: {
    name: 'Ruby (Net::HTTP / JSON)',
    filename: 'zenith_auth.rb',
    code: `require 'net/http'
require 'json'
require 'uri'

class ZenithAuth
  def initialize(app_id, public_key, host = 'http://127.0.0.1:3000')
    @app_id = app_id
    @public_key = public_key
    @base_url = "#{host}/api/v1/client"
  end

  def login(username, password, hwid)
    uri = URI("#{@base_url}/login")
    http = Net::HTTP.new(uri.host, uri.port)
    req = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json'})
    req.body = {
      username: username,
      password: password,
      hwid: hwid,
      app_id: @app_id
    }.to_json

    response = http.request(req)
    JSON.parse(response.body)
  end

  def verify_license(license_key, hwid)
    uri = URI("#{@base_url}/license/verify")
    http = Net::HTTP.new(uri.host, uri.port)
    req = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json'})
    req.body = {
      license_key: license_key,
      hwid: hwid,
      app_id: @app_id
    }.to_json

    response = http.request(req)
    JSON.parse(response.body)
  end
end`
  },

  getConstructor(lang, appName = 'Zenith Core Engine', ownerId = 'PC1B6P1TTA', secret = '••••••••••••••••••••••••••••••••', version = '1.0') {
    switch ((lang || 'csharp').toLowerCase()) {
      case 'csharp':
      case 'c#':
        return `public static ZenithAuthClient Client = new ZenithAuthClient(
    appName: "${appName}",
    ownerId: "${ownerId}",
    secret: "${secret}",
    version: "${version}"
);`;
      case 'cpp':
      case 'c++':
        return `ZenithAuthClient Client(
    /* appName */ "${appName}",
    /* ownerId */ "${ownerId}",
    /* secret  */ "${secret}",
    /* version */ "${version}"
);`;
      case 'java':
        return `public static ZenithAuthClient client = new ZenithAuthClient(
    "${appName}",
    "${ownerId}",
    "${secret}",
    "${version}"
);`;
      case 'python':
        return `client = ZenithAuthClient(
    app_name="${appName}",
    owner_id="${ownerId}",
    secret="${secret}",
    version="${version}"
)`;
      case 'php':
        return `$client = new ZenithAuthClient(
    appName: "${appName}",
    ownerId: "${ownerId}",
    secret: "${secret}",
    version: "${version}"
);`;
      case 'vb.net':
      case 'vbnet':
      case 'vb':
        return `Public Shared Client As New ZenithAuthClient(
    appName := "${appName}",
    ownerId := "${ownerId}",
    secret := "${secret}",
    version := "${version}"
)`;
      case 'javascript':
      case 'js':
        return `const client = new ZenithAuthClient({
  appName: "${appName}",
  ownerId: "${ownerId}",
  secret: "${secret}",
  version: "${version}"
});`;
      case 'typescript':
      case 'ts':
        return `export const client = new ZenithAuthClient({
  appName: "${appName}",
  ownerId: "${ownerId}",
  secret: "${secret}",
  version: "${version}"
});`;
      case 'rust':
        return `let client = ZenithAuthClient::new(
    "${appName}",
    "${ownerId}",
    "${secret}",
    "${version}"
);`;
      case 'go':
      case 'golang':
        return `client := zenithauth.NewClient(&zenithauth.Config{
    AppName: "${appName}",
    OwnerID: "${ownerId}",
    Secret:  "${secret}",
    Version: "${version}",
})`;
      case 'ruby':
        return `client = ZenithAuthClient.new(
  app_name: "${appName}",
  owner_id: "${ownerId}",
  secret: "${secret}",
  version: "${version}"
)`;
      case 'perl':
        return `my $client = ZenithAuthClient->new(
    app_name => "${appName}",
    owner_id => "${ownerId}",
    secret   => "${secret}",
    version  => "${version}"
);`;
      case 'lua':
        return `local client = ZenithAuthClient.new({
    appName = "${appName}",
    ownerId = "${ownerId}",
    secret = "${secret}",
    version = "${version}"
})`;
      default:
        return `public static ZenithAuthClient Client = new ZenithAuthClient(
    appName: "${appName}",
    ownerId: "${ownerId}",
    secret: "${secret}",
    version: "${version}"
);`;
    }
  }
};

window.ZenithSDKSnippets = ZenithSDKSnippets;
