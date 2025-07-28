// Katapayadi Sankhya mapping - consonants to numbers (traditional system)
// DEVELOPER NOTE: If you find incorrect consonant identification, modify this mapping below
// Each consonant maps to its traditional Katapayadi value (0-9)
// Vowels are NOT included in this map and should be ignored during extraction
const KATAPAYADI_MAP = {
    // Ka group (कटपयादि) - 1,2,3,4,5
    'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5,
    // Cha group - 6,7,8,9,0
    'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0,
    // Ta group (first) - 1,2,3,4,5
    'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5,
    // Ta group (second) - 6,7,8,9,0
    'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0,
    // Pa group - 1,2,3,4,5
    'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5,
    // Ya group - 1,2,3,4,5,6,7,8
    'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8
};

// Create an array of all consonants for the spiral
const CONSONANTS = Object.keys(KATAPAYADI_MAP);

// Complete list of 72 Melakartha Ragas
const MELAKARTHA_RAGAS = [
    { number: 1, name: "कनकांगि", transliteration: "Kanakangi" },
    { number: 2, name: "रत्नांगि", transliteration: "Ratnangi" },
    { number: 3, name: "गानमूर्ति", transliteration: "Ganamurti" },
    { number: 4, name: "वनस्पति", transliteration: "Vanaspati" },
    { number: 5, name: "मानवती", transliteration: "Manavati" },
    { number: 6, name: "तानरूपिणी", transliteration: "Tanarupini" },
    { number: 7, name: "सेनावती", transliteration: "Senavati" },
    { number: 8, name: "हनुमत्तोड़ी", transliteration: "Hanumatodi" },
    { number: 9, name: "धेनुका", transliteration: "Dhenuka" },
    { number: 10, name: "नाटकप्रिया", transliteration: "Natakapriya" },
    { number: 11, name: "कोकिलप्रिया", transliteration: "Kokilapriya" },
    { number: 12, name: "रूपावती", transliteration: "Rupavati" },
    { number: 13, name: "गायकप्रिया", transliteration: "Gayakapriya" },
    { number: 14, name: "वकुलाभरणम्", transliteration: "Vakulabharanam" },
    { number: 15, name: "मायामालवगौल", transliteration: "Mayamalavagaula" },
    { number: 16, name: "चक्रवाक", transliteration: "Chakravakam" },
    { number: 17, name: "सूर्यकान्त", transliteration: "Suryakanta" },
    { number: 18, name: "हाटकाम्बरी", transliteration: "Hatakambari" },
    { number: 19, name: "झंकारध्वनि", transliteration: "Jhankaradhvani" },
    { number: 20, name: "नटभैरवी", transliteration: "Natabhairavi" },
    { number: 21, name: "कीरवाणी", transliteration: "Keeravani" },
    { number: 22, name: "खरहरप्रिया", transliteration: "Kharaharapriya" },
    { number: 23, name: "गौरीमनोहरी", transliteration: "Gaurimanohari" },
    { number: 24, name: "वरुणप्रिया", transliteration: "Varunapriya" },
    { number: 25, name: "माररञ्जनि", transliteration: "MaraRanjani" },
    { number: 26, name: "चारुकेसी", transliteration: "Charukesi" },
    { number: 27, name: "सरसाङ्गी", transliteration: "Sarasangi" },
    { number: 28, name: "हरिकाम्भोजी", transliteration: "Harikambhoji" },
    { number: 29, name: "धीरशंकराभरणम्", transliteration: "Dheerasankarabharanam" },
    { number: 30, name: "नागनन्दिनी", transliteration: "Naganandini" },
    { number: 31, name: "यागप्रिया", transliteration: "Yagapriya" },
    { number: 32, name: "रागवर्धिनी", transliteration: "Ragavardhini" },
    { number: 33, name: "गांगेयभूषणी", transliteration: "Gangeyabhushani" },
    { number: 34, name: "वागधीश्वरी", transliteration: "Vagadhisvari" },
    { number: 35, name: "शूलिनी", transliteration: "Shoolini" },
    { number: 36, name: "चलनाट", transliteration: "Chalanata" },
    { number: 37, name: "सालग", transliteration: "Salaga" },
    { number: 38, name: "जलार्णव", transliteration: "Jalarnavam" },
    { number: 39, name: "झालवराली", transliteration: "Jhalavarali" },
    { number: 40, name: "नवनीतकृष्ण", transliteration: "Navaneetakrishna" },
    { number: 41, name: "पावनी", transliteration: "Pavani" },
    { number: 42, name: "रघुप्रिया", transliteration: "Raghupriya" },
    { number: 43, name: "गवाम्भोधि", transliteration: "Gavambodhi" },
    { number: 44, name: "भावप्रिया", transliteration: "Bhavapriya" },
    { number: 45, name: "शुभपन्तुवारली", transliteration: "Shubhapanthuvarali" },
    { number: 46, name: "षड्विधमार्गिणी", transliteration: "Shadvidhamargini" },
    { number: 47, name: "सुवर्णांगी", transliteration: "Suvarnangi" },
    { number: 48, name: "दिव्यमणि", transliteration: "Divyamani" },
    { number: 49, name: "धवलाम्बरी", transliteration: "Dhavalambari" },
    { number: 50, name: "नामनारायणी", transliteration: "Namanarayani" },
    { number: 51, name: "कामवर्धिनी", transliteration: "Kamavardhini" },
    { number: 52, name: "रामप्रिया", transliteration: "Ramapriya" },
    { number: 53, name: "गमनश्र्रम", transliteration: "Gamanashrama" },
    { number: 54, name: "विश्वम्भरी", transliteration: "Vishvambhari" },
    { number: 55, name: "श्यामलांगी", transliteration: "Shyamalangi" },
    { number: 56, name: "षण्मुखप्रिया", transliteration: "Shanmukhapriya" },
    { number: 57, name: "सिममहेन्द्रमध्यमम्", transliteration: "Simamahendramadhyamam" },
    { number: 58, name: "हेमावति", transliteration: "Hemavati" },
    { number: 59, name: "धर्मवती", transliteration: "Dharmavati" },
    { number: 60, name: "नीतिमती", transliteration: "Neetimati" },
    { number: 61, name: "कान्तमणि", transliteration: "Kantamani" },
    { number: 62, name: "रुषभप्रिया(ऋषभप्रिया)", transliteration: "Rishabhapriya" },
    { number: 63, name: "लतांगी", transliteration: "Latangi" },
    { number: 64, name: "वाचस्पति", transliteration: "Vachaspati" },
    { number: 65, name: "मेचकल्याणी", transliteration: "Mechakalyani" },
    { number: 66, name: "चित्राम्बरी", transliteration: "Chitrambari" },
    { number: 67, name: "सुचरित्र", transliteration: "Sucharitra" },
    { number: 68, name: "ज्योतिस्वरूपिणी", transliteration: "Jyotiswarupini" },
    { number: 69, name: "धातुवर्धिनी", transliteration: "Dhatuvardhini" },
    { number: 70, name: "नासिकभूषणी", transliteration: "Nasikabhushani" },
    { number: 71, name: "कोसलम्", transliteration: "Kosalam" },
    { number: 72, name: "रसिकप्रिया", transliteration: "Rasikapriya" }
];

