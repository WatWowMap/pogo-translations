const fs = require('fs')
const path = require('path')
const { generate } = require('pogo-data-generator')

const englishFallback = require('./static/manual/en.json')

module.exports.update = async function update() {
  console.log('Fetching latest locales')

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
            grunts: 'grunt_',
            gruntsAlt: 'grunt_a_',
            characterCategories: 'character_category_',
            lures: 'lure_',
            throwTypes: 'throw_type_',
            pokemonCategories: 'pokemon_category_',
            questTypes: "quest_",
            questConditions: "quest_condition_",
            questRewardTypes: "quest_reward_",
          },
          mergeCategories: true,
          questVariables: {
            prefix: '%{',
            suffix: '}',
          }
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
          misc: true,
          pokemonCategories: true,
          quests: true,
        }
      },
    }
  })

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
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
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
}
