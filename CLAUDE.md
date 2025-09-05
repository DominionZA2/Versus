# Project Instructions

## Development Server

To start the development server:
```bash
npm run dev
```

## Killing Processes on Port 3000 (Windows)

If port 3000 is in use, follow these steps:

1. Find the process using port 3000:
```bash
netstat -ano | findstr :3000
```

2. Kill the process using PowerShell (replace PID with actual process ID):
```bash
powershell "Stop-Process -Id [PID] -Force"
```

3. Verify port is free:
```bash
netstat -ano | findstr :3000
```

4. Then start the server:
```bash
npm run dev
```

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