# Development Server Commands

## Kill process on port 3000 and start dev server

```bash
# Kill any process using port 3000
kill -9 $(lsof -t -i:3000) 2>/dev/null || true

# Start the development server in the background
npm run dev &
```

## Alternative single command
```bash
kill -9 $(lsof -t -i:3000) 2>/dev/null || true && npm run dev &
```

## Notes
- The `2>/dev/null || true` prevents errors if no process is using port 3000
- The `&` runs npm run dev in the background so you can continue using the terminal
