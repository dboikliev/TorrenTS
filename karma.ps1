Start-Process "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Argument "node_modules/.bin/karma start karma.conf.js" #1> D:\out.txt 2>D:\err.txt
Start-Process "chrome" -Argument ".\reports\html-results.html"