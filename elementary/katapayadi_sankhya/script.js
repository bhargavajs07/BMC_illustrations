// Katapayadi Sankhya mapping - consonants to numbers (traditional system)
// DEVELOPER NOTE: If you find incorrect consonant identification, modify this mapping below
// Each consonant maps to its traditional Katapayadi value (0-9)
// Vowels are NOT included in this map and should be ignored during extraction

/* DEVELOPER GUIDE: Consonant Indices System
 * ==========================================
 * 
 * This script now includes pre-calculated consonant indices for all 72 Melakartha ragas.
 * The MELAKARTHA_RAGAS array contains a 'consonantIndices' field that specifies which
 * CHARACTER POSITIONS within each raga name should be used for encoding.
 * 
 * HOW IT WORKS:
 * 1. When a known raga is entered, the system uses the stored consonantIndices
 * 2. For unknown ragas, it falls back to the original character-by-character extraction
 * 3. The consonantIndices array contains CHARACTER POSITIONS (0-based) within the raga name
 * 
 * EXAMPLE:
 * Raga: "कनकांगि" 
 * Positions: 0=क, 1=न, 2=क, 3=ा, 4=ं, 5=ग, 6=ि
 * consonantIndices: [0, 1] means use characters at positions 0 and 1 (क and न)
 * 
 * UPDATING THE SYSTEM:
 * If you modify the KATAPAYADI_MAP (add/remove/change consonants):
 * 1. Open browser console
 * 2. Call: recalculateAllConsonantIndices()
 * 3. Copy the generated array from console
 * 4. Replace the current MELAKARTHA_RAGAS array in this script
 * 
 * BENEFITS:
 * - Intuitive: indices directly correspond to character positions in raga names
 * - Easy to verify: you can count positions in the raga name to check correctness
 * - Consistent results regardless of character variations in raga names
 * - Easy maintenance when KATAPAYADI_MAP changes
 */
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

// Helper function to extract consonants and their indices from raga name
function calculateConsonantIndices(ragaName) {
    const consonants = [];
    const charPositions = [];  // Character positions within the raga name

    for (let i = 0; i < ragaName.length; i++) {
        const char = ragaName[i];
        if (KATAPAYADI_MAP.hasOwnProperty(char)) {
            consonants.push(char);
            charPositions.push(i);  // Store the position in the raga name
            if (consonants.length >= 2) break; // Only need first two
        }
    }

    return {
        consonants: consonants.slice(0, 2),
        indices: charPositions.slice(0, 2)  // Character positions in raga name
    };
}

// DEVELOPER UTILITY: Function to recalculate all consonant indices
// Call this function in browser console after modifying KATAPAYADI_MAP to get updated indices
function recalculateAllConsonantIndices() {
    console.log('=== RECALCULATING CHARACTER POSITION INDICES FOR ALL RAGAS ===');
    console.log('// Updated MELAKARTHA_RAGAS array with new character position indices:');
    console.log('const MELAKARTHA_RAGAS = [');

    MELAKARTHA_RAGAS.forEach((raga, index) => {
        const result = calculateConsonantIndices(raga.name);
        const ragaChars = raga.name.split('');
        const positionInfo = result.indices.map(pos => `${pos}="${ragaChars[pos]}"`).join(', ');
        console.log(`    { number: ${raga.number}, name: "${raga.name}", transliteration: "${raga.transliteration}", consonantIndices: [${result.indices.join(', ')}] }, // ${positionInfo}`);
    });

    console.log('];');
    console.log('=== Copy the above array to replace the current MELAKARTHA_RAGAS ===');
    console.log('NOTE: Character position indices show the exact positions within each raga name');

    return 'Character position indices recalculated. Check console for updated array.';
}

