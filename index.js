const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const inputDir = path.join(__dirname, 'input')
const outputDir = path.join(__dirname, 'output')

if (!fs.existsSync(inputDir)) {
	console.error('No input dir found')

	return
}

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir)
}

fs.readdir(inputDir, (err, files) => {
	if (err) {
		console.error('Error reading input directory:', err)
		return
	}

	if (files.length === 0) {
		console.error('No input(s) found')

		return
	}

	// ? edit here
	const targetSizeReductionPercent = 90
	const targetQuality = 15

	// ? process
	files.forEach((file) => {
		const inputFilePath = path.join(inputDir, file)
		const originalSize = fs.statSync(inputFilePath).size
		const outputFilePath = path.join(outputDir, file.toLowerCase())

		sharp(inputFilePath)
			.metadata()
			.then((metadata) => {
				const scalingFactor = Math.sqrt(1 - targetSizeReductionPercent / 100)
				const newWidth = Math.floor(metadata.width * scalingFactor)

				return sharp(inputFilePath).resize(newWidth).jpeg({ quality: targetQuality }).toBuffer()
			})
			.then((data) => {
				fs.writeFile(outputFilePath, data, (err) => {
					if (err) {
						console.error('Error saving compressed image:', err)
						return
					}
					const newSize = fs.statSync(outputFilePath).size
					console.log(`Original Size: ${originalSize} bytes`)
					console.log(`New Size: ${newSize} bytes (${((1 - newSize / originalSize) * 100).toFixed(2)}% reduction)`)
				})
			})
			.catch((err) => {
				console.error('Error during image processing:', err)
			})
	})
})
