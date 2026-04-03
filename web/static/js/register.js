async function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert("Please fill in both username and password");
        return;
    }
    
    if (password.length < 4) {
        alert("Password must be at least 4 characters long");
        return;
    }
    
    const btn = document.querySelector('button[onclick="register()"]');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creating account...
    `;
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.status === 201) {
            alert("Registered successfully! Please login.");
            window.location.href = '/';
        } else {
            alert(data.error || "Registration failed");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("Registration failed: network error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.register = register;