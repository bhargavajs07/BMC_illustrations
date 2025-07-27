// Katapayadi Sankhya mapping - consonants to numbers
const KATAPAYADI_MAP = {
    // Ka group - 1
    'क': 1, 'ख': 1, 'ग': 1, 'घ': 1, 'ङ': 1,
    // Cha group - 2  
    'च': 2, 'छ': 2, 'ज': 2, 'झ': 2, 'ञ': 2,
    // Ta group - 3
    'ट': 3, 'ठ': 3, 'ड': 3, 'ढ': 3, 'ण': 3,
    // Ta group - 4
    'त': 4, 'थ': 4, 'द': 4, 'ध': 4, 'न': 4,
    // Pa group - 5
    'प': 5, 'फ': 5, 'ब': 5, 'भ': 5, 'म': 5,
    // Ya group - 6,7,8,9,1,2,3,0
    'य': 6, 'र': 7, 'ल': 8, 'व': 9, 'श': 1, 'ष': 2, 'स': 3, 'ह': 0
};

// Create an array of all consonants for the spiral
const CONSONANTS = Object.keys(KATAPAYADI_MAP);

// Animation timing variables
const ANIMATION_DURATION = 1000;
const HIGHLIGHT_DURATION = 500;
const STEP_DELAY = 1500;

// SVG dimensions and variables
let width, height, centerX, centerY, maxRadius;
let svg, spiralGroup, spokesGroup;
let encodeBtn, resetBtn, ragaInput;
let ragaDisplay, consonantsDisplay, encodingStepsDisplay, finalResultDisplay;
let isAnimating = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    encodeBtn = document.getElementById('encode-btn');
    resetBtn = document.getElementById('reset-btn');
    ragaInput = document.getElementById('raga-input');
    ragaDisplay = document.getElementById('raga-display');
    consonantsDisplay = document.getElementById('consonants-display');
    encodingStepsDisplay = document.getElementById('encoding-steps');
    finalResultDisplay = document.getElementById('final-result');

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
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (!isAnimating) {
            initializeSVG();
            drawVisualization();
        }
    });
});

function initializeSVG() {
    // Remove existing SVG
    d3.select('#animation-container svg').remove();
    
    // Get container dimensions
    const container = document.getElementById('animation-container');
    width = container.clientWidth;
    height = container.clientHeight;
    centerX = width / 2;
    centerY = height / 2;
    maxRadius = Math.min(width, height) * 0.4;
    
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
    
    // Generate spiral points
    const spiralPoints = [];
    for (let i = 0; i < numSpokes; i++) {
        const t = i / (numSpokes - 1);
        const angle = t * turns * 2 * Math.PI;
        const radius = t * maxRadius;
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
    // Draw center circle
    svg.append('circle')
        .attr('class', 'center-circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', 30);
    
    // Add center text
    svg.append('text')
        .attr('class', 'center-text')
        .attr('x', centerX)
        .attr('y', centerY - 5)
        .text('कतपयादि');
        
    svg.append('text')
        .attr('class', 'center-text')
        .attr('x', centerX)
        .attr('y', centerY + 10)
        .text('संख्या');
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
    
    // Show extracted consonants
    consonantsDisplay.textContent = `First two consonants: ${consonants[0]}, ${consonants[1]}`;
    
    // Animate encoding process
    await animateEncoding(consonants.slice(0, 2));
    
    isAnimating = false;
    encodeBtn.disabled = false;
}

function extractConsonants(text) {
    const consonants = [];
    for (let char of text) {
        if (KATAPAYADI_MAP.hasOwnProperty(char)) {
            consonants.push(char);
        }
    }
    return consonants;
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
        
        // Draw encoding line from center to consonant
        const consonantPos = getConsonantPosition(consonantIndex);
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
    const t = index / (numSpokes - 1);
    const angle = t * turns * 2 * Math.PI;
    const radius = t * maxRadius;
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
    encodingStepsDisplay.textContent = '';
    finalResultDisplay.textContent = '';
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}