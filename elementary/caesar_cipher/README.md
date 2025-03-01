# Coded Alphabet Animation

This web application recreates a cipher visualization that demonstrates encoding with a substitution cipher (also known as a Caesar cipher). The application was built using D3.js to match the functionality of an original Python Manim animation.

## Features

- Interactive visualization of a substitution cipher with two concentric circles representing the real and coded alphabets
- Ability to set a custom offset (shift value) for the cipher
- Animation showing the encoding process letter by letter with visual connections
- Responsive design that works on different screen sizes
- Neon-styled final result display

## How to Use

1. Open `caesar_cipher.html` in your web browser
2. Enter a word to encode in the "Word to Encode" input field
3. Set an offset value (1-25) in the "Offset" input field
   - The offset determines how many positions each letter is shifted
   - For example, with offset 1: A→B, B→C, ..., Z→A
4. Click "Encode" to start the animation
5. Watch as each letter is highlighted and mapped to its encoded counterpart
6. The final encoded word will be displayed with a neon effect at the bottom
7. Click "Reset" to clear the animation and start over

## Technical Details

The application uses:
- D3.js for SVG-based animations and visualizations
- Pure JavaScript for the application logic
- HTML5 and CSS3 for the user interface

## How It Works

1. Two concentric circles are drawn, with the outer circle containing the standard alphabet (A-Z)
2. The inner circle contains the shifted alphabet based on the offset
3. When encoding a word, each letter in the outer circle is highlighted
4. A line connects the real letter to its encoded counterpart on the inner circle
5. The encoded letter is highlighted and added to the result
6. Non-alphabetic characters are passed through without encoding
7. The final encoded word is displayed with a neon effect

## Example

With an offset of 3:
- 'A' becomes 'D'
- 'B' becomes 'E'
- ...
- 'Z' becomes 'C'

So "HELLO" would be encoded as "KHOOR".

## Credit

This application was developed as a web-based recreation of a Python Manim animation demonstrating substitution ciphers for educational purposes. 
