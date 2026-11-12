# Zenith Auth - Official Ruby SDK
require 'net/http'
require 'json'
require 'uri'

class ZenithAuth
  def initialize(app_id, public_key, host = 'http://127.0.0.1:3000')
    @app_id = app_id
    @public_key = public_key
    @base_url = "#{host.chomp('/')}/api/v1/client"
  end

  def initialize_client(version = '2.4.0')
    uri = URI("#{@base_url}/init")
    http = Net::HTTP.new(uri.host, uri.port)
    req = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json'})
    req.body = { app_id: @app_id, public_key: @public_key, client_version: version }.to_json
    res = http.request(req)
    JSON.parse(res.body)['status'] == true
  end

  def login(username, password, hwid)
    uri = URI("#{@base_url}/login")
    http = Net::HTTP.new(uri.host, uri.port)
    req = Net::HTTP::Post.new(uri.path, {'Content-Type' => 'application/json'})
    req.body = { username: username, password: password, hwid: hwid, app_id: @app_id }.to_json
    res = http.request(req)
    JSON.parse(res.body)
  end
end
