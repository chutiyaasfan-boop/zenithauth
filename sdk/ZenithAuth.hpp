/**
 * Zenith Auth - Official C++ Client Header
 * Standalone Windows C++ client with WinINet HTTP execution
 */

#pragma once
#include <iostream>
#include <string>
#include <sstream>
#include <windows.h>
#include <wininet.h>
#pragma comment(lib, "wininet.lib")

class ZenithAuthClient {
private:
    int m_appId;
    std::string m_publicKey;
    std::string m_host;
    int m_port;

    std::string HttpRequest(const std::string& path, const std::string& postData) {
        HINTERNET hInternet = InternetOpenA("ZenithCpp/2.4", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
        if (!hInternet) return "";

        HINTERNET hConnect = InternetConnectA(hInternet, m_host.c_str(), m_port, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
        if (!hConnect) {
            InternetCloseHandle(hInternet);
            return "";
        }

        HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", path.c_str(), NULL, NULL, NULL, 0, 0);
        std::string headers = "Content-Type: application/json\r\n";
        HttpSendRequestA(hRequest, headers.c_str(), (DWORD)headers.length(), (LPVOID)postData.c_str(), (DWORD)postData.length());

        char buffer[4096];
        DWORD bytesRead = 0;
        std::string response;
        while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
            buffer[bytesRead] = '\0';
            response.append(buffer);
        }

        InternetCloseHandle(hRequest);
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return response;
    }

public:
    ZenithAuthClient(int appId, const std::string& publicKey, const std::string& host = "127.0.0.1", int port = 3000)
        : m_appId(appId), m_publicKey(publicKey), m_host(host), m_port(port) {}

    bool Initialize(const std::string& version = "2.4.0") {
        std::stringstream ss;
        ss << "{\"app_id\":" << m_appId << ",\"public_key\":\"" << m_publicKey << "\",\"client_version\":\"" << version << "\"}";
        std::string res = HttpRequest("/api/v1/client/init", ss.str());
        return res.find("\"status\":true") != std::string::npos;
    }

    std::string Login(const std::string& username, const std::string& password, const std::string& hwid) {
        std::stringstream ss;
        ss << "{\"username\":\"" << username << "\",\"password\":\"" << password << "\",\"hwid\":\"" << hwid << "\",\"app_id\":" << m_appId << "}";
        return HttpRequest("/api/v1/client/login", ss.str());
    }

    bool VerifyLicense(const std::string& licenseKey, const std::string& hwid) {
        std::stringstream ss;
        ss << "{\"license_key\":\"" << licenseKey << "\",\"hwid\":\"" << hwid << "\",\"app_id\":" << m_appId << "}";
        std::string res = HttpRequest("/api/v1/client/license/verify", ss.str());
        return res.find("\"valid\":true") != std::string::npos;
    }
};
