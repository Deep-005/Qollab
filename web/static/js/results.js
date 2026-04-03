// web/static/js/results.js
const jobId = window.location.pathname.split('/')[2];
let currentPage = 1;
let totalPages = 1;
let allResults = [];

async function loadResults(page = 1) {
    try {
        const response = await fetch(`/api/jobs/${jobId}/match/?page=${page}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        document.getElementById('loading').classList.add('hidden');
        
        // Check if response is paginated (has results array or count/results structure)
        let candidates = [];
        let paginationInfo = null;
        
        if (data.results) {
            // Paginated response
            candidates = data.results;
            paginationInfo = {
                count: data.count,
                next: data.next,
                previous: data.previous,
                currentPage: page,
                totalPages: Math.ceil(data.count / 25)
            };
        } else {
            // Non-paginated response (fallback)
            candidates = data;
            paginationInfo = {
                count: candidates.length,
                currentPage: 1,
                totalPages: 1
            };
        }
        
        if (candidates.length === 0) {
            document.getElementById('results').innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📭</div>
                    <p class="text-gray-500 text-lg">No candidates found to match.</p>
                    <p class="text-gray-400 mt-2">Upload some resumes first!</p>
                    <button onclick="window.location.href='/jobs/${jobId}/upload/'" 
                            class="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                        Upload Resumes
                    </button>
                </div>
            `;
        } else {
            displayResults(candidates, paginationInfo);
        }
        
        document.getElementById('results').classList.remove('hidden');
        
    } catch (error) {
        console.error('Load results error:', error);
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
    }
}

