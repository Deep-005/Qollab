// Character counter 
document.addEventListener('DOMContentLoaded', function() {
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('desc');
    const charCount = document.getElementById('charCount');

    function updateCharCount() {
        if (charCount && descInput) {
            charCount.textContent = descInput.value.length;
        }
    }

    if (descInput) {
        descInput.addEventListener('input', updateCharCount);
        updateCharCount();
    }

    // Check authentication
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    // Load existing jobs for dropdown
    loadExistingJobs();
    
    // Setup job selection handler
    setupJobSelection();
});

// Global variable to track if an existing job is selected
let selectedExistingJobId = null;

// Helper function for API calls
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
    };
}

function getCSRFToken() {
    const token = document.querySelector('[name=csrf-token]');
    return token ? token.getAttribute('content') : '';
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.remove('opacity-0');
    if (isError) {
        toast.classList.add('bg-red-600');
        toast.classList.remove('bg-gray-900');
    } else {
        toast.classList.add('bg-gray-900');
        toast.classList.remove('bg-red-600');
    }
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 3000);
}

// Load existing jobs for dropdown
async function loadExistingJobs() {
    try {
        const response = await fetch('/api/jobs/', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const jobs = await response.json();
            const select = document.getElementById('existingJobSelect');
            
            if (select) {
                // Clear existing options except the first one
                while (select.options.length > 1) {
                    select.remove(1);
                }
                
                if (jobs && jobs.length > 0) {
                    jobs.forEach(job => {
                        const option = document.createElement('option');
                        option.value = job.id;
                        const date = new Date(job.created_at).toLocaleDateString();
                        option.textContent = `${job.title} (Created: ${date})`;
                        select.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = '-- No existing jobs --';
                    option.disabled = true;
                    select.appendChild(option);
                }
            }
        } else {
            console.error('Failed to load jobs:', response.status);
        }
    } catch (error) {
        console.error('Failed to load jobs:', error);
    }
}

// Handle job selection from dropdown
function setupJobSelection() {
    const select = document.getElementById('existingJobSelect');
    if (select) {
        // Remove any existing event listeners
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
        
        newSelect.addEventListener('change', async function() {
            const jobId = this.value;
            if (jobId) {
                showToast('Loading job details...');
                
                try {
                    const response = await fetch(`/api/jobs/${jobId}/`, {
                        method: 'GET',
                        headers: getAuthHeaders()
                    });
                    
                    if (response.ok) {
                        const job = await response.json();
                        const titleInputField = document.getElementById('title');
                        const descInputField = document.getElementById('desc');
                        
                        if (titleInputField) titleInputField.value = job.title;
                        if (descInputField) descInputField.value = job.description;
                        
                        // Store the selected job ID
                        selectedExistingJobId = jobId;
                        
                        // Change button text to indicate we'll use existing job
                        const createBtn = document.querySelector('button[onclick="createJob()"]');
                        if (createBtn) {
                            createBtn.innerHTML = 'Use This Job & Continue →';
                            createBtn.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-teal-600');
                            createBtn.classList.remove('from-indigo-600', 'to-purple-600');
                        }
                        
                        // Trigger character count update
                        if (descInputField) {
                            const event = new Event('input');
                            descInputField.dispatchEvent(event);
                        }
                        
                        showToast('Job loaded! Click "Use This Job" to proceed.');
                        
                        // Scroll to form
                        document.querySelector('.space-y-6')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        throw new Error('Failed to load job');
                    }
                } catch (error) {
                    console.error('Failed to load job:', error);
                    showToast('Failed to load job details', true);
                }
            } else {
                // Reset when "Create new job" is selected
                selectedExistingJobId = null;
                const titleInputField = document.getElementById('title');
                const descInputField = document.getElementById('desc');
                if (titleInputField) titleInputField.value = '';
                if (descInputField) descInputField.value = '';
                
                // Reset button text
                const createBtn = document.querySelector('button[onclick="createJob()"]');
                if (createBtn) {
                    createBtn.innerHTML = 'Create Job & Continue →';
                    createBtn.classList.remove('from-emerald-600', 'to-teal-600');
                    createBtn.classList.add('from-indigo-600', 'to-purple-600');
                }
                
                updateCharCount();
            }
        });
    }
}

async function createJob() {
    const titleInputField = document.getElementById('title');
    const descInputField = document.getElementById('desc');
    
    const title = titleInputField?.value.trim();
    const description = descInputField?.value.trim();
    
    if (!title || !description) {
        showToast('Please fill in both title and description', true);
        return;
    }
    
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg class="animate-spin inline-block h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...';
    btn.disabled = true;
    
    try {
        let jobId;
        
        // If an existing job is selected, use its ID instead of creating new
        if (selectedExistingJobId) {
            jobId = selectedExistingJobId;
            showToast('Using existing job! Redirecting to upload...');
        } else {
            // Create new job
            const response = await fetch('/api/jobs/', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ title, description })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create job');
            }
            
            jobId = data.id;
            showToast('Job created successfully!');
        }
        
        // Redirect to upload page with the job ID
        setTimeout(() => {
            window.location.href = `/jobs/${jobId}/upload/`;
        }, 1000);
        
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Something went wrong', true);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

// Make functions globally available
window.createJob = createJob;
window.logout = logout;