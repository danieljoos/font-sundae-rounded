const fs = require('fs');
const puppeteer = require('puppeteer');
const svg2ttf = require('svg2ttf');
const SVGIcons2SVGFontStream = require('svgicons2svgfont');

const fontName = 'sundae-rounded';
const metadata = 'Copyright (c) 2020-2021 - Daniel Joos';
const ttfFileName = 'sundae-rounded.ttf';

async function createSvgFont() {
    const fontStream = new SVGIcons2SVGFontStream({fontName, metadata});

    const buffers = [];
    const pr = new Promise((resolve) => {
        fontStream.on('data', (chunk) => buffers.push(chunk));
        fontStream.on('end', () => {
            const result = Buffer.concat(buffers).toString();
            resolve(result);
        });
    });

    const files = await fs.promises.readdir('glyphs');
    for (const file of files) {
        const glyph = fs.createReadStream(`glyphs/${file}`);
        glyph.metadata = {
            unicode: [file.charAt(0)],
            name: file.charAt(0),
        };
        fontStream.write(glyph);
    }
    fontStream.end();

    return pr;
}

async function preview() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`file:///${__dirname}/preview.html`);
    const previewArea = await page.$('#preview');
    await previewArea.screenshot({ path: 'preview.png', omitBackground: true });
    await browser.close();
}

(async () => {
    // Create TTF font
    const svgFont = await createSvgFont();
    var ttf = svg2ttf(svgFont, {});
    await fs.promises.writeFile(ttfFileName, new Buffer(ttf.buffer));

    // Render Preview
    await preview();
})();