// Animation timing variables
const ANIMATION_DURATION = 1000;
const HIGHLIGHT_DURATION = 500;
const STEP_DELAY = 1500;

// SVG dimensions and variables
let width, height, centerX, centerY, maxRadius;
let svg, spiralGroup, spokesGroup;
let encodeBtn, resetBtn, ragaInput, ragaSelect;
let ragaDisplay, consonantsDisplay, encodingStepsDisplay, finalResultDisplay, characterDebugDisplay;
let isAnimating = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Get DOM elements
        encodeBtn = document.getElementById('encode-btn');
        resetBtn = document.getElementById('reset-btn');
        ragaInput = document.getElementById('raga-input');
        ragaSelect = document.getElementById('raga-select');
                 ragaDisplay = document.getElementById('raga-display');
         consonantsDisplay = document.getElementById('consonants-display');
         characterDebugDisplay = document.getElementById('character-debug');
         encodingStepsDisplay = document.getElementById('encoding-steps');
         finalResultDisplay = document.getElementById('final-result');

        // Verify essential elements exist
        if (!ragaSelect || !ragaInput) {
            console.error('Required DOM elements not found');
            return;
        }

        // Populate the dropdown with all 72 Melakartha ragas
        populateRagaDropdown();

    // Initialize SVG
    initializeSVG();
    
    // Draw the initial visualization
    drawVisualization();

    // Add event listeners
    encodeBtn.addEventListener('click', startEncoding);
    resetBtn.addEventListener('click', resetAnimation);
    
    ragaInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') startEncoding();
    });
    
        ragaSelect.addEventListener('change', function(e) {
            if (e.target.value) {
                ragaInput.value = e.target.value;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (!isAnimating) {
                initializeSVG();
                drawVisualization();
            }
        });
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

function populateRagaDropdown() {
    try {
        if (!ragaSelect) {
            console.error('ragaSelect element not found');
            return;
        }
        
        // Keep existing options and add more (in case HTML has some pre-defined ones)
        // Remove only dynamically added options if they exist
        const currentOptions = ragaSelect.querySelectorAll('option[data-dynamic="true"]');
        currentOptions.forEach(option => option.remove());
        
        // Add all 72 Melakartha ragas to the dropdown
        MELAKARTHA_RAGAS.forEach((raga, index) => {
            try {
                const option = document.createElement('option');
                option.value = raga.name;
                option.textContent = `${raga.number}. ${raga.name} (${raga.transliteration})`;
                option.setAttribute('data-dynamic', 'true');
                ragaSelect.appendChild(option);
            } catch (optionError) {
                console.error(`Error creating option for raga ${index}:`, optionError, raga);
            }
        });
        
        console.log(`Successfully populated dropdown with ${ragaSelect.options.length - 1} ragas`);
        
    } catch (error) {
        console.error('Error in populateRagaDropdown:', error);
    }
}

function initializeSVG() {
    // Remove existing SVG
    d3.select('#animation-container svg').remove();
    
    // Get container dimensions
    const container = document.getElementById('animation-container');
    width = container.clientWidth;
    height = container.clientHeight;
    centerX = width / 2;
    centerY = height / 2;
    maxRadius = Math.min(width, height) * 0.45;
    
    // Create SVG
    svg = d3.select('#animation-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
        
    // Create groups for organization
    spiralGroup = svg.append('g').attr('class', 'spiral-group');
    spokesGroup = svg.append('g').attr('class', 'spokes-group');
}

function drawVisualization() {
    // Clear previous visualization
    svg.selectAll('*').remove();
    spiralGroup = svg.append('g').attr('class', 'spiral-group');
    spokesGroup = svg.append('g').attr('class', 'spokes-group');
    
    // Draw the spiral with radial spokes
    drawSpiralWithSpokes();
    
    // Draw center circle
    drawCenterCircle();
}

function drawSpiralWithSpokes() {
    const numSpokes = 40; // Total number of positions on the spiral
    const turns = 3; // Number of spiral turns
    const minRadius = maxRadius * 0.25; // Start spiral further from center
    
    // Generate spiral points
    const spiralPoints = [];
    for (let i = 0; i < numSpokes; i++) {
        const t = i / (numSpokes - 1);
        const angle = t * turns * 2 * Math.PI;
        const radius = minRadius + t * (maxRadius - minRadius); // Expanded spiral range
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        spiralPoints.push({x, y, angle, radius, index: i});
    }
    
    // Draw spiral path
    const line = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinal);
        
    spiralGroup.append('path')
        .datum(spiralPoints)
        .attr('d', line)
        .attr('class', 'spiral-path');
    
    // Draw spokes from center to spiral points
    spokesGroup.selectAll('.spoke-line')
        .data(spiralPoints)
        .enter()
        .append('line')
        .attr('class', 'spoke-line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', d => d.x)
        .attr('y2', d => d.y);
    
    // Place consonants and numbers on the spiral
    const consonantPositions = spiralPoints.slice(0, CONSONANTS.length);
    
    // Add consonants
    spiralGroup.selectAll('.consonant-text')
        .data(consonantPositions)
        .enter()
        .append('text')
        .attr('class', 'consonant-text')
        .attr('x', d => d.x)
        .attr('y', d => d.y - 8)
        .text((d, i) => CONSONANTS[i])
        .attr('id', (d, i) => `consonant-${i}`);
    
    // Add corresponding numbers using actual Katapayadi values
    spiralGroup.selectAll('.number-text')
        .data(consonantPositions)
        .enter()
        .append('text')
        .attr('class', 'number-text')
        .attr('x', d => d.x)
        .attr('y', d => d.y + 15)
        .text((d, i) => {
            const consonant = CONSONANTS[i];
            return KATAPAYADI_MAP[consonant];
        })
        .attr('id', (d, i) => `number-${i}`);
}

function drawCenterCircle() {
    // Center circle removed to avoid obstructing alphabets
}

async function startEncoding() {
    if (isAnimating) return;
    
    const ragaName = ragaInput.value.trim();
    if (!ragaName) {
        alert('Please enter a raga name');
        return;
    }
    
    isAnimating = true;
    encodeBtn.disabled = true;
    
    // Reset displays
    resetDisplays();
    
    // Show raga name
    ragaDisplay.textContent = `Raga: ${ragaName}`;
    
    // Extract first two consonants
    const consonants = extractConsonants(ragaName);
    if (consonants.length < 2) {
        alert('Please enter a raga name with at least 2 consonants');
        isAnimating = false;
        encodeBtn.disabled = false;
        return;
    }
    
    // Show extracted consonants with detailed breakdown
    const firstTwo = consonants.slice(0, 2);
    const consonantInfo = firstTwo.map((c, i) => `${c} (${KATAPAYADI_MAP[c]})`).join(', ');
    consonantsDisplay.innerHTML = `
        <strong>First two consonants used for encoding:</strong><br>
        ${consonantInfo}<br>
        <small style="color: #ccc;">From raga name: "${ragaName}"</small>
    `;
    
    // Animate encoding process
    await animateEncoding(consonants.slice(0, 2));
    
    isAnimating = false;
    encodeBtn.disabled = false;
}

function extractConsonants(text) {
    const consonants = [];
    const allChars = [];
    
    console.log('=== CONSONANT EXTRACTION DEBUG ===');
    console.log('Input text:', text);
    console.log('Character by character analysis:');
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const isConsonant = KATAPAYADI_MAP.hasOwnProperty(char);
        const value = isConsonant ? KATAPAYADI_MAP[char] : 'N/A';
        
        allChars.push({
            index: i,
            char: char,
            isConsonant: isConsonant,
            value: value
        });
        
        console.log(`${i}: "${char}" -> ${isConsonant ? `Consonant (${value})` : 'Not a consonant'}`);
        
        if (isConsonant) {
            consonants.push(char);
        }
    }
    
    console.log('\nFirst 2 consonants extracted:', consonants.slice(0, 2));
    console.log('All consonants found:', consonants);
    console.log('===================================');
    
    // Create visual debug table for developer review
    createCharacterDebugTable(allChars, consonants.slice(0, 2));
    
    return consonants;
}

