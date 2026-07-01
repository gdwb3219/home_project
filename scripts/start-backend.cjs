const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const backendDir = path.join(__dirname, '..', 'backend')
const venvPythonPaths = [
  path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
  path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
  path.join(backendDir, 'venv', 'bin', 'python'),
  path.join(backendDir, '.venv', 'bin', 'python'),
]

const venvPython = venvPythonPaths.find((candidate) => fs.existsSync(candidate))
const python = venvPython ?? (process.platform === 'win32' ? 'python' : 'python3')

if (!venvPython) {
  console.warn(
    '[backend] venv를 찾지 못했습니다. 시스템 Python을 사용합니다.',
    'backend/venv 생성: cd backend && python -m venv venv && pip install -r requirements.txt',
  )
}

const child = spawn(python, ['manage.py', 'runserver'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
})

child.on('error', (error) => {
  console.error('[backend] Django 서버 실행 실패:', error.message)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})
