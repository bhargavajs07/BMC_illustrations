const SWARA_MAP = {
    RG: {
        1: { R: "R1", G: "G1", name: "Indu" },
        2: { R: "R1", G: "G2", name: "Netra" },
        3: { R: "R1", G: "G3", name: "Agni" },
        4: { R: "R2", G: "G2", name: "Veda" },
        5: { R: "R2", G: "G3", name: "Bana" },
        6: { R: "R3", G: "G3", name: "Ritu" },
        7: { R: "R1", G: "G1", name: "Rishi" },
        8: { R: "R1", G: "G2", name: "Vasu" },
        9: { R: "R1", G: "G3", name: "Brahma" },
        10: { R: "R2", G: "G2", name: "Disi" },
        11: { R: "R2", G: "G3", name: "Rudra" },
        12: { R: "R3", G: "G3", name: "Aditya" }
    },
    DN: {
        1: { D: "D1", N: "N1", name: "Pa" },
        2: { D: "D1", N: "N2", name: "Sri" },
        3: { D: "D1", N: "N3", name: "Go" },
        4: { D: "D2", N: "N2", name: "Bhu" },
        5: { D: "D2", N: "N3", name: "Ma" },
        6: { D: "D3", N: "N3", name: "Sha" }
    }
};

function calculateSwaras(ragaNumber) {
    if (!ragaNumber || ragaNumber < 1 || ragaNumber > 72) return null;
    const mValue = ragaNumber <= 36 ? "M1" : "M2";
    const normalizedNum = ragaNumber <= 36 ? ragaNumber : ragaNumber - 36;
    const chakraIndex = Math.ceil(normalizedNum / 6);
    const rgValues = SWARA_MAP.RG[chakraIndex];
    const dnIndex = (normalizedNum - 1) % 6 + 1;
    const dnValues = SWARA_MAP.DN[dnIndex];

    return {
        S: "S",
        R: rgValues.R,
        G: rgValues.G,
        M: mValue,
        P: "P",
        D: dnValues.D,
        N: dnValues.N,
        chakra: chakraIndex,
        chakraName: rgValues.name,
        dnIndex: dnIndex
    };
}

// Ground Truth Logic (Independent implementation)
const getExpectedSwaras = (num) => {
    const m = num <= 36 ? "M1" : "M2";
    const n = num <= 36 ? num : num - 36;
    const chakra = Math.ceil(n / 6);
    const pos = (n - 1) % 6 + 1;
    // Correct mapping: 5th chakra is R2, G3
    const rgMap = { 1: ["R1", "G1"], 2: ["R1", "G2"], 3: ["R1", "G3"], 4: ["R2", "G2"], 5: ["R2", "G3"], 6: ["R3", "G3"] };
    const dnMap = { 1: ["D1", "N1"], 2: ["D1", "N2"], 3: ["D1", "N3"], 4: ["D2", "N2"], 5: ["D2", "N3"], 6: ["D3", "N3"] };

    // Handle 7-12 by mapping back to 1-6
    const chakraBase = chakra > 6 ? chakra - 6 : chakra;
    const [r, g] = rgMap[chakraBase];
    const [d, n_swara] = dnMap[pos];
    return { R: r, G: g, M: m, D: d, N: n_swara };
};

console.log("Running Exhaustive Swara Verification for 72 Ragas...");
let passed = 0;
let failed = 0;

for (let i = 1; i <= 72; i++) {
    const calculated = calculateSwaras(i);
    const expected = getExpectedSwaras(i);

    const matches = calculated.R === expected.R &&
        calculated.G === expected.G &&
        calculated.M === expected.M &&
        calculated.D === expected.D &&
        calculated.N === expected.N;

    if (matches) {
        passed++;
    } else {
        failed++;
        console.error(`FAIL: Raga ${i}`);
        console.error(`  Expected: ${JSON.stringify(expected)}`);
        console.error(`  Got:      ${JSON.stringify(calculated)}`);
    }
}

console.log(`\nVerification Complete.`);
console.log(`Passed: ${passed}/72`);
console.log(`Failed: ${failed}/72`);

if (failed === 0) {
    console.log("SUCCESS: All 72 Ragas verified correctly.");
} else {
    console.log("FAILURE: Some Ragas failed verification.");
    process.exit(1);
}