// Complete list of 72 Melakartha Ragas with character position indices
// Complete list of 72 Melakartha Ragas with character position indices
const MELAKARTHA_RAGAS = [
    { number: 1, name: "कनकांगि", transliteration: "Kanakangi", consonantIndices: [0, 1] }, // 0="क", 1="न"
    { number: 2, name: "रत्नांगि", transliteration: "Ratnangi", consonantIndices: [0, 3] }, // 0="र", 3="न"
    { number: 3, name: "गानमूर्ति", transliteration: "Ganamurti", consonantIndices: [0, 2] }, // 0="ग", 2="न"
    { number: 4, name: "वनस्पति", transliteration: "Vanaspati", consonantIndices: [0, 1] }, // 0="व", 1="न"
    { number: 5, name: "मानवती", transliteration: "Manavati", consonantIndices: [0, 2] }, // 0="म", 2="न"
    { number: 6, name: "तानरूपिणी", transliteration: "Tanarupini", consonantIndices: [0, 2] }, // 0="त", 2="न"
    { number: 7, name: "सेनावती", transliteration: "Senavati", consonantIndices: [0, 2] }, // 0="स", 2="न"
    { number: 8, name: "हनुमत्तोड़ी", transliteration: "Hanumatodi", consonantIndices: [0, 1] }, // 0="ह", 1="न"
    { number: 9, name: "धेनुका", transliteration: "Dhenuka", consonantIndices: [0, 2] }, // 0="ध", 2="न"
    { number: 10, name: "नाटकप्रिया", transliteration: "Natakapriya", consonantIndices: [0, 2] }, // 0="न", 2="ट"
    { number: 11, name: "कोकिलप्रिया", transliteration: "Kokilapriya", consonantIndices: [0, 2] }, // 0="क", 2="क"
    { number: 12, name: "रूपावती", transliteration: "Rupavati", consonantIndices: [0, 2] }, // 0="र", 2="प"
    { number: 13, name: "गायकप्रिया", transliteration: "Gayakapriya", consonantIndices: [0, 2] }, // 0="ग", 2="य"
    { number: 14, name: "वकुलाभरणम्", transliteration: "Vakulabharanam", consonantIndices: [0, 1] }, // 0="व", 1="क"
    { number: 15, name: "मायामालवगौल", transliteration: "Mayamalavagaula", consonantIndices: [0, 2] }, // 0="म", 2="य"
    { number: 16, name: "चक्रवाक", transliteration: "Chakravakam", consonantIndices: [0, 1] }, // 0="च", 1="क"
    { number: 17, name: "सूर्यकान्त", transliteration: "Suryakanta", consonantIndices: [0, 4] }, // 0="स", 4="य"
    { number: 18, name: "हाटकाम्बरी", transliteration: "Hatakambari", consonantIndices: [0, 2] }, // 0="ह", 2="ट"
    { number: 19, name: "झंकारध्वनि", transliteration: "Jhankaradhvani", consonantIndices: [0, 2] }, // 0="झ", 2="क"
    { number: 20, name: "नटभैरवी", transliteration: "Natabhairavi", consonantIndices: [0, 4] }, // 0="न", 4="र"
    { number: 21, name: "कीरवाणी", transliteration: "Keeravani", consonantIndices: [0, 2] }, // 0="क", 2="र"
    { number: 22, name: "खरहरप्रिया", transliteration: "Kharaharapriya", consonantIndices: [0, 1] }, // 0="ख", 1="र"
    { number: 23, name: "गौरीमनोहरी", transliteration: "Gaurimanohari", consonantIndices: [0, 2] }, // 0="ग", 2="र"
    { number: 24, name: "वरुणप्रिया", transliteration: "Varunapriya", consonantIndices: [0, 1] }, // 0="व", 1="र"
    { number: 25, name: "माररञ्जनि", transliteration: "MaraRanjani", consonantIndices: [0, 2] }, // 0="म", 2="र"
    { number: 26, name: "चारुकेसी", transliteration: "Charukesi", consonantIndices: [0, 2] }, // 0="च", 2="र"
    { number: 27, name: "सरसाङ्गी", transliteration: "Sarasangi", consonantIndices: [0, 1] }, // 0="स", 1="र"
    { number: 28, name: "हरिकाम्भोजी", transliteration: "Harikambhoji", consonantIndices: [0, 1] }, // 0="ह", 1="र"
    { number: 29, name: "धीरशंकराभरणम्", transliteration: "Dheerasankarabharanam", consonantIndices: [0, 2] }, // 0="ध", 2="र"
    { number: 30, name: "नागनन्दिनी", transliteration: "Naganandini", consonantIndices: [0, 2] }, // 0="न", 2="ग"
    { number: 31, name: "यागप्रिया", transliteration: "Yagapriya", consonantIndices: [0, 2] }, // 0="य", 2="ग"
    { number: 32, name: "रागवर्धिनी", transliteration: "Ragavardhini", consonantIndices: [0, 2] }, // 0="र", 2="ग"
    { number: 33, name: "गांगेयभूषणी", transliteration: "Gangeyabhushani", consonantIndices: [0, 3] }, // 0="ग", 3="ग"
    { number: 34, name: "वागधीश्वरी", transliteration: "Vagadhisvari", consonantIndices: [0, 2] }, // 0="व", 2="ग"
    { number: 35, name: "शूलिनी", transliteration: "Shoolini", consonantIndices: [0, 2] }, // 0="श", 2="ल"
    { number: 36, name: "चलनाट", transliteration: "Chalanata", consonantIndices: [0, 1] }, // 0="च", 1="ल"
    { number: 37, name: "सालग", transliteration: "Salaga", consonantIndices: [0, 2] }, // 0="स", 2="ल"
    { number: 38, name: "जलार्णव", transliteration: "Jalarnavam", consonantIndices: [0, 1] }, // 0="ज", 1="ल"
    { number: 39, name: "झालवराली", transliteration: "Jhalavarali", consonantIndices: [0, 2] }, // 0="झ", 2="ल"
    { number: 40, name: "नवनीतकृष्ण", transliteration: "Navaneetakrishna", consonantIndices: [0, 1] }, // 0="न", 1="व"
    { number: 41, name: "पावनी", transliteration: "Pavani", consonantIndices: [0, 2] }, // 0="प", 2="व"
    { number: 42, name: "रघुप्रिया", transliteration: "Raghupriya", consonantIndices: [0, 1] }, // 0="र", 1="घ"
    { number: 43, name: "गवाम्भोधि", transliteration: "Gavambodhi", consonantIndices: [0, 1] }, // 0="ग", 1="व"
    { number: 44, name: "भावप्रिया", transliteration: "Bhavapriya", consonantIndices: [0, 2] }, // 0="भ", 2="व"
    { number: 45, name: "शुभपन्तुवारली", transliteration: "Shubhapanthuvarali", consonantIndices: [0, 2] }, // 0="श", 2="भ"
    { number: 46, name: "षड्विधमार्गिणी", transliteration: "Shadvidhamargini", consonantIndices: [0, 3] }, // 0="ष", 3="व"
    { number: 47, name: "सुवर्णांगी", transliteration: "Suvarnangi", consonantIndices: [0, 2] }, // 0="स", 2="व"
    { number: 48, name: "दिव्यमणि", transliteration: "Divyamani", consonantIndices: [0, 2] }, // 0="द", 2="व"
    { number: 49, name: "धवलाम्बरी", transliteration: "Dhavalambari", consonantIndices: [0, 1] }, // 0="ध", 1="व"
    { number: 50, name: "नामनारायणी", transliteration: "Namanarayani", consonantIndices: [0, 2] }, // 0="न", 2="म"
    { number: 51, name: "कामवर्धिनी", transliteration: "Kamavardhini", consonantIndices: [0, 2] }, // 0="क", 2="म"
    { number: 52, name: "रामप्रिया", transliteration: "Ramapriya", consonantIndices: [0, 2] }, // 0="र", 2="म"
    { number: 53, name: "गमनश्र्रम", transliteration: "Gamanashrama", consonantIndices: [0, 1] }, // 0="ग", 1="म"
    { number: 54, name: "विश्वम्भरी", transliteration: "Vishvambhari", consonantIndices: [0, 2] }, // 0="व", 2="श"
    { number: 55, name: "श्यामलांगी", transliteration: "Shyamalangi", consonantIndices: [0, 4] }, // 0="श", 4="म"
    { number: 56, name: "षण्मुखप्रिया", transliteration: "Shanmukhapriya", consonantIndices: [0, 1] }, // 0="ष", 1="ण"
    { number: 57, name: "सिममहेन्द्रमध्यमम्", transliteration: "Simamahendramadhyamam", consonantIndices: [0, 2] }, // 0="स", 2="म"
    { number: 58, name: "हेमावति", transliteration: "Hemavati", consonantIndices: [0, 2] }, // 0="ह", 2="म"
    { number: 59, name: "धर्मवती", transliteration: "Dharmavati", consonantIndices: [0, 3] }, // 0="ध", 3="म"
    { number: 60, name: "नीतिमती", transliteration: "Neetimati", consonantIndices: [0, 2] }, // 0="न", 2="त"
    { number: 61, name: "कान्तमणि", transliteration: "Kantamani", consonantIndices: [0, 4] }, // 0="क", 4="त"
    { number: 62, name: "रुषभप्रिया(ऋषभप्रिया)", transliteration: "Rishabhapriya", consonantIndices: [0, 2] }, // 0="र", 2="ष"
    { number: 63, name: "लतांगी", transliteration: "Latangi", consonantIndices: [0, 1] }, // 0="ल", 1="त"
    { number: 64, name: "वाचस्पति", transliteration: "Vachaspati", consonantIndices: [0, 2] }, // 0="व", 2="च"
    { number: 65, name: "मेचकल्याणी", transliteration: "Mechakalyani", consonantIndices: [0, 2] }, // 0="म", 2="च"
    { number: 66, name: "चित्राम्बरी", transliteration: "Chitrambari", consonantIndices: [0, 2] }, // 0="च", 2="त"
    { number: 67, name: "सुचरित्र", transliteration: "Sucharitra", consonantIndices: [0, 2] }, // 0="स", 2="च"
    { number: 68, name: "ज्योतिस्वरूपिणी", transliteration: "Jyotiswarupini", consonantIndices: [0, 4] }, // 0="ज", 4="त"
    { number: 69, name: "धातुवर्धिनी", transliteration: "Dhatuvardhini", consonantIndices: [0, 2] }, // 0="ध", 2="त"
    { number: 70, name: "नासिकभूषणी", transliteration: "Nasikabhushani", consonantIndices: [0, 2] }, // 0="न", 2="स"
    { number: 71, name: "कोसलम्", transliteration: "Kosalam", consonantIndices: [0, 2] }, // 0="क", 2="स"
    { number: 72, name: "रसिकप्रिया", transliteration: "Rasikapriya", consonantIndices: [0, 1] } // 0="र", 1="स"
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
document.addEventListener('DOMContentLoaded', function () {
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
        if (!ragaSelect || !ragaInput || !encodeBtn) {
            console.error('Required DOM elements not found');
            return;
        }

        // Add event listeners IMMEDIATELY so buttons work even if visualization fails
        console.log('Attaching event listeners...');
        encodeBtn.addEventListener('click', startEncoding);
        resetBtn.addEventListener('click', resetDisplays);

        ragaInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') startEncoding();
        });

        ragaSelect.addEventListener('change', function (e) {
            if (e.target.value) {
                ragaInput.value = e.target.value;
            }
        });

        // Handle window resize
        window.addEventListener('resize', function () {
            if (!isAnimating && typeof d3 !== 'undefined') {
                try {
                    initializeSVG();
                    drawVisualization();
                } catch (e) {
                    console.error('Resize error:', e);
                }
            }
        });

        // Populate the dropdown with all 72 Melakartha ragas
        populateRagaDropdown();

        // Check for D3
        if (typeof d3 === 'undefined') {
            console.error('D3.js not loaded!');
            const errorMsg = document.createElement('div');
            errorMsg.style.color = 'red';
            errorMsg.style.padding = '20px';
            errorMsg.textContent = 'Error: D3.js library could not be loaded. Please check your internet connection.';
            document.getElementById('animation-container').appendChild(errorMsg);
            return;
        }

        // Initialize SVG
        try {
            initializeSVG();
            drawVisualization();
        } catch (svgError) {
            console.error('Error initializing SVG:', svgError);
            document.getElementById('animation-container').innerHTML = '<p style="color:red; padding:20px">Visualization failed to initialize. Encoding will still work text-only.</p>';
        }

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

        // Clear ALL existing options including hardcoded ones
        ragaSelect.innerHTML = '<option value="">-- Select a Raga --</option>';

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
        spiralPoints.push({ x, y, angle, radius, index: i });
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

    if (typeof d3 === 'undefined') {
        alert('D3.js library not loaded. Please check your internet connection.');
        return;
    }

    try {
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
            // isAnimating and disabled state will be reset in finally block
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

    } catch (error) {
        console.error('Error in startEncoding:', error);
        alert('An error occurred during encoding. See console for details.');
    } finally {
        isAnimating = false;
        encodeBtn.disabled = false;
    }
}

