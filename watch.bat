@echo off
copy src\*.js js
Setlocal EnableDelayedExpansion
set CL=coco -wcb -o js
for %%f in (src\*.co) do set CL=!CL! %%f
call %CL%