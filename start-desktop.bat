@echo off
title ChronoStudio Desktop
cd /d "C:\Software\slideshow-studio"

echo Starting ChronoStudio Desktop App...
call .\node_modules\.bin\electron.cmd .
