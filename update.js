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
    JSON.stringify(await fs.promises.readdir(pogoLocalesFolder), null, 2),
    'utf8',
    () => { },
  )

  console.log('Generating locales based on English as the reference now')
  const { translations: poracleTranslations } = await generate({ template: poracle })

  Object.keys(poracleTranslations).forEach(locale => {
    Object.keys(poracleTranslations[locale]).forEach(category => {
      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/englishRef'), `${category}_${locale}.json`),
        JSON.stringify(poracleTranslations[locale][category], null, 2),
        'utf8',
        () => { },
      )
    })
  })
}