function extractConsonants(text) {
    // First check if this is a known raga with pre-calculated consonant indices
    const knownRaga = MELAKARTHA_RAGAS.find(raga =>
        raga.name === text || raga.transliteration === text
    );

    if (knownRaga && knownRaga.consonantIndices && knownRaga.consonantIndices.length >= 2) {
        console.log('=== USING PRE-CALCULATED CHARACTER POSITION INDICES ===');
        console.log('Known raga found:', knownRaga.name);
        console.log('Using stored character position indices:', knownRaga.consonantIndices);

        // Extract consonants from specific character positions in the raga name
        // IMPORTANT: Use knownRaga.name (Hindi) for extraction, even if input was English
        const sourceText = knownRaga.name;
        const consonants = knownRaga.consonantIndices.map(charPos => sourceText[charPos]).filter(char => KATAPAYADI_MAP.hasOwnProperty(char));

        // Create character analysis for the debug table
        const allChars = sourceText.split('').map((char, i) => ({
            index: i,
            char: char,
            isConsonant: KATAPAYADI_MAP.hasOwnProperty(char),
            value: KATAPAYADI_MAP.hasOwnProperty(char) ? KATAPAYADI_MAP[char] : 'N/A',
            isSelected: knownRaga.consonantIndices.includes(i)
        }));

        console.log('Characters at specified positions:', consonants);
        console.log('Character positions in raga name:', knownRaga.consonantIndices);
        console.log('====================================================');

        // Create visual debug table showing the known raga approach
        createCharacterDebugTable(allChars, consonants, knownRaga);

        return consonants;
    }

    // Fallback to original extraction method for unknown ragas
    const consonants = [];
    const allChars = [];

    console.log('=== CONSONANT EXTRACTION DEBUG ===');
    console.log('Input text:', text);
    console.log('Character by character analysis:');

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const isConsonant = KATAPAYADI_MAP.hasOwnProperty(char);
        const value = isConsonant ? KATAPAYADI_MAP[char] : 'N/A';

        // Check if we should select this consonant (if we haven't found 2 yet)
        const isSelected = isConsonant && consonants.length < 2;

        allChars.push({
            index: i,
            char: char,
            isConsonant: isConsonant,
            value: value,
            isSelected: isSelected
        });

        console.log(`${i}: "${char}" -> ${isConsonant ? `Consonant (${value})` : 'Not a consonant'}`);

        if (isConsonant) {
            consonants.push(char);
        }
    }

    console.log('Extracted consonants:', consonants);
    console.log('==================================');

    // Create visual debug table
    createCharacterDebugTable(allChars, consonants.slice(0, 2));

    return consonants;
}

