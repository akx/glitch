@echo off
copy src\*.js js
Setlocal EnableDelayedExpansion
set CL=coco -cb -o js
for %%f in (src\*.co) do set CL=!CL! %%f
echo %CL%
call %CL%
r.js.cmd -o name=../almond include=glitch out=glitch-built.js baseUrl=js wrap.startFile=dat.gui.js insertRequire=glitch