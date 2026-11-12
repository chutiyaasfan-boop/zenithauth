<?php
/**
 * Zenith Auth - Official PHP SDK
 */

class ZenithAuth {
    private $apiUrl;
    private $appId;
    private $publicKey;

    public function __construct(int $appId, string $publicKey, string $host = 'http://127.0.0.1:3000') {
        $this->appId = $appId;
        $this->publicKey = $publicKey;
        $this->apiUrl = rtrim($host, '/') . '/api/v1/client';
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

    public function initialize(string $version = '2.4.0'): bool {
        $resp = $this->post('/init', [
            'app_id' => $this->appId,
            'public_key' => $this->publicKey,
            'client_version' => $version
        ]);
        return isset($resp['status']) && $resp['status'] === true;
    }

    public function login(string $username, string $password, string $hwid): array {
        return $this->post('/login', [
            'username' => $username,
            'password' => $password,
            'hwid' => $hwid,
            'app_id' => $this->appId
        ]);
    }

    public function verifyLicense(string $licenseKey, string $hwid): array {
        return $this->post('/license/verify', [
            'license_key' => $licenseKey,
            'hwid' => $hwid,
            'app_id' => $this->appId
        ]);
    }
}
?>
