// Define the alphabet (A-Z)
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Animation timing variables (in milliseconds)
const ANIMATION_DURATION = 800;
const HIGHLIGHT_DURATION = 300;
const LETTER_HIGHLIGHT_WAIT = 500;
const CLEANUP_DURATION = 300;
const FINAL_DISPLAY_DURATION = 1000;

// Set up the dimensions and variables for the circles
let width, height, outerRadius, innerRadius, center;
let svg, outerCircle, innerCircle, outerLetters, innerLetters;
let encodeBtn, resetBtn, wordInput, offsetInput;
let encodingWordDisplay, encodedResultDisplay, finalResultDisplay;
let isAnimating = false;

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements
    encodeBtn = document.getElementById('encode-btn');
    resetBtn = document.getElementById('reset-btn');
    wordInput = document.getElementById('word-input');
    offsetInput = document.getElementById('offset-input');
    encodingWordDisplay = document.getElementById('encoding-word');
    encodedResultDisplay = document.getElementById('encoded-result');
    finalResultDisplay = document.getElementById('final-result');

    // Set up the SVG container
    initializeSVG();
    
    // Create initial visualization
    drawVisualization(parseInt(offsetInput.value));

    // Add event listeners
    encodeBtn.addEventListener('click', startEncoding);
    resetBtn.addEventListener('click', resetAnimation);
    
    // Also trigger animation on Enter key in input fields
    wordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') startEncoding();
    });
    
    offsetInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') startEncoding();
    });
    
    // Automatically adjust for window resize
    window.addEventListener('resize', function() {
        // Only redraw if not currently animating
        if (!isAnimating) {
            initializeSVG();
            drawVisualization(parseInt(offsetInput.value));
        }
    });
});

