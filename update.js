const fs = require('fs')
const path = require('path')
const { generate } = require('pogo-data-generator')

const primary = require('./templates/primary.json')
const enManualFallback = require('./static/manual/en.json')

const update = async () => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  })
  console.log('Fetching latest locales')

  const { translations } = await generate({
    template: primary,
    // translationApkUrl:
    //   'https://raw.githubusercontent.com/turtiesocks/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_english.json',
  })
  const pogoLocalesFolder = path.resolve(__dirname, './static/manual')

  const inMemory = {}

  fs.readdir(pogoLocalesFolder, (err, files) => {
    files.forEach((file) => {
      console.log(`Starting ${file} merge`)

      const short = path.basename(file, '.json')
      const safe = translations[short] ? short : 'en'
      const manualTranslations = fs.readFileSync(
        path.resolve(pogoLocalesFolder, file),
        { encoding: 'utf8', flag: 'r' }
      )
      const manualKeys = {
        ...enManualFallback,
        ...JSON.parse(manualTranslations.toString()),
      }
      const sortedObj = {}
      const sortedKeys = [
        ...Object.keys(translations[safe]),
        ...Object.keys(manualKeys),
      ].sort(collator.compare)

      sortedKeys.forEach((key) => {
        sortedObj[key] = manualKeys[key] || translations[safe][key]
      })

      inMemory[short] = sortedObj
      console.log(`Writing ${file} locale`)
      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/locales'), file),
        JSON.stringify(sortedObj, null, 2),
        'utf8',
        () => {}
      )
    })
  })

  const available = await fs.promises.readdir(pogoLocalesFolder)
  console.log('Generating latest index')
  fs.writeFile(
    'index.json',
    JSON.stringify(available, null, 2),
    'utf8',
    () => {}
  )
  return { inMemory, available }
}

const enRef = async (inMemory, available) => {
  console.log('Generating locales based on English as the reference now')
  const manualCategories = {
    characterCategories: {},
    costumes: {},
    descriptions: {},
    evolutionQuests: {},
    forms: {},
    grunts: {},
    items: {},
    lures: {},
    misc: {},
    moves: {},
    pokemon: {},
    pokemonCategories: {},
    bonuses: {},
    questConditions: {},
    questRewardTypes: {},
    questTypes: {},
    questTitles: {},
    types: {},
    weather: {},
  }

  if (inMemory.en) {
    Object.entries(inMemory.en).forEach(([key, value]) => {
      if (key.startsWith('poke_type')) {
        manualCategories.types[key] = value
      } else if (key.startsWith('pokemon_category')) {
        manualCategories.pokemonCategories[key] = value
      } else if (key.startsWith('poke')) {
        manualCategories.pokemon[key] = value
      } else if (key.startsWith('form')) {
        manualCategories.forms[key] = value
      } else if (key.startsWith('costume')) {
        manualCategories.costumes[key] = value
      } else if (key.startsWith('quest_') || key.startsWith('challenge_')) {
        const newValue =
          value && value.includes('%{')
            ? value.replace(/%\{/g, '{{').replace(/\}/g, '}}')
            : value
        if (key.startsWith('quest_condition_')) {
          manualCategories.questConditions[key] = newValue
        } else if (key.startsWith('quest_reward_')) {
          manualCategories.questRewardTypes[key] = newValue
        } else if (key.startsWith('quest_title_')) {
          manualCategories.questTitles[key] = newValue
        } else if (key.endsWith('plural') || key.endsWith('singular')) {
          manualCategories.evolutionQuests[key] = newValue
        } else {
          manualCategories.questTypes[key] = newValue
        }
      } else if (key.startsWith('grunt')) {
        manualCategories.grunts[key] = value
      } else if (key.startsWith('character')) {
        manualCategories.characterCategories[key] = value
      } else if (key.startsWith('spawn_')) {
        manualCategories.bonuses[key] = value
      } else if (key.startsWith('weather')) {
        manualCategories.weather[key] = value
      } else if (key.startsWith('desc')) {
        manualCategories.descriptions[key] = value
      } else if (key.startsWith('item')) {
        manualCategories.items[key] = value
      } else if (key.startsWith('lure')) {
        manualCategories.lures[key] = value
      } else if (key.startsWith('move')) {
        manualCategories.moves[key] = value
      } else {
        manualCategories.misc[key] = value
      }
    })

    available.forEach((locale) => {
      const languageRef = {}
      const mergedRef = {}
      const short = locale.replace('.json', '')

      Object.keys(manualCategories).forEach((category) => {
        languageRef[category] = {}

        Object.entries(manualCategories[category]).forEach(([key, value]) => {
          if (key !== 'form_133') {
            let localeValue = inMemory[short][key]
            if (localeValue && localeValue.includes('%{')) {
              localeValue = localeValue
                .replace(/%\{/g, '{{')
                .replace(/\}/g, '}}')
            }
            languageRef[category][value] = localeValue
            mergedRef[value] = localeValue
          }
        })
        fs.writeFile(
          path.resolve(
            path.resolve(__dirname, './static/englishRef'),
            `${category}_${locale}`
          ),
          JSON.stringify(languageRef[category], null, 2),
          'utf8',
          () => {}
        )
      })

      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/enRefMerged'), locale),
        JSON.stringify(mergedRef, null, 2),
        'utf8',
        () => {}
      )
    })
  }
}

module.exports.update = update
module.exports.enRef = enRef

if (require.main === module) {
  update()
    .then(async ({ inMemory, available }) => enRef(inMemory, available))
    .then(() => console.log('Translations generated'))
}
