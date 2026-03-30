# Simple HTTP Server for testing
Write-Host "Starting HTTP Server for posquotation project..."
Write-Host "Server will be available at: http://localhost:8000"
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""

# Change to project directory
Set-Location "c:\Users\Hannah\Github_Projects\posquotation"

# Try Python 3 first
try {
    python -m http.server 8000
} catch {
    Write-Host "Python 3 not found, trying Python 2..."
    try {
        python -m SimpleHTTPServer 8000
    } catch {
        Write-Host "Python not found. Please install Python or use a different method."
        Write-Host ""
        Write-Host "Alternative options:"
        Write-Host "1. Install Node.js and run: npm install -g http-server"
        Write-Host "2. Use Visual Studio Code's Live Server extension"
        Write-Host "3. Use Python: python -m http.server 8000"
    }
}