function displayResults(candidates, paginationInfo) {
    const resultsDiv = document.getElementById('results');
    
    // Get query type from first candidate
    const queryType = candidates[0]?.query_type || 'full_description';
    const isKeywordQuery = queryType === 'keyword_query';
    
    // Summary stats (based on all results, not just current page)
    // For accurate summary, we'd need total count from pagination
    const summaryStats = {
        excellent: candidates.filter(c => c.score >= 0.8).length,
        good: candidates.filter(c => c.score >= 0.6 && c.score < 0.8).length,
        fair: candidates.filter(c => c.score >= 0.4 && c.score < 0.6).length,
        poor: candidates.filter(c => c.score < 0.4).length
    };
    
    // Note: These stats are only for current page
    const totalCount = paginationInfo.count || candidates.length;
    
    const html = `
        <!-- Query Type Badge -->
        <div class="mb-4 text-center">
            <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold ${isKeywordQuery ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                ${isKeywordQuery ? '🔍 Keyword Search Mode' : '📄 Full Description Match Mode'}
            </span>
        </div>
        
        <!-- Results Count -->
        <div class="mb-4 text-center text-gray-600">
            Showing ${candidates.length} of ${totalCount} ranked resumes
        </div>
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-lg shadow p-4 text-center">
                <div class="text-2xl font-bold text-green-600">${summaryStats.excellent}</div>
                <div class="text-sm text-gray-600">Excellent (80%+)</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4 text-center">
                <div class="text-2xl font-bold text-yellow-600">${summaryStats.good}</div>
                <div class="text-sm text-gray-600">Good (60-79%)</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4 text-center">
                <div class="text-2xl font-bold text-orange-600">${summaryStats.fair}</div>
                <div class="text-sm text-gray-600">Fair (40-59%)</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4 text-center">
                <div class="text-2xl font-bold text-red-600">${summaryStats.poor}</div>
                <div class="text-sm text-gray-600">Poor (<40%)</div>
            </div>
        </div>
        
        <!-- Results List -->
        <div class="space-y-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">📊 Ranked Resumes</h3>
            ${candidates.map((candidate, index) => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                    <div class="p-6">
                        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="text-2xl font-bold text-gray-400">#${((paginationInfo.currentPage - 1) * 25) + index + 1}</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg font-semibold text-gray-800">${escapeHtml(candidate.resume_filename || 'Unknown File')}</span>
                                    </div>
                                </div>
                                
                                <!-- Attractive View Resume Button -->
                                <button onclick="viewResume('${candidate.resume_url}')" 
                                        class="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    View Resume
                                </button>
                            </div>
                            
                            <div class="md:w-64">
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium text-gray-700">Overall Match</span>
                                    <span class="font-bold ${getScoreColor(candidate.score)}">${(candidate.score * 100).toFixed(1)}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
                                    <div class="h-full rounded-full transition-all duration-500 ${getScoreBarColor(candidate.score)}" 
                                         style="width: ${candidate.score * 100}%"></div>
                                </div>
                                
                                <div class="text-xs text-gray-500 space-y-1">
                                    <div class="flex justify-between">
                                        <span>🔑 Keyword Match:</span>
                                        <span class="font-medium">${(candidate.keyword_score * 100).toFixed(0)}%</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>📖 Semantic Match:</span>
                                        <span class="font-medium">${(candidate.semantic_score * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-center md:text-right">
                                <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto md:mx-0 ${getScoreBadgeColor(candidate.score)} shadow-md">
                                    <span class="text-xl font-bold">${(candidate.score * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Keyword Details (Collapsible) -->
                        ${(candidate.matched_keywords && candidate.matched_keywords.length > 0) || (candidate.missing_keywords && candidate.missing_keywords.length > 0) ? `
                            <div class="mt-4 pt-4 border-t border-gray-100">
                                <button onclick="toggleKeywords(${index})" 
                                        class="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 transition-colors">
                                    <span id="toggle-icon-${index}" class="text-lg">▼</span>
                                    <span>Keyword Match Details</span>
                                </button>
                                <div id="keywords-${index}" class="mt-3 hidden">
                                    ${candidate.matched_keywords && candidate.matched_keywords.length > 0 ? `
                                        <div class="mb-3 bg-green-50 rounded-lg p-3">
                                            <p class="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                                <span>✅</span> Matched Keywords (${candidate.matched_keywords.length})
                                            </p>
                                            <div class="flex flex-wrap gap-2">
                                                ${candidate.matched_keywords.map(kw => `
                                                    <span class="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-medium">${escapeHtml(kw)}</span>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${candidate.missing_keywords && candidate.missing_keywords.length > 0 ? `
                                        <div class="bg-red-50 rounded-lg p-3">
                                            <p class="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                                                <span>❌</span> Missing Keywords (${candidate.missing_keywords.length})
                                            </p>
                                            <div class="flex flex-wrap gap-2">
                                                ${candidate.missing_keywords.map(kw => `
                                                    <span class="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">${escapeHtml(kw)}</span>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <!-- Pagination Controls -->
        ${paginationInfo.totalPages > 1 ? `
            <div class="mt-8 flex justify-center items-center gap-2">
                <button onclick="goToPage(${paginationInfo.currentPage - 1})" 
                        ${paginationInfo.currentPage === 1 ? 'disabled' : ''}
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    ← Previous
                </button>
                
                <div class="flex gap-1">
                    ${generatePageButtons(paginationInfo.currentPage, paginationInfo.totalPages)}
                </div>
                
                <button onclick="goToPage(${paginationInfo.currentPage + 1})" 
                        ${paginationInfo.currentPage === paginationInfo.totalPages ? 'disabled' : ''}
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    Next →
                </button>
            </div>
        ` : ''}
        
        <!-- Action Buttons -->
        <div class="mt-8 flex gap-4 justify-center">
            <button onclick="window.location.href='/jobs/${jobId}/upload/'" 
                    class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg">
                📤 Upload More Resumes
            </button>
            <button onclick="window.location.href='/jobs/create/'" 
                    class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg">
                ✨ Create New Job
            </button>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function generatePageButtons(currentPage, totalPages) {
    let buttons = '';
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        buttons += `<button onclick="goToPage(1)" class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">1</button>`;
        if (startPage > 2) {
            buttons += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttons += `<button onclick="goToPage(${i})" 
                        class="px-3 py-2 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition">
                        ${i}
                    </button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            buttons += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
        buttons += `<button onclick="goToPage(${totalPages})" class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">${totalPages}</button>`;
    }
    
    return buttons;
}

function goToPage(page) {
    if (page < 1) return;
    document.getElementById('results').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    currentPage = page;
    loadResults(page);
}

// Function to view resume
function viewResume(resumeUrl) {
    if (resumeUrl) {
        window.open(resumeUrl, '_blank');
    } else {
        alert('❌ Resume file not available. The file may have been deleted or moved.');
    }
}

// Toggle keyword details
function toggleKeywords(index) {
    const keywordsDiv = document.getElementById(`keywords-${index}`);
    const icon = document.getElementById(`toggle-icon-${index}`);
    
    if (keywordsDiv.classList.contains('hidden')) {
        keywordsDiv.classList.remove('hidden');
        keywordsDiv.style.animation = 'slideDown 0.3s ease-out';
        icon.textContent = '▲';
    } else {
        keywordsDiv.classList.add('hidden');
        icon.textContent = '▼';
    }
}

function startNew() {
    window.location.href = '/jobs/create/';
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

function getScoreColor(score) {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-red-600";
}

function getScoreBarColor(score) {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-yellow-500";
    if (score >= 0.4) return "bg-orange-500";
    return "bg-red-500";
}

function getScoreBadgeColor(score) {
    if (score >= 0.8) return "bg-green-100 text-green-700";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-700";
    if (score >= 0.4) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
}

function escapeHtml(text) {
    if (!text) return '';
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

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Load results on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    loadResults();
});

// Make functions globally available
window.viewResume = viewResume;
window.toggleKeywords = toggleKeywords;
window.startNew = startNew;
window.logout = logout;
window.goToPage = goToPage;