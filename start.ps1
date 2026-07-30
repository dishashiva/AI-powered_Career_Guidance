$pythonBin = "python"
if (Test-Path "backend\venv\Scripts\python.exe") {
    $pythonBin = "backend\venv\Scripts\python.exe"
}

& $pythonBin start.py
