// web/static/js/login.js

// Check if already loaded to prevent duplicate execution
if (typeof window.loginInitialized === 'undefined') {
    window.loginInitialized = true;

    async function login() {
        const username = document.getElementById("username")?.value.trim();
        const password = document.getElementById("password")?.value;

        if (!username || !password) {
            alert("Please enter both username and password");
            return;
        }

        const btn = document.querySelector('button[onclick="login()"]');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        
        btn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
        `;
        btn.disabled = true;

        try {
            const response = await fetch("/api/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.access) {
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                window.location.href = "/jobs/create/";
            } else {
                alert(data.error || "Login failed");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed: network error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    function handleKeyPress(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            login();
        }
    }

    // Wait for DOM to be fully loaded before attaching event listeners
    document.addEventListener('DOMContentLoaded', function() {
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        if (usernameInput) usernameInput.addEventListener("keypress", handleKeyPress);
        if (passwordInput) passwordInput.addEventListener("keypress", handleKeyPress);
    });

    // Make login function globally available
    window.login = login;
}

// Helper function to get CSRF token
function getCSRFToken() {
    const token = document.querySelector('[name=csrf-token]');
    return token ? token.getAttribute('content') : '';
}