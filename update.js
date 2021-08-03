const fs = require('fs')
const path = require('path')
const { generate } = require('pogo-data-generator')
const englishFallback = require('./static/manual/en.json')

module.exports.update = async function update() {
  const { translations } = await generate({
    template: {
      globalOptions: {
        includeProtos: true,
      },
      translations: {
        enabled: true,
        options: {
          prefix: {
            pokemon: 'poke_',
            forms: 'form_',
            costumes: 'costume_',
            alignment: 'alignment_',
            evolutions: 'evo_',
            descriptions: 'desc_',
            moves: 'move_',
            items: 'item_',
            weather: 'weather_',
            types: 'poke_type_',
            characters: 'grunt_',
            characterCategory: 'character_category_',
            lures: 'lure_',
            throwTypes: 'throw_type_'
          },
          mergeCategories: true,
          masterfileLocale: 'en',
        },
        locales: {
          de: true,
          en: true,
          es: true,
          fr: true,
          it: true,
          ja: true,
          ko: true,
          'pt-br': true,
          ru: true,
          th: true,
          'zh-tw': true
        },
        template: {
          pokemon: {
            names: true,
            forms: true,
            descriptions: true
          },
          moves: true,
          items: true,
          types: true,
          characters: true,
          weather: true,
          misc: true
        }
      },
    }
  })

  const pogoLocalesFolder = path.resolve(__dirname, './static/manual')
  fs.readdir(pogoLocalesFolder, (err, files) => {
    files.forEach(file => {
      const short = path.basename(file, '.json')
      const safe = translations[short] ? short : 'en'
      const pogoTranslations = fs.readFileSync(
        path.resolve(pogoLocalesFolder, file),
        { encoding: 'utf8', flag: 'r' },
      )
      const manualKeys = JSON.parse(pogoTranslations.toString())
      const sortedObj = {}
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
      const sortedKeys = [...Object.keys(translations[safe]), ...Object.keys(englishFallback)].sort(collator.compare)

      sortedKeys.forEach(key => {
        sortedObj[key] = translations[safe][key] || englishFallback[key]
      })

      const final = {
        ...sortedObj,
        ...manualKeys,
      }
      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/locales'), file),
        JSON.stringify(final, null, 2),
        'utf8',
        () => { },
      )
    })
  })
}
