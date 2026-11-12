@echo off
title ZENITH AUTH PLATFORM
echo ===================================================
echo           ZENITH AUTH - PLATFORM LAUNCHER
echo ===================================================
echo Starting Zenith Auth server on http://localhost:3000 ...
call "%~dp0node.cmd" server.js
pause
