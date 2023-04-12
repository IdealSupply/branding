
// import fs from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import svg2img, { svg2imgOptions } from 'svg2img';
import yaml from 'yaml';


interface SourceImage {
    path: string;
    variations: ImageConversionData[];
}

interface ImageConversionData {
    format: string;
    name: string;
    source: string;
    size?: {
        mode: 'original' | 'width' | 'height' | 'scale';
        value?: number;
    };

    background?: string;
    color?: string;
    quality?: number;
}

async function convertImages() {
    await rm('./tmp', { recursive: true, force: true });
    await rm('./dist', { recursive: true, force: true });

    const imageData = await loadImagesDataYaml();
    const images = imageData.images as SourceImage[];

    for (var sourceImage of images) {
        for (const variation of sourceImage.variations) {
            let source = sourceImage.path;
            if (variation.color) {
                source = await loadSvgAndSetColor(sourceImage.path, variation.color);
            } else {
                source = await readSvg(sourceImage.path);
            }
            if (variation.format === 'svg') {
                scaleSvg(source, variation);
            } else {
                await rasterizeSvg(source, variation);
            }
        }
    }
    const files = await imagemin(['./tmp/images/*.*'], {
        destination: './dist/images',
        plugins: [
            imageminPngquant(),
            imageminJpegtran(),
            imageminGifsicle(),
            imageminSvgo(
                {
                    multipass: true
                }
            )
        ]
    });
}
//apt-get install libpng-dev -y --no-install-recommends
async function scaleSvg(source: string, data: ImageConversionData) {
    if (data.size) {
        const size = readSvgSize(source);
        switch (data.size.mode) {
            case 'width':
                const widthFactor = data.size.value! / size!.width;
                source = setSvgSize(source, data.size.value!, size!.height * widthFactor);
                break;
            case 'height':
                const heightFactor = data.size.value! / size!.height;
                source = setSvgSize(source, size!.width * heightFactor, data.size.value!);
                break;
            case 'scale':
                source = setSvgSize(source, size!.width * data.size.value!, size!.height * data.size.value!);
            default:
                throw new Error(`Unsupported size mode: ${data.size.mode}`);
        }
    }
    await writeImageBufferToFile(Buffer.from(source), data);
}

async function rasterizeSvg(source: string, data: ImageConversionData) {
    return new Promise<void>((resolve, reject) => {

        const opts: svg2imgOptions = {
            format: data.format as any,
            quality: 100,
            resvg: {
                background: data.background,
            }
        };

        if (data.size) {
            switch (data.size.mode) {
                case 'width':
                    opts.resvg!.fitTo = { mode: 'width', value: data.size.value! };
                    break;
                case 'height':
                    opts.resvg!.fitTo = { mode: 'height', value: data.size.value! };
                    break;
                case 'scale':
                    opts.resvg!.fitTo = { mode: 'zoom', value: data.size.value! };
                    break;
            }
        }

        svg2img(source, opts, async (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                await writeImageBufferToFile(buffer, data);
                resolve();
            }
        });
    });
}

async function writeImageBufferToFile(buffer: Buffer, data: ImageConversionData) {
    const filename = `${data.name}.${data.format}`;
    const path = `./tmp/images/${filename}`;

    await mkdir('./tmp/images', { recursive: true });
    await writeFile(path, buffer);
}

async function readSvg(path: string) {
    return await readFile(path, 'utf8');
}

function replaceCurrentColor(svg: string, color: string) {
    return svg.replace(/currentColor/g, color);
}

async function loadSvgAndSetColor(path: string, color: string) {
    const svg = await readSvg(path);
    return replaceCurrentColor(svg, color);
}

async function loadImagesDataYaml() {
    const data = await readFile('./images.yml', 'utf8');
    return yaml.parse(data);
}

function readSvgSize(svg: string) {
    const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (match) {
        return {
            width: parseInt(match[1]),
            height: parseInt(match[2])
        };
    }
    return readWidthAndHeightOfSvg(svg);
}

function readWidthAndHeightOfSvg(svg: string) {
    const match = svg.match(/width="(\d+)" height="(\d+)"/);
    if (match) {
        return {
            width: parseInt(match[1]),
            height: parseInt(match[2])
        };
    }
    return undefined;
}

function setSvgSize(svg: string, width: number, height: number) {
    return svg.replace(/width="(\d+)" height="(\d+)"/, `width="${width}" height="${height}"`);
}

(async () => {
    await convertImages();
})();