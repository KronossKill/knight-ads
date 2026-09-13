import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function processLogo() {
  const zai = await ZAI.create();
  const imageBuffer = fs.readFileSync('/home/z/my-project/upload/Copilot_20260911_102427.png');
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64Image}`;

  console.log('Calling image edit API...');
  const response = await zai.images.generations.edit({
    prompt: "Keep ONLY the central heraldic shield emblem with the Spartan warrior helmet and megaphone exactly as it is, including its blue, silver and cyan colors, the cosmic starfield interior, and the metallic shield border. Completely remove everything outside the shield (the exterior background) and make it pure transparent. Also completely remove the 'Made with AI' text watermark in the upper right corner. Output a clean shield-shaped emblem logo on a fully transparent background, centered, professional, with NO text anywhere on the image. Preserve the helmet, megaphone, blue light rays, and shield border perfectly.",
    images: [{ url: dataUrl }],
    size: '1024x1024',
  });

  const imageBase64 = response.data[0].base64;
  const outBuffer = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync('/home/z/my-project/public/knight-logo.png', outBuffer);
  console.log(`✓ Logo saved to /home/z/my-project/public/knight-logo.png (${outBuffer.length} bytes)`);
}

processLogo().catch((e) => { console.error(e); process.exit(1); });
