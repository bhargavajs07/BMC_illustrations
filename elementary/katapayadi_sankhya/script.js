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
const MELAKARTHA_RAGAS = [
    { number: 1, name: "कनकांगि", transliteration: "Kanakangi", consonantIndices: [0, 1] }, // 0="क", 1="न"
    { number: 2, name: "रत्नांगि", transliteration: "Ratnangi", consonantIndices: [0, 2] }, // 0="र", 1="त"
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
    { number: 17, name: "सूर्यकान्त", transliteration: "Suryakanta", consonantIndices: [0, 2] }, // 0="स", 2="र"
    { number: 18, name: "हाटकाम्बरी", transliteration: "Hatakambari", consonantIndices: [0, 2] }, // 0="ह", 2="ट"
    { number: 19, name: "झंकारध्वनि", transliteration: "Jhankaradhvani", consonantIndices: [0, 2] }, // 0="झ", 2="क"
    { number: 20, name: "नटभैरवी", transliteration: "Natabhairavi", consonantIndices: [0, 1] }, // 0="न", 1="ट"
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
    { number: 46, name: "षड्विधमार्गिणी", transliteration: "Shadvidhamargini", consonantIndices: [0, 1] }, // 0="ष", 1="ड"
    { number: 47, name: "सुवर्णांगी", transliteration: "Suvarnangi", consonantIndices: [0, 2] }, // 0="स", 2="व"
    { number: 48, name: "दिव्यमणि", transliteration: "Divyamani", consonantIndices: [0, 2] }, // 0="द", 2="व"
    { number: 49, name: "धवलाम्बरी", transliteration: "Dhavalambari", consonantIndices: [0, 1] }, // 0="ध", 1="व"
    { number: 50, name: "नामनारायणी", transliteration: "Namanarayani", consonantIndices: [0, 2] }, // 0="न", 2="म"
    { number: 51, name: "कामवर्धिनी", transliteration: "Kamavardhini", consonantIndices: [0, 2] }, // 0="क", 2="म"
    { number: 52, name: "रामप्रिया", transliteration: "Ramapriya", consonantIndices: [0, 2] }, // 0="र", 2="म"
    { number: 53, name: "गमनश्र्रम", transliteration: "Gamanashrama", consonantIndices: [0, 1] }, // 0="ग", 1="म"
    { number: 54, name: "विश्वम्भरी", transliteration: "Vishvambhari", consonantIndices: [0, 2] }, // 0="व", 2="श"
    { number: 55, name: "श्यामलांगी", transliteration: "Shyamalangi", consonantIndices: [0, 2] }, // 0="श", 2="य"
    { number: 56, name: "षण्मुखप्रिया", transliteration: "Shanmukhapriya", consonantIndices: [0, 1] }, // 0="ष", 1="ण"
    { number: 57, name: "सिममहेन्द्रमध्यमम्", transliteration: "Simamahendramadhyamam", consonantIndices: [0, 2] }, // 0="स", 2="म"
    { number: 58, name: "हेमावति", transliteration: "Hemavati", consonantIndices: [0, 2] }, // 0="ह", 2="म"
    { number: 59, name: "धर्मवती", transliteration: "Dharmavati", consonantIndices: [0, 1] }, // 0="ध", 1="र"
    { number: 60, name: "नीतिमती", transliteration: "Neetimati", consonantIndices: [0, 2] }, // 0="न", 2="त"
    { number: 61, name: "कान्तमणि", transliteration: "Kantamani", consonantIndices: [0, 2] }, // 0="क", 2="न"
    { number: 62, name: "रुषभप्रिया(ऋषभप्रिया)", transliteration: "Rishabhapriya", consonantIndices: [0, 2] }, // 0="र", 2="ष"
    { number: 63, name: "लतांगी", transliteration: "Latangi", consonantIndices: [0, 1] }, // 0="ल", 1="त"
    { number: 64, name: "वाचस्पति", transliteration: "Vachaspati", consonantIndices: [0, 2] }, // 0="व", 2="च"
    { number: 65, name: "मेचकल्याणी", transliteration: "Mechakalyani", consonantIndices: [0, 2] }, // 0="म", 2="च"
    { number: 66, name: "चित्राम्बरी", transliteration: "Chitrambari", consonantIndices: [0, 2] }, // 0="च", 2="त"
    { number: 67, name: "सुचरित्र", transliteration: "Sucharitra", consonantIndices: [0, 2] }, // 0="स", 2="च"
    { number: 68, name: "ज्योतिस्वरूपिणी", transliteration: "Jyotiswarupini", consonantIndices: [0, 2] }, // 0="ज", 2="य"
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
    // First check if this is a known raga with pre-calculated consonant indices
    const knownRaga = MELAKARTHA_RAGAS.find(raga => 
        raga.name === text || raga.transliteration === text
    );
    
    if (knownRaga && knownRaga.consonantIndices && knownRaga.consonantIndices.length >= 2) {
        console.log('=== USING PRE-CALCULATED CHARACTER POSITION INDICES ===');
        console.log('Known raga found:', knownRaga.name);
        console.log('Using stored character position indices:', knownRaga.consonantIndices);
        
        // Extract consonants from specific character positions in the raga name
        const consonants = knownRaga.consonantIndices.map(charPos => text[charPos]).filter(char => KATAPAYADI_MAP.hasOwnProperty(char));
        
        // Create character analysis for the debug table
        const allChars = text.split('').map((char, i) => ({
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
        
        allChars.push({
            index: i,
            char: char,
            isConsonant: isConsonant,
            value: value,
            isSelected: false
        });
        
        console.log(`${i}: "${char}" -> ${isConsonant ? `Consonant (${value})`