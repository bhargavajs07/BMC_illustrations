const raga = "रत्नांगि";
console.log(`Length: ${raga.length}`);
for (let i = 0; i < raga.length; i++) {
    console.log(`${i}: ${raga[i]} (Code: ${raga.charCodeAt(i)})`);
}

const map = {
    'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5,
    'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0,
    'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5,
    'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0,
    'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5,
    'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8
};

const indices = [0, 2];
const chars = indices.map(i => raga[i]);
console.log('Chars at 0, 2:', chars);
console.log('In map?', chars.map(c => map.hasOwnProperty(c)));
