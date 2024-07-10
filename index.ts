import fs from 'fs'
import path from 'path'
import sharp, { type Sharp } from 'sharp'
import { rimrafSync } from 'rimraf'
import chalk from 'chalk'

const inputDir = path.join(__dirname, 'input')
const outputDir = path.join(__dirname, 'output')

// ? validate `input` dir existence
if (!fs.existsSync(inputDir)) {
	console.error('No input dir found')
	process.exit(0)
}

// ? create `output` dir if its not existed
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir)
}

// ? cleanup `output` dir
rimrafSync(outputDir + '/*', { glob: true })

fs.readdir(inputDir, (err, files) => {
	if (err) {
		console.error('Error reading input directory:', err)
		return
	}

	if (files.length === 0) {
		console.error('No input(s) found')

		return
	}

	const supportedInputExtensions = [
		'.jpg',
		'.jpeg',
		'.png',
		'.webp',
		'.tiff',
		'.tif',
		'.gif',
		'.svg',
		'.heic',
		'.heif',
		'.avif',
		'.pdf',
	]

	// ? edit here
	const target: Configuration[] = [
		{ outputFormat: 'jpg', outputName: 'low-res', outputQuality: 10, sizeReductionPercent: 90 },
		{ outputFormat: 'jpg', outputName: 'high-res', outputQuality: 75, sizeReductionPercent: 90 },
		{ outputFormat: 'webp', outputName: 'full-res', outputQuality: 92, sizeReductionPercent: 90 },
	]

	// ? process
	files
		.filter((file) => supportedInputExtensions.includes(path.extname(file).toLowerCase()))
		.forEach((fileName) => {
			const inputFilePath = path.join(inputDir, fileName)
			const originalSize = fs.statSync(inputFilePath).size

			sharp(inputFilePath)
				.metadata()
				.then(async (metadata) => {
					for (const { outputName, outputFormat, outputQuality, sizeReductionPercent } of target) {
						const scalingFactor = Math.sqrt(1 - sizeReductionPercent / 100)
						const newWidth = Math.floor((metadata.width ?? 0) * scalingFactor)
						const resized = sharp(inputFilePath).resize(newWidth)
						const buffer = await processFile(resized, outputFormat, { quality: outputQuality })
						const outputFileName = (outputName ?? fileName.substring(0, fileName.lastIndexOf('.'))) + '.' + outputFormat
						const outputFilePath = path.join(outputDir, outputFileName)

						fs.writeFile(outputFilePath, buffer, (err) => {
							if (err) {
								console.error('Error saving compressed image:', err)
								return
							}

							const newSize = fs.statSync(outputFilePath).size
							console.log(
								`[${fileName}] (${formatBytes(originalSize)})`,
								'=>',
								`[${chalk.blueBright(outputFileName)}]`,
								`(${chalk.greenBright(formatBytes(newSize))})`,
								'-',
								chalk.cyanBright(`${((1 - newSize / originalSize) * 100).toFixed(2)}% reduction`),
							)
						})
					}
				})
				.catch((err) => {
					console.error('Error during image processing:', err)
				})
		})
})

type OutputFormat = 'jpg' | 'png' | 'webp' | 'tiff' | 'heif' | 'avif'
type Configuration = {
	outputFormat: OutputFormat
	outputName?: string
	/** 0-100 */
	outputQuality: number
	/** 0-100 */
	sizeReductionPercent: number
}

function processFile(input: Sharp, processor: OutputFormat, options?: { quality: number }) {
	if (processor === 'png') return input.png({ ...options }).toBuffer()
	if (processor === 'webp') return input.webp({ ...options }).toBuffer()
	if (processor === 'tiff') return input.tiff({ ...options }).toBuffer()
	if (processor === 'heif') return input.heif({ ...options }).toBuffer()
	if (processor === 'avif') return input.avif({ ...options }).toBuffer()
	return input.jpeg({ ...options }).toBuffer()
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return bytes + ' B'
	} else if (bytes < 1024 * 1024) {
		return (bytes / 1024).toFixed(2) + ' KB'
	} else {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
	}
}
