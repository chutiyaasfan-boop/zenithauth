package io.zenithauth;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ZenithAuth {
    private final String baseUrl;
    private final int appId;
    private final String publicKey;
    private final HttpClient client;

    public ZenithAuth(int appId, String publicKey, String host) {
        this.appId = appId;
        this.publicKey = publicKey;
        this.baseUrl = host.replaceAll("/$", "") + "/api/v1/client";
        this.client = HttpClient.newHttpClient();
    }

    public boolean initialize(String version) throws Exception {
        String json = String.format("{\"app_id\":%d,\"public_key\":\"%s\",\"client_version\":\"%s\"}", appId, publicKey, version);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/init"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() == 200 && response.body().contains("\"status\":true");
    }

    public String login(String username, String password, String hwid) throws Exception {
        String json = String.format("{\"username\":\"%s\",\"password\":\"%s\",\"hwid\":\"%s\",\"app_id\":%d}", username, password, hwid, appId);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/login"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
