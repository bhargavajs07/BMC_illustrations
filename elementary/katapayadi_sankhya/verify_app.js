const { chromium } = require('playwright');

(async () => {
    console.log('Starting verification...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    try {
        // 1. Navigate to the page
        console.log('Navigating to page...');
        await page.goto('http://localhost:8080/katapayadi_sankhya.html');

        // 2. Check title
        const title = await page.title();
        console.log(`Page title: ${title} `);

        // 3. Test Ratnangi (Direct Input)
        console.log('Testing Ratnangi (Direct Input)...');

        // Bypassing dropdown to isolate encoding logic
        await page.fill('#raga-input', 'रत्नांगि');

        const inputValue = await page.$eval('#raga-input', el => el.value);
        console.log(`Input field value: "${inputValue}"`);

        await page.click('#encode-btn');

        // Wait for result
        console.log('Waiting for animation...');
        await page.waitForTimeout(6000); // Wait for animation

        const result = await page.textContent('#final-result');
        console.log(`Final Result: ${result} `);

        if (result.includes('02') || result.includes('2')) {
            console.log('SUCCESS: Ratnangi encoded correctly to 02');
        } else {
            console.error('FAILURE: Ratnangi did not encode to 02');
            process.exit(1);
        }

        // 4. Test Custom Input
        console.log('Testing Custom Input (Kanakangi)...');
        await page.click('#reset-btn');
        await page.fill('#raga-input', 'कनकांगि');
        await page.click('#encode-btn');

        await page.waitForTimeout(10000);

        const result2 = await page.textContent('#final-result');
        console.log(`Final Result 2: ${result2} `);

        if (result2.includes('01') || result2.includes('1')) {
            console.log('SUCCESS: Kanakangi encoded correctly to 01');
        } else {
            console.error('FAILURE: Kanakangi did not encode to 01');
            process.exit(1);
        }

    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
