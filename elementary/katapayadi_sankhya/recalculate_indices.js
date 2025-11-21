const KATAPAYADI_MAP = {
    'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5,
    'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0,
    'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5,
    'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0,
    'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5,
    'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8
};

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

function calculateConsonantIndices(ragaName) {
    const consonants = [];
    const charPositions = [];

    for (let i = 0; i < ragaName.length; i++) {
        const char = ragaName[i];
        if (KATAPAYADI_MAP.hasOwnProperty(char)) {
            consonants.push(char);
            charPositions.push(i);
            if (consonants.length >= 2) break;
        }
    }

    return {
        consonants: consonants,
        indices: charPositions
    };
}

console.log('const MELAKARTHA_RAGAS = [');
MELAKARTHA_RAGAS.forEach(raga => {
    const result = calculateConsonantIndices(raga.name);
    const ragaChars = raga.name.split('');
    const positionInfo = result.indices.map(pos => `${pos}="${ragaChars[pos]}"`).join(', ');
    console.log(`    { number: ${raga.number}, name: "${raga.name}", transliteration: "${raga.transliteration}", consonantIndices: [${result.indices.join(', ')}] }, // ${positionInfo}`);
});
console.log('];');
