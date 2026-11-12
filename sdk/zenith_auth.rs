// Zenith Auth - Official Rust SDK (reqwest / tokio)
use serde::{Deserialize, Serialize};
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
    pub fn new(app_id: u32, public_key: &str, host: &str) -> Self {
        Self {
            client: Client::new(),
            app_id,
            public_key: public_key.to_string(),
            base_url: format!("{}/api/v1/client", host.trim_end_matches('/')),
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
}
