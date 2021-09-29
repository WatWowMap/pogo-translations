const fs = require('fs')
const path = require('path')
const { generate } = require('pogo-data-generator')

const primary = require('./templates/primary.json')
const poracle = require('./templates/poracle.json')
const englishFallback = require('./static/manual/en.json')

module.exports.update = async function update() {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  console.log('Fetching latest locales')

  const { translations } = await generate({ template: primary })

  const pogoLocalesFolder = path.resolve(__dirname, './static/manual')
  const available = await fs.promises.readdir(pogoLocalesFolder)

  fs.readdir(pogoLocalesFolder, (err, files) => {
    files.forEach(file => {
      console.log(`Starting ${file} merge`)

      const short = path.basename(file, '.json')
      const safe = translations[short] ? short : 'en'
      const manualTranslations = fs.readFileSync(
        path.resolve(pogoLocalesFolder, file),
        { encoding: 'utf8', flag: 'r' },
      )
      const manualKeys = {
        ...englishFallback,
        ...JSON.parse(manualTranslations.toString()),
      }
      const sortedObj = {}
      const sortedKeys = [...Object.keys(translations[safe]), ...Object.keys(manualKeys)].sort(collator.compare)

      sortedKeys.forEach(key => {
        sortedObj[key] = manualKeys[key] || translations[safe][key]
      })

      console.log(`Writing ${file} locale`)
      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/locales'), file),
        JSON.stringify(sortedObj, null, 2),
        'utf8',
        () => { },
      )
    })
  })

  console.log('Generating latest index')
  fs.writeFile(
    'index.json',
    JSON.stringify(available, null, 2),
    'utf8',
    () => { },
  )

  console.log('Generating locales based on English as the reference now')
  const { translations: poracleTranslations } = await generate({ template: poracle })

  available.forEach(locale => {
    const safeLocale = poracleTranslations[locale.replace('.json', '')] || poracleTranslations.en
    Object.keys(safeLocale).forEach(category => {
      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/englishRef'), `${category}_${locale}`),
        JSON.stringify(safeLocale[category], null, 2),
        'utf8',
        () => { },
      )
    })
  })
}
