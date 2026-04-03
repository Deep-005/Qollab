const jobId = window.JOB_ID;
let selectedFiles = [];
let existingResumesCount = 0;
let pendingUpload = false;

// Load job details on page load
document.addEventListener('DOMContentLoaded', () => {
    loadJobDetails();
    setupFileInput();
    checkExistingResumes();
});

// Check how many resumes exist in the system
async function checkExistingResumes() {
    try {
        const response = await fetch('/api/resumes/count/', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            existingResumesCount = data.count;
            
            const warningDiv = document.getElementById('existingResumesWarning');
            const clearBtn = document.getElementById('clearAllBtn');
            const warningMessage = document.getElementById('warningMessage');
            
            if (existingResumesCount > 0) {
                warningDiv.classList.remove('hidden');
                clearBtn.classList.remove('hidden');
                
                // Update warning message with count
                if (warningMessage) {
                    warningMessage.innerHTML = `<strong>Warning:</strong> You have <strong>${existingResumesCount}</strong> existing resume(s) in the system. 
                        For accurate matching with this job, please clear previous resumes first.`;
                }
            } else {
                warningDiv.classList.add('hidden');
                clearBtn.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Failed to check existing resumes:', error);
    }
}

// Confirm clear all resumes with modal
function confirmClearAllResumes() {
    const modal = document.getElementById('clearConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    if (confirmMessage) {
        confirmMessage.innerHTML = `Are you sure you want to delete all <strong>${existingResumesCount}</strong> resume(s)? This action cannot be undone.`;
    }
    
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// Close clear modal
function closeClearModal() {
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Execute clear all resumes
async function executeClearAll() {
    closeClearModal();
    
    const clearBtn = document.getElementById('clearAllBtn');
    const originalText = clearBtn.innerHTML;
    clearBtn.innerHTML = 'Deleting...';
    clearBtn.disabled = true;
    
    try {
        const response = await fetch('/api/resumes/clear-all/', {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast(`✅ Successfully deleted ${data.deleted_count} resume(s)`);
            existingResumesCount = 0;
            
            // Hide warning and clear button
            const warningDiv = document.getElementById('existingResumesWarning');
            const clearBtnElement = document.getElementById('clearAllBtn');
            if (warningDiv) warningDiv.classList.add('hidden');
            if (clearBtnElement) clearBtnElement.classList.add('hidden');
            
            // Clear any selected files
            selectedFiles = [];
            updateFileList();
            document.getElementById('fileInput').value = '';
            
            // Refresh the page after 1.5 seconds
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to delete resumes', true);
        }
    } catch (error) {
        console.error('Clear all error:', error);
        showToast('Failed to delete resumes', true);
    } finally {
        clearBtn.innerHTML = originalText;
        clearBtn.disabled = false;
    }
}

// Show upload warning modal
function showUploadWarning() {
    const modal = document.getElementById('uploadWarningModal');
    const warningMessage = document.getElementById('uploadWarningMessage');
    
    if (warningMessage) {
        warningMessage.innerHTML = `You have <strong>${existingResumesCount}</strong> existing resume(s) in the system. 
            Uploading new resumes will match against ALL resumes including old ones, which may affect result accuracy.`;
    }
    
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// Close upload warning modal
function closeUploadWarningModal() {
    const modal = document.getElementById('uploadWarningModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    pendingUpload = false;
}

// Proceed with upload after warning
function proceedWithUpload() {
    closeUploadWarningModal();
    performUpload();
}

// Modified upload function with warning check
async function uploadResumes() {
    if (selectedFiles.length === 0) {
        showToast('Please select files to upload', true);
        return;
    }
    
    // Check if there are existing resumes
    if (existingResumesCount > 0) {
        showUploadWarning();
        return;
    }
    
    performUpload();
}

// Actual upload execution
async function performUpload() {
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('flex');
        loadingOverlay.classList.remove('hidden');
    }
    
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/resumes/batch/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-CSRFToken': getCSRFToken()
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`${result.success_count} resumes uploaded successfully`);
            // Redirect to results page
            setTimeout(() => {
                window.location.href = `/jobs/${jobId}/results/`;
            }, 1500);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Failed to upload resumes', true);
        if (loadingOverlay) {
            loadingOverlay.classList.remove('flex');
            loadingOverlay.classList.add('hidden');
        }
    }
}

async function loadJobDetails() {
    try {
        const response = await fetch(`/api/jobs/${jobId}/`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const job = await response.json();
            document.getElementById('jobTitle').textContent = job.title;
            document.getElementById('jobDesc').textContent = job.description;
            document.getElementById('jobLoading').classList.add('hidden');
            document.getElementById('jobContent').classList.remove('hidden');
        } else {
            throw new Error('Failed to load job');
        }
    } catch (error) {
        console.error('Load job error:', error);
        document.getElementById('jobLoading').classList.add('hidden');
        document.getElementById('jobError').classList.remove('hidden');
    }
}

function setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }
    
    // Drag and drop
    const dropZone = uploadArea?.parentElement;
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-indigo-400', 'bg-indigo-50');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-400', 'bg-indigo-50');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-400', 'bg-indigo-50');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }
}

function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024
    );
    
    if (validFiles.length !== files.length) {
        showToast('Some files were skipped (only PDF files under 5MB allowed)', true);
    }
    
    selectedFiles = [...selectedFiles, ...validFiles];
    updateFileList();
}

function updateFileList() {
    const fileListDiv = document.getElementById('fileList');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadStats = document.getElementById('uploadStats');
    const fileCountSpan = document.getElementById('fileCount');
    
    if (selectedFiles.length === 0) {
        if (fileListDiv) fileListDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No files selected</p>';
        if (uploadBtn) uploadBtn.disabled = true;
        if (uploadStats) uploadStats.classList.add('hidden');
        return;
    }
    
    if (fileListDiv) {
        fileListDiv.innerHTML = selectedFiles.map((file, index) => `
            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">📄</span>
                    <div>
                        <p class="font-medium text-gray-800">${escapeHtml(file.name)}</p>
                        <p class="text-xs text-gray-500">${(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                </div>
                <button onclick="removeFile(${index})" class="text-red-500 hover:text-red-700">
                    ✕
                </button>
            </div>
        `).join('');
    }
    
    if (fileCountSpan) fileCountSpan.textContent = selectedFiles.length;
    if (uploadStats) uploadStats.classList.remove('hidden');
    if (uploadBtn) uploadBtn.disabled = false;
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

function goBack() {
    window.location.href = '/jobs/create/';
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// Make functions globally available
window.removeFile = removeFile;
window.goBack = goBack;
window.logout = logout;
window.uploadResumes = uploadResumes;
window.confirmClearAllResumes = confirmClearAllResumes;
window.closeClearModal = closeClearModal;
window.executeClearAll = executeClearAll;
window.closeUploadWarningModal = closeUploadWarningModal;
window.proceedWithUpload = proceedWithUpload;