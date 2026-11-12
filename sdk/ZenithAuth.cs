/**
 * Zenith Auth - Official C# / .NET SDK
 * Compatible with .NET Framework 4.7+, .NET Core, .NET 6/7/8
 */

using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ZenithSecurity
{
    public class ZenithAuthClient
    {
        private static readonly HttpClient httpClient = new HttpClient();
        private readonly string baseUrl;
        private readonly int appId;
        private readonly string publicKey;

        public string SessionToken { get; private set; }

        public ZenithAuthClient(int appId, string publicKey, string host = "http://127.0.0.1:3000")
        {
            this.appId = appId;
            this.publicKey = publicKey;
            this.baseUrl = host.TrimEnd('/') + "/api/v1/client";
        }

        public async Task<bool> InitializeAsync(string version = "2.4.0")
        {
            var payload = new { app_id = appId, public_key = publicKey, client_version = version };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync($"{baseUrl}/init", content);
            return response.IsSuccessStatusCode;
        }

        public async Task<string> LoginAsync(string username, string password, string hwid)
        {
            var payload = new { username, password, hwid, app_id = appId };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync($"{baseUrl}/login", content);
            var result = await response.Content.ReadAsStringAsync();
            return result;
        }

        public async Task<bool> VerifyLicenseAsync(string licenseKey, string hwid)
        {
            var payload = new { license_key = licenseKey, hwid, app_id = appId };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync($"{baseUrl}/license/verify", content);
            return response.IsSuccessStatusCode;
        }

        public async Task<string> GetVariablesAsync(string username)
        {
            var payload = new { app_id = appId, username };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync($"{baseUrl}/vars", content);
            return await response.Content.ReadAsStringAsync();
        }
    }
}