function initializeSVG() {
    // Clear previous SVG if it exists
    d3.select('#animation-container svg').remove();
    
    // Get container dimensions
    const container = document.getElementById('animation-container');
    width = container.clientWidth;
    height = container.clientHeight;
    
    // Calculate circle dimensions based on container size
    outerRadius = Math.min(width, height) * 0.4;
    innerRadius = outerRadius * 0.65;
    center = { x: width / 2, y: height / 2 };
    
    // Create SVG element
    svg = d3.select('#animation-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
}

function drawVisualization(offset) {
    // Clear previous elements
    svg.selectAll('*').remove();
    
    // Draw radial lines
    drawRadialLines();
    
    // Draw circles
    drawCircles();
    
    // Place letters on circles
    placeLettersOnCircles(offset);
}

function drawRadialLines() {
    // Create radial lines from center to outer circle
    for (let i = 0; i < ALPHABET.length; i++) {
        const angle = 2 * Math.PI * i / ALPHABET.length;
        const x = center.x + outerRadius * Math.cos(angle);
        const y = center.y + outerRadius * Math.sin(angle);
        
        svg.append('line')
            .attr('class', 'radial-line')
            .attr('x1', center.x)
            .attr('y1', center.y)
            .attr('x2', x)
            .attr('y2', y);
    }
}

function drawCircles() {
    // Draw outer circle
    outerCircle = svg.append('circle')
        .attr('class', 'outer-circle')
        .attr('cx', center.x)
        .attr('cy', center.y)
        .attr('r', outerRadius)
        .attr('opacity', 0)
        .transition()
        .duration(ANIMATION_DURATION)
        .attr('opacity', 1);
    
    // Draw inner circle
    innerCircle = svg.append('circle')
        .attr('class', 'inner-circle')
        .attr('cx', center.x)
        .attr('cy', center.y)
        .attr('r', innerRadius)
        .attr('opacity', 0)
        .transition()
        .delay(ANIMATION_DURATION / 2)
        .duration(ANIMATION_DURATION)
        .attr('opacity', 1);
}

function placeLettersOnCircles(offset) {
    // Place letters on outer circle (real alphabet)
    outerLetters = svg.append('g').attr('class', 'outer-letters');
    
    for (let i = 0; i < ALPHABET.length; i++) {
        const angle = 2 * Math.PI * i / ALPHABET.length;
        const x = center.x + outerRadius * Math.cos(angle);
        const y = center.y + outerRadius * Math.sin(angle);
        
        outerLetters.append('text')
            .attr('class', 'letter-real')
            .attr('data-letter', ALPHABET[i])
            .attr('data-index', i)
            .attr('x', x)
            .attr('y', y)
            .text(ALPHABET[i])
            .attr('opacity', 0)
            .transition()
            .delay(ANIMATION_DURATION / 2)
            .duration(ANIMATION_DURATION)
            .attr('opacity', 1);
    }
    
    // Place letters on inner circle (coded alphabet)
    innerLetters = svg.append('g').attr('class', 'inner-letters');
    
    for (let i = 0; i < ALPHABET.length; i++) {
        const angle = 2 * Math.PI * i / ALPHABET.length;
        const x = center.x + innerRadius * Math.cos(angle);
        const y = center.y + innerRadius * Math.sin(angle);
        
        const codedLetter = getCodedLetter(ALPHABET[i], offset);
        
        innerLetters.append('text')
            .attr('class', 'letter-coded')
            .attr('data-letter', codedLetter)
            .attr('data-index', i)
            .attr('x', x)
            .attr('y', y)
            .text(codedLetter)
            .attr('opacity', 0)
            .transition()
            .delay(ANIMATION_DURATION)
            .duration(ANIMATION_DURATION)
            .attr('opacity', 1);
    }
}

function getCodedLetter(letter, offset) {
    if (!letter.match(/[A-Z]/)) return letter;
    
    const index = ALPHABET.indexOf(letter);
    const newIndex = (index + offset) % ALPHABET.length;
    return ALPHABET[newIndex];
}

function encodeText(text, offset) {
    return text.toUpperCase().split('').map(char => {
        if (char.match(/[A-Z]/)) {
            return getCodedLetter(char, offset);
        }
        return char;
    }).join('');
}

function startEncoding() {
    if (isAnimating) return;
    
    // Get user input
    const word = wordInput.value.toUpperCase();
    const offset = parseInt(offsetInput.value) || 1;
    
    // Validate input
    if (!word) {
        alert('Please enter a word to encode');
        return;
    }
    
    if (offset < 1 || offset > 25) {
        alert('Offset must be between 1 and 25');
        return;
    }
    
    isAnimating = true;
    
    // Clear previous results
    encodingWordDisplay.textContent = '';
    encodedResultDisplay.textContent = '';
    finalResultDisplay.textContent = '';
    
    // Display word being encoded
    encodingWordDisplay.textContent = `Encoding '${word}':`;
    
    // Reset and redraw the visualization with the new offset
    drawVisualization(offset);
    
    // Start the letter-by-letter encoding animation
    let encodedWord = '';
    
    // Create a function to animate each letter sequentially
    function animateLetter(index) {
        if (index >= word.length) {
            // All letters processed, show final result
            setTimeout(() => {
                const finalEncodedWord = encodeText(word, offset);
                finalResultDisplay.textContent = `Encoded: ${finalEncodedWord}`;
                
                // Add the pulsing effect
                const finalElement = document.getElementById('final-result');
                finalElement.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    finalElement.style.transform = 'scale(1)';
                    finalElement.style.transition = 'transform 0.5s';
                    isAnimating = false;
                }, 500);
            }, FINAL_DISPLAY_DURATION);
            return;
        }
        
        const char = word[index];
        
        if (char.match(/[A-Z]/)) {
            // Find the letter in the outer circle
            const realLetterElement = svg.select(`.letter-real[data-letter="${char}"]`);
            const realLetterIndex = parseInt(realLetterElement.attr('data-index'));
            
            // Find the corresponding coded letter element
            const codedLetterElement = svg.select(`.inner-letters text[data-index="${realLetterIndex}"]`);
            const codedLetter = codedLetterElement.attr('data-letter');
            
            // Get positions for highlights and connection
            const realX = parseFloat(realLetterElement.attr('x'));
            const realY = parseFloat(realLetterElement.attr('y'));
            const codedX = parseFloat(codedLetterElement.attr('x'));
            const codedY = parseFloat(codedLetterElement.attr('y'));
            
            // Create highlight for real letter
            const realHighlight = svg.append('circle')
                .attr('class', 'highlight-real')
                .attr('cx', realX)
                .attr('cy', realY)
                .attr('r', 0)
                .attr('opacity', 0)
                .transition()
                .duration(HIGHLIGHT_DURATION)
                .attr('r', 15)
                .attr('opacity', 1);
            
            // After a short pause, draw the connection line
            setTimeout(() => {
                const connectionLine = svg.append('line')
                    .attr('class', 'connect-line')
                    .attr('x1', realX)
                    .attr('y1', realY)
                    .attr('x2', realX)
                    .attr('y2', realY)
                    .attr('opacity', 0)
                    .transition()
                    .duration(HIGHLIGHT_DURATION)
                    .attr('x2', codedX)
                    .attr('y2', codedY)
                    .attr('opacity', 1);
                
                // After connection, highlight coded letter
                setTimeout(() => {
                    const codedHighlight = svg.append('circle')
                        .attr('class', 'highlight-coded')
                        .attr('cx', codedX)
                        .attr('cy', codedY)
                        .attr('r', 0)
                        .attr('opacity', 0)
                        .transition()
                        .duration(HIGHLIGHT_DURATION)
                        .attr('r', 15)
                        .attr('opacity', 1);
                    
                    // Update the encoded text display
                    encodedWord += codedLetter;
                    encodedResultDisplay.textContent = encodedWord;
                    
                    // After showing the letter, clean up and move to next
                    setTimeout(() => {
                        // Fade out highlights and connection
                        svg.selectAll('.highlight-real, .highlight-coded, .connect-line')
                            .transition()
                            .duration(CLEANUP_DURATION)
                            .attr('opacity', 0)
                            .remove();
                        
                        // Move to next letter
                        animateLetter(index + 1);
                    }, LETTER_HIGHLIGHT_WAIT);
                }, HIGHLIGHT_DURATION);
            }, HIGHLIGHT_DURATION);
        } else {
            // For non-alphabet characters, just add them directly
            encodedWord += char;
            encodedResultDisplay.textContent = encodedWord;
            
            // Move to next letter
            setTimeout(() => animateLetter(index + 1), HIGHLIGHT_DURATION);
        }
    }
    
    // Start the animation with the first letter after initial setup
    setTimeout(() => animateLetter(0), ANIMATION_DURATION * 2);
}

function resetAnimation() {
    // Stop any ongoing animation
    isAnimating = false;
    
    // Clear displays
    encodingWordDisplay.textContent = '';
    encodedResultDisplay.textContent = '';
    finalResultDisplay.textContent = '';
    
    // Reset to initial state
    drawVisualization(parseInt(offsetInput.value) || 1);
} 