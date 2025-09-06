# Project Instructions

## Development Server

**CRITICAL: ALWAYS USE PORT 3000 ONLY!**

To start the development server:
```bash
npm run dev
```

## Force Kill All Node Processes (Windows)

**ALWAYS run this command BEFORE starting the dev server to ensure port 3000 is available:**

```bash
powershell "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
```

## Alternative: Kill Specific Ports

If you need to kill specific ports, use this sequence:

1. Find all processes using ports 3000-3003:
```bash
netstat -ano | findstr ":300"
```

2. Kill all found processes at once (replace PIDs with actual process IDs):
```bash
powershell "Stop-Process -Id PID1,PID2,PID3 -Force"
```

3. Verify ports are free:
```bash
netstat -ano | findstr :3000
```

4. Start the server (should now use port 3000):
```bash
npm run dev
```

**NEVER accept servers running on ports other than 3000. Always kill processes first.**

## Automated Script

Use the automated script to handle everything:

**From Bash/Git Bash:**
```bash
./start-dev.sh
```

**From PowerShell:**
```powershell
bash start-dev.sh
```

This script will:
1. Kill all Node processes
2. Free up port 3000 
3. Wait for ports to be released
4. Start the dev server on port 3000

## Git Configuration

The project is configured for Windows with CRLF line endings:
- `core.autocrlf = true`
- `core.eol = crlf`
- `.gitattributes` file ensures consistent line endings

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - React components  
- `/src/lib` - Utilities (storage.ts for localStorage)
- `/src/types` - TypeScript type definitions

## Local Storage

All data is persisted in browser localStorage:
- `versus_comparisons` - Comparison objects
- `versus_contenders` - Contender objects with pros/cons