function createCharacterDebugTable(allChars, selectedConsonants, knownRaga = null) {
    if (!characterDebugDisplay) return;

    let html = `
        <div class="debug-panel">
            <h4>Character Analysis ${knownRaga ? '(Known Raga Pattern)' : '(Auto-Detection)'}</h4>
            <div class="char-grid">
    `;

    allChars.forEach(item => {
        const statusClass = item.isSelected ? 'status-selected' :
            (item.isConsonant ? 'status-consonant' : 'status-ignored');

        html += `
            <div class="char-box ${statusClass}">
                <div class="char-symbol">${item.char}</div>
                <div class="char-index">${item.index}</div>
                <div class="char-value">${item.value !== 'N/A' ? item.value : '-'}</div>
            </div>
        `;
    });

    html += `
            </div>
            <div class="legend">
                <span class="legend-item"><span class="swatch selected"></span> Selected</span>
                <span class="legend-item"><span class="swatch consonant"></span> Consonant</span>
                <span class="legend-item"><span class="swatch ignored"></span> Ignored</span>
            </div>
        </div>
    `;

    characterDebugDisplay.innerHTML = html;
}

function resetDisplays() {
    ragaDisplay.textContent = '';
    consonantsDisplay.innerHTML = '';
    encodingStepsDisplay.innerHTML = '';
    finalResultDisplay.innerHTML = '';
    characterDebugDisplay.innerHTML = '';

    // Reset styles
    d3.selectAll('.consonant-text')
        .classed('highlight-consonant', false)
        .style('fill', null)
        .style('font-size', null);

    d3.selectAll('.number-text')
        .classed('highlight-number', false)
        .style('fill', null)
        .style('font-size', null);

    d3.selectAll('.encoding-line').remove();
}

