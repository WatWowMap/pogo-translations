const fs = require('fs')
const Fetch = require('node-fetch')
const path = require('path')
const POGOProtos = require('pogo-protos')

function fetchJson(url) {
  return new Promise(resolve => {
    Fetch(url)
      .then(res => res.json())
      .then(json => resolve(json.data))
  })
}

((async function createLocales() {
  const available = {
    de: 'german',
    en: 'english',
    es: 'spanish',
    fr: 'french',
    it: 'italian',
    jp: 'japanese',
    ko: 'korean',
    'pt-br': 'brazilianportuguese',
    th: 'thai',
    'zh-tw': 'chinesetraditional',
    ru: 'russian',
  }

  const remoteFiles = {}
  await Promise.all(Object.entries(available).map(async language => {
    const [key, value] = language
    remoteFiles[key] = await fetchJson(`https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_${value}.json`)
  }))

  const pogoLocalesFolder = path.resolve(__dirname, './static/manual')
  fs.readdir(pogoLocalesFolder, (err, files) => {
    files.forEach(file => {
      const short = path.basename(file, '.json')
      const safe = remoteFiles[short] ? short : 'en'
      const nativeJson = {}

      for (let i = 0; i < remoteFiles[safe].length; i += 2) {
        nativeJson[remoteFiles[safe][i]] = remoteFiles[safe][i + 1]
      }
      const pokemon = {}
      Object.values(POGOProtos.Rpc.HoloPokemonId).forEach(id => {
        const key = `pokemon_name_${String(id).padStart(4, '0')}`
        if (nativeJson[key]) {
          if (id) {
            pokemon[`poke_${id}`] = nativeJson[key]
          }
        }
      })
      const moves = {}
      Object.values(POGOProtos.Rpc.HoloPokemonMove).forEach(id => {
        const key = `move_name_${String(id).padStart(4, '0')}`
        if (nativeJson[key]) {
          moves[`move_${id}`] = nativeJson[key]
        }
      })
      const items = {}
      Object.entries(POGOProtos.Rpc.Item).forEach(id => {
        const [key, value] = id
        if (nativeJson[`${key.toLowerCase()}_name`]) {
          items[`item_${value}`] = nativeJson[`${key.toLowerCase()}_name`]
        }
      })

      const manualKeys = fs.readFileSync(
        path.resolve(pogoLocalesFolder, file),
        { encoding: 'utf8', flag: 'r' },
      )
      const enBackup = fs.readFileSync(
        path.resolve(pogoLocalesFolder, 'en.json'),
        { encoding: 'utf8', flag: 'r' },
      )

      const final = {
        ...pokemon,
        ...moves,
        ...items,
        ...JSON.parse(enBackup),
        ...JSON.parse(manualKeys),
      }
      fs.writeFile(
        path.resolve(path.resolve(__dirname, './static/locales'), file),
        JSON.stringify(final, null, 2),
        'utf8',
        () => { },
      )
    })
  })
})())
