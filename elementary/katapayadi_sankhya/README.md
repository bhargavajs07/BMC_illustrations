# Katapayadi Sankhya Encoding for Melakartha Ragas

This interactive D3.js visualization demonstrates the ancient Indian **Katapayadi Sankhya** encoding system as applied to the ordering of the 72 Melakartha ragas in Carnatic music.

## What is Katapayadi Sankhya?

Katapayadi Sankhya is an ancient Indian system for encoding numbers using consonants in Sanskrit/Hindi. Each consonant group represents a specific digit:

- **Ka-group** (क, ख, ग, घ, ङ) → **1**
- **Cha-group** (च, छ, ज, झ, ञ) → **2** 
- **Ta-group** (ट, ठ, ड, ढ, ण) → **3**
- **Ta-group** (त, थ, द, ध, न) → **4**
- **Pa-group** (प, फ, ब, भ, म) → **5**
- **Ya-group** (य, र, ल, व, श, ष, स, ह) → **6, 7, 8, 9, 1, 2, 3, 0**

## How it Works for Melakartha Ragas

1. Take the **first two consonants** from a raga name
2. **Encode** each consonant to its corresponding digit using the Katapayadi system
3. **Reverse** the order of the digits
4. The resulting number gives the **Melakartha raga number** (1-72)

## Visualization Features

### Spiral Layout
- **Central hub** displaying "कतपयादि संख्या" (Katapayadi Sankhya)
- **Spiral pattern** with Hindi consonants positioned along radial spokes
- **Numerical values** (1,2,3,4,5,6,7,8,9,0,1,2,3...) shown below each consonant
- **Interactive highlighting** during the encoding process

### Animation Process
1. **Input** a raga name in Sanskrit/Hindi
2. **Extraction** of the first two consonants
3. **Step-by-step encoding** with visual highlighting
4. **Reversal demonstration** showing the final Melakartha number
5. **Pulsing result** with glowing effects

## Example Usage

Try these raga names:
- **कनकांगि** (Kanakangi) → क=1, न=4 → 14 → **41** (Melakartha #41)
- **रत्नांगि** (Ratnangi) → र=7, त=4 → 74 → **47** (Invalid, but demonstrates the process)
- **गणमूर्ति** (Ganamurti) → ग=1, न=4 → 14 → **41** (Alternative name)

## Technical Implementation

- **D3.js v7** for interactive SVG visualization
- **Spiral geometry** calculations for consonant positioning
- **CSS animations** for highlighting and pulsing effects
- **Responsive design** adapting to different screen sizes
- **Unicode support** for Devanagari script rendering

## Educational Value

This visualization helps understand:
- Ancient Indian mathematical encoding systems
- The systematic organization of Carnatic music theory
- The connection between linguistics and music
- Interactive learning through visual demonstration

## Files Structure

- `katapayadi_sankhya.html` - Main HTML page
- `styles.css` - Visual styling and animations  
- `script.js` - D3.js visualization logic and encoding algorithms
- `README.md` - This documentation

## Usage

Open `katapayadi_sankhya.html` in a modern web browser that supports:
- D3.js v7
- CSS3 animations
- Unicode/Devanagari fonts
- SVG rendering

The visualization is fully self-contained and requires no additional setup.