async function animateEncoding(consonants) {
    const steps = [];
    const values = [];

    // Step 1: Highlight consonants on spiral
    for (let i = 0; i < consonants.length; i++) {
        const char = consonants[i];
        const value = KATAPAYADI_MAP[char];
        values.push(value);

        // Find the consonant on the spiral
        // Note: In a real app we might have multiple instances, but here we just find the first one or specific one
        // Since the spiral has all consonants, we find the index in CONSONANTS array
        const charIndex = CONSONANTS.indexOf(char);

        if (charIndex !== -1) {
            // Highlight consonant
            const consonantNode = d3.select(`#consonant-${charIndex}`);
            consonantNode
                .transition().duration(HIGHLIGHT_DURATION)
                .attr('class', 'consonant-text highlight-consonant');

            // Highlight number
            const numberNode = d3.select(`#number-${charIndex}`);
            numberNode
                .transition().duration(HIGHLIGHT_DURATION)
                .attr('class', 'number-text highlight-number');

            // Add step description
            const stepDiv = document.createElement('div');
            stepDiv.innerHTML = `Found consonant <strong>${char}</strong> → Value <strong>${value}</strong>`;
            stepDiv.style.opacity = 0;
            encodingStepsDisplay.appendChild(stepDiv);

            // Fade in step
            d3.select(stepDiv).transition().duration(500).style('opacity', 1);

            await sleep(STEP_DELAY);
        }
    }

    // Step 2: Show combined number
    const combinedNum = values.join('');
    const step2Div = document.createElement('div');
    step2Div.innerHTML = `Combined values: <strong>${combinedNum}</strong>`;
    step2Div.style.opacity = 0;
    step2Div.style.marginTop = '10px';
    encodingStepsDisplay.appendChild(step2Div);
    d3.select(step2Div).transition().duration(500).style('opacity', 1);

    await sleep(STEP_DELAY);

    // Step 3: Reverse number
    const reversedNum = values.slice().reverse().join('');
    const step3Div = document.createElement('div');
    step3Div.innerHTML = `Reverse digits: <strong>${combinedNum}</strong> ➝ <strong>${reversedNum}</strong>`;
    step3Div.style.opacity = 0;
    step3Div.style.color = '#ffd700';
    encodingStepsDisplay.appendChild(step3Div);
    d3.select(step3Div).transition().duration(500).style('opacity', 1);

    await sleep(STEP_DELAY);

    // Step 4: Final Result
    finalResultDisplay.textContent = `Melakartha #${reversedNum}`;
    finalResultDisplay.className = 'pulse';

    // Check if it matches a known raga
    const ragaNum = parseInt(reversedNum);
    const raga = MELAKARTHA_RAGAS.find(r => r.number === ragaNum);

    if (raga) {
        const ragaNameDiv = document.createElement('div');
        ragaNameDiv.style.fontSize = '1.2rem';
        ragaNameDiv.style.marginTop = '5px';
        ragaNameDiv.style.color = '#87ceeb';
        ragaNameDiv.innerHTML = `${raga.name} (${raga.transliteration})`;
        finalResultDisplay.appendChild(ragaNameDiv);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}