function createCharacterDebugTable(allChars, selectedConsonants) {
    if (!characterDebugDisplay) return;
    
    let tableHTML = `
        <div style="margin: 15px 0; padding: 15px; background: #2a2a2a; border-radius: 5px;">
            <h4 style="color: #ffd700; margin-bottom: 10px;">🔍 Developer Debug: Character Analysis</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #1a1a1a;">
                        <th style="border: 1px solid #444; padding: 5px;">Position</th>
                        <th style="border: 1px solid #444; padding: 5px;">Character</th>
                        <th style="border: 1px solid #444; padding: 5px;">Type</th>
                        <th style="border: 1px solid #444; padding: 5px;">Katapayadi Value</th>
                        <th style="border: 1px solid #444; padding: 5px;">Used for Encoding</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    allChars.forEach(charInfo => {
        const isSelected = selectedConsonants.includes(charInfo.char);
        const rowStyle = isSelected ? 'background: #4a4a00; color: #ffff00;' : '';
        const usedMark = isSelected ? '✓ USED' : '';
        
        tableHTML += `
            <tr style="${rowStyle}">
                <td style="border: 1px solid #444; padding: 5px; text-align: center;">${charInfo.index}</td>
                <td style="border: 1px solid #444; padding: 5px; text-align: center; font-size: 1.2rem;">${charInfo.char}</td>
                <td style="border: 1px solid #444; padding: 5px; text-align: center;">${charInfo.isConsonant ? 'Consonant' : 'Vowel/Other'}</td>
                <td style="border: 1px solid #444; padding: 5px; text-align: center;">${charInfo.value}</td>
                <td style="border: 1px solid #444; padding: 5px; text-align: center; font-weight: bold;">${usedMark}</td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
            <p style="margin-top: 10px; font-size: 0.8rem; color: #ccc;">
                💡 <strong>For Developers:</strong> Check if the highlighted consonants are correct. 
                Modify the KATAPAYADI_MAP in script.js if any consonants are missing or incorrectly mapped.
            </p>
        </div>
    `;
    
    characterDebugDisplay.innerHTML = tableHTML;
}

async function animateEncoding(consonants) {
    const encodedDigits = [];
    
    for (let i = 0; i < consonants.length; i++) {
        const consonant = consonants[i];
        const digit = KATAPAYADI_MAP[consonant];
        encodedDigits.push(digit);
        
        // Find and highlight the consonant in the spiral
        await highlightConsonantInSpiral(consonant, digit, i + 1);
        
        // Update encoding steps
        updateEncodingSteps(consonants, encodedDigits, i + 1);
        
        await delay(STEP_DELAY);
    }
    
    // Show reversal process
    const originalNumber = encodedDigits.join('');
    const reversedNumber = encodedDigits.reverse().join('');
    const melakarthaNumber = parseInt(reversedNumber);
    
    // Update final encoding steps
    encodingStepsDisplay.innerHTML += `<br>Original order: ${originalNumber}<br>Reversed: ${reversedNumber}`;
    
    await delay(1000);
    
    // Show final result
    finalResultDisplay.textContent = `Melakartha Number: ${melakarthaNumber}`;
    
    // Add pulse animation to final result
    finalResultDisplay.classList.add('pulse');
    
    setTimeout(() => {
        finalResultDisplay.classList.remove('pulse');
    }, 3000);
}

async function highlightConsonantInSpiral(consonant, digit, step) {
    const consonantIndex = CONSONANTS.indexOf(consonant);
    
    if (consonantIndex !== -1) {
        // Highlight consonant
        const consonantElement = d3.select(`#consonant-${consonantIndex}`);
        const numberElement = d3.select(`#number-${consonantIndex}`);
        
        consonantElement
            .classed('highlight-consonant', true)
            .transition()
            .duration(HIGHLIGHT_DURATION)
            .attr('transform', 'scale(1.2)')
            .transition()
            .duration(HIGHLIGHT_DURATION)
            .attr('transform', 'scale(1)');
            
        numberElement
            .classed('highlight-number', true)
            .transition()
            .duration(HIGHLIGHT_DURATION)
            .attr('transform', 'scale(1.2)')
            .transition()
            .duration(HIGHLIGHT_DURATION)
            .attr('transform', 'scale(1)');
        
        // Draw encoding line from a small center point to consonant
        const consonantPos = getConsonantPosition(consonantIndex);
        const centerPoint = maxRadius * 0.05; // Small offset from exact center
        const line = svg.append('line')
            .attr('class', 'encoding-line')
            .attr('x1', centerX)
            .attr('y1', centerY)
            .attr('x2', centerX)
            .attr('y2', centerY)
            .transition()
            .duration(ANIMATION_DURATION)
            .attr('x2', consonantPos.x)
            .attr('y2', consonantPos.y);
        
        await delay(ANIMATION_DURATION);
        
        // Remove highlights after a delay
        setTimeout(() => {
            consonantElement.classed('highlight-consonant', false);
            numberElement.classed('highlight-number', false);
            line.remove();
        }, STEP_DELAY);
    }
}

