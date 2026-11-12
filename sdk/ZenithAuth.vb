' Zenith Auth - Official VB.NET Client Library
Imports System.Net.Http
Imports System.Text
Imports System.Text.Json
Imports System.Threading.Tasks

Namespace ZenithSecurity
    Public Class ZenithAuthClient
        Private Shared ReadOnly client As New HttpClient()
        Private ReadOnly baseUrl As String
        Private ReadOnly appId As Integer
        Private ReadOnly publicKey As String

        Public Sub New(ByVal appId As Integer, ByVal publicKey As String, Optional ByVal host As String = "http://127.0.0.1:3000")
            Me.appId = appId
            Me.publicKey = publicKey
            Me.baseUrl = host.TrimEnd("/"c) & "/api/v1/client"
        End Sub

        Public Async Function InitializeAsync(Optional ByVal version As String = "2.4.0") As Task(Of Boolean)
            Dim payload = New With {Key .app_id = appId, Key .public_key = publicKey, Key .client_version = version}
            Dim content = New StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            Dim response = Await client.PostAsync($"{baseUrl}/init", content)
            Return response.IsSuccessStatusCode
        End Function

        Public Async Function LoginAsync(ByVal username As String, ByVal password As String, ByVal hwid As String) As Task(Of String)
            Dim payload = New With {Key .username = username, Key .password = password, Key .hwid = hwid, Key .app_id = appId}
            Dim content = New StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            Dim response = Await client.PostAsync($"{baseUrl}/login", content)
            Return Await response.Content.ReadAsStringAsync()
        End Function
    End Class
End Namespace
