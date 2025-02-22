document.getElementById('verifyBtn').addEventListener('click', async () => {
const urlParams = new URLSearchParams(window.location.search);
const encryptedId = urlParams.get('id');
const pin = document.getElementById('verifyPin').value;

if (!encryptedId || !pin) {
    showAlert('Data tidak valid');
    return;
}

const loadingIndicator = document.getElementById('verifyLoadingIndicator');
const verifyBtn = document.getElementById('verifyBtn');
loadingIndicator.classList.remove('hidden');
verifyBtn.disabled = true;

try {
    const response = await fetch('/api/verify-credential', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            userId: encryptedId,
            pin 
        }),
    });

    if (!response.ok) {
        throw new Error('Respons server tidak valid');
    }

    const data = await response.json();
    
    if (data.credential) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Bersihkan dan format credential
        const cleanedContent = cleanCredentialContent(data.credential);
        
        // Tampilkan hasil
        const resultDiv = document.getElementById('credentialResult');
        const credentialText = document.getElementById('credentialText');
        
        // Gunakan innerHTML untuk mempertahankan format
        credentialText.innerHTML = formatCredential(cleanedContent);
        resultDiv.classList.remove('hidden');
    } else {
        showAlert('PIN salah atau data tidak ditemukan');
    }
} catch (error) {
    console.error('Error:', error);
    showAlert('Terjadi kesalahan: ' + error.message);
} finally {
    loadingIndicator.classList.add('hidden');
    verifyBtn.disabled = false;
}
});


function cleanCredentialContent(htmlContent) {
if (!htmlContent) return '';

try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    function processNode(node) {
        // Handle block elements (p, div, etc.)
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            
            // Special handling for different elements
            switch (tag) {
                case 'p':
                case 'div':
                    return node.innerHTML.trim() + '\n\n';
                case 'br':
                    return '\n';
                case 'ul':
                case 'ol':
                    return Array.from(node.children)
                        .map(li => '• ' + li.textContent.trim())
                        .join('\n') + '\n\n';
                default:
                    // For other elements, process their children
                    return Array.from(node.childNodes)
                        .map(child => processNode(child))
                        .join('');
            }
        }
        
        // Handle text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }
        
        return '';
    }
    
    let cleanText = processNode(tempDiv);
    
    // Normalize spacing while preserving intentional line breaks
    cleanText = cleanText
        .replace(/\n{3,}/g, '\n\n')     // Convert multiple line breaks to double
        .replace(/[ \t]+/g, ' ')         // Normalize horizontal whitespace
        .trim();
    
    return cleanText;
} catch (error) {
    console.error('Error cleaning credential:', error);
    return htmlContent;
}
}

function formatCredential(cleanText) {
if (!cleanText) return '';

try {
    // Split into paragraphs while preserving intentional line breaks
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(paragraph => {
        const lines = paragraph.split('\n');
        
        return lines.map(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('•')) {
                // Format list items
                return `<ul class="list-disc ml-6 my-2">
                    <li class="text-gray-700">${trimmedLine.substring(1).trim()}</li>
                </ul>`;
            } else if (trimmedLine.length > 0) {
                // Format regular paragraphs
                return `<p class="my-2 text-gray-700">${trimmedLine}</p>`;
            }
            return '';
        }).join('');
    }).join('\n');
} catch (error) {
    console.error('Error formatting credential:', error);
    return cleanText;
}
}

function showAlert(message) {
const alertModal = document.getElementById('alertModal');
const alertMessage = document.getElementById('alertMessage');

if (alertModal && alertMessage) {
    alertMessage.textContent = message;
    alertModal.classList.remove('hidden');

    setTimeout(() => {
        alertModal.classList.add('hidden');
    }, 3000);
} else {
    console.error('Alert modal elements not found');
    alert(message); // Fallback ke alert standar
}
}

// Event untuk menutup modal alert
document.getElementById('closeAlert')?.addEventListener('click', () => {
document.getElementById('alertModal')?.classList.add('hidden');
});