function getConsonantPosition(index) {
    const numSpokes = 40;
    const turns = 3;
    const minRadius = maxRadius * 0.25; // Same as in drawSpiralWithSpokes
    const t = index / (numSpokes - 1);
    const angle = t * turns * 2 * Math.PI;
    const radius = minRadius + t * (maxRadius - minRadius); // Same expanded calculation
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return {x, y};
}

function updateEncodingSteps(consonants, digits, currentStep) {
    let stepsHTML = '';
    
    for (let i = 0; i < currentStep; i++) {
        stepsHTML += `Step ${i + 1}: ${consonants[i]} → ${digits[i]}<br>`;
    }
    
    encodingStepsDisplay.innerHTML = stepsHTML;
}

function resetAnimation() {
    // Reset all displays
    resetDisplays();
    
    // Reset dropdown selection
    ragaSelect.value = '';
    
    // Remove all highlights
    d3.selectAll('.highlight-consonant').classed('highlight-consonant', false);
    d3.selectAll('.highlight-number').classed('highlight-number', false);
    d3.selectAll('.encoding-line').remove();
    finalResultDisplay.classList.remove('pulse');
    
    // Re-enable encode button
    isAnimating = false;
    encodeBtn.disabled = false;
}

function resetDisplays() {
    ragaDisplay.textContent = '';
    consonantsDisplay.textContent = '';
    if (characterDebugDisplay) characterDebugDisplay.innerHTML = '';
    encodingStepsDisplay.textContent = '';
    finalResultDisplay.textContent = '';
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
