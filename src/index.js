const { Transform } = require('stream')
const geojsonhint = require('@mapbox/geojsonhint')

class UnionTransform extends Transform {
  constructor (options = {}) {
    const warn = options['warn']
    delete options['warn']

    options['decodeStrings'] = false
    super(options)

    this.input = ''
    this.warn = warn
  }

  _transform (chunk, encoding, callback) {
    this.input += chunk
    callback()
  }

  _flush (callback) {
    try {
      let geojson = this.parse(this.input, 'stdin')
      geojson = this.operate(geojson)
      callback(null, JSON.stringify(geojson))
    } catch (err) {
      callback(err)
    }
  }

  parse (str, from) {
    let geojson
    try {
      geojson = JSON.parse(str)
    } catch (err) {
      throw new SyntaxError(`Unable to parse JSON from ${from}: ${err.message}`)
    }

    const errors = geojsonhint.hint(geojson)
    errors.forEach(e =>
      this.warn(`Warning: JSON from ${from} is not valid GeoJSON: ${e.message}`)
    )

    return geojson
  }

  operate (geojson) {
    /* pass through for testing */
    return geojson
  }
}

module.exports = { UnionTransform }
