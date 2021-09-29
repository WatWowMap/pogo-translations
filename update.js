const fs = require('fs')
const path = require('path')
const { generate } = require('pogo-data-generator')

const primary = require('./templates/primary.json')
const enManualFallback = require('./static/manual/en.json')

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
        ...enManualFallback,
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

  const categories = [
    { file: 'characterCategories', prefix: 'character_category_' },
    { file: 'costumes', prefix: 'costume_' },
    { file: 'descriptions', prefix: 'desc' },
    { file: 'evolutionQuests', prefix: 'challenge_buddy_affection_plural' },
    { file: 'evolutionQuests', prefix: 'challenge_buddy_treat_plural' },
    { file: 'evolutionQuests', prefix: 'quest_buddy_walk_km_plural' },
    { file: 'evolutionQuests', prefix: 'quest_catch_type_dark_plural' },
    { file: 'evolutionQuests', prefix: 'quest_catch_type_poison_plural' },
    { file: 'evolutionQuests', prefix: 'quest_catch_type_psychic_plural' },
    { file: 'evolutionQuests', prefix: 'quest_incense_singular' },
    { file: 'evolutionQuests', prefix: 'quest_land_excellent_plural' },
    { file: 'evolutionQuests', prefix: 'quest_win_raid_plural' },
    { file: 'misc', prefix: 'alignment_' },
    { file: 'misc', prefix: 'alola' },
    { file: 'misc', prefix: 'evo_' },
    { file: 'misc', prefix: 'gender_' },
    { file: 'misc', prefix: 'mythical' },
    { file: 'misc', prefix: 'legendary' },
    { file: 'misc', prefix: 'team_' },
    { file: 'misc', prefix: 'throw_' },
    { file: 'forms', prefix: 'form_' },
    { file: 'grunts', prefix: 'grunt_' },
    { file: 'items', prefix: 'item_' },
    { file: 'lures', prefix: 'lure_' },
    { file: 'moves', prefix: 'move_' },
    { file: 'types', prefix: 'poke_type_' },
    { file: 'pokemon', prefix: 'poke_' },
    { file: 'pokemonCategories', prefix: 'pokemon_category_' },
    { file: 'questConditions', prefix: 'quest_condition_' },
    { file: 'questRewardTypes', prefix: 'quest_reward_' },
    { file: 'questTypes', prefix: 'quest_' },
    { file: 'weather', prefix: 'weather_' },
  ]

  const enFallback = JSON.parse(fs.readFileSync(path.resolve(path.resolve(__dirname, './static/locales/en.json'))))

  available.forEach(locale => {
    const localeRef = JSON.parse(fs.readFileSync(path.resolve(path.resolve(__dirname, './static/locales', locale))))
    const languageRef = {}
    const mergedRef = {}
    categories.forEach(category => {
      if (!languageRef[category.file]) {
        languageRef[category.file] = {}
      }
      Object.keys(localeRef).forEach(key => {
        if (key.startsWith(category.prefix)
          && (category.prefix === 'poke_' ? !key.startsWith('poke_type') : true)
          && key !== 'form_133') {
          let value = localeRef[key]
          let enValue = enFallback[key]
          if (value.includes('%{')) {
            value = value
              .replace(/%\{/g, '{{')
              .replace(/\}/g, '}}')
            enValue = enValue
              .replace(/%\{/g, '{{')
              .replace(/\}/g, '}}')
          }
          languageRef[category.file][enValue] = value
          mergedRef[enValue] = value
        }
      })
    })
    Object.keys(languageRef).forEach(category => {
      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/englishRef'), `${category}_${locale}`),
        JSON.stringify(languageRef[category], null, 2),
        'utf8',
        () => { },
      )
    })
    fs.writeFile(
      path.resolve(path.resolve(__dirname, './static/enRefMerged'), locale),
      JSON.stringify(mergedRef, null, 2),
      'utf8',
      () => { },
    )
  })
}
