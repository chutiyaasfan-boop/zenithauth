// Zenith Auth - Official Go SDK
package zenith

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
)

type ZenithClient struct {
	AppID     int
	PublicKey string
	BaseURL   string
	HTTP      *http.Client
}

func NewZenithClient(appID int, pubKey string, host string) *ZenithClient {
	return &ZenithClient{
		AppID:     appID,
		PublicKey: pubKey,
		BaseURL:   strings.TrimRight(host, "/") + "/api/v1/client",
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
}
