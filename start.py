import os
import sys
import signal
import subprocess
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(ROOT_DIR, "backend")
frontend_dir = os.path.join(ROOT_DIR, "frontend")

# Use backend venv python if available, otherwise current sys.executable
if os.name == "nt":
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
else:
    venv_python = os.path.join(backend_dir, "venv", "bin", "python")

python_bin = venv_python if os.path.exists(venv_python) else sys.executable
npm_bin = "npm.cmd" if os.name == "nt" else "npm"

print("=========================================")
print("  Starting CareerAI Platform (Combined)  ")
print("=========================================")
print(f"Backend Python: {python_bin}")
print(f"Frontend NPM:    {npm_bin}")
print("Press CTRL + C once to shutdown both servers.")
print("=========================================\n", flush=True)

def kill_process_tree(pid):
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGKILL)
        except Exception:
            pass

backend_proc = None
frontend_proc = None

try:
    backend_proc = subprocess.Popen([python_bin, "run.py"], cwd=backend_dir)
    frontend_proc = subprocess.Popen([npm_bin, "run", "dev"], cwd=frontend_dir)

    while True:
        b_code = backend_proc.poll()
        f_code = frontend_proc.poll()
        if b_code is not None or f_code is not None:
            print(f"\n[Notice] Server process exited (Backend: {b_code}, Frontend: {f_code}). Shutting down...", flush=True)
            break
        time.sleep(0.5)

except KeyboardInterrupt:
    print("\n[Ctrl + C] Stopping CareerAI servers...", flush=True)

finally:
    if backend_proc and backend_proc.poll() is None:
        kill_process_tree(backend_proc.pid)
    if frontend_proc and frontend_proc.poll() is None:
        kill_process_tree(frontend_proc.pid)
    print("Done! Both backend and frontend servers have stopped.", flush=True)
