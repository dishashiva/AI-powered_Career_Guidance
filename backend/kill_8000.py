import os
import subprocess
import time
import httpx

while True:
    try:
        res = httpx.get('http://localhost:8000/docs')
        print('Server alive on 8000. Killing...')
        output = subprocess.check_output('netstat -ano | findstr :8000', shell=True).decode()
        pids = set(line.strip().split()[-1] for line in output.split('\n') if line.strip() and 'LISTENING' in line)
        for pid in pids:
            print(f"Killing PID {pid}")
            subprocess.run(f'taskkill /PID {pid} /T /F', shell=True)
        time.sleep(1)
    except Exception as e:
        print('Server dead!')
        break
