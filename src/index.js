const JSONStream = require('JSONStream')
const { Transform } = require('stream')

class UnionTransform extends Transform {
  constructor (options = {}) {
    const warn = options['warn']
    delete options['warn']

    options['decodeStrings'] = false
    super(options)

    this.warn = warn
    this.reducedCoords = null
    this.jsonStream = JSONStream.parse([{ recurse: true }, 'coordinates'])

    const getCoordType = coords => {
      if (typeof coords[0] === 'number') return 'Point'
      if (typeof coords[0][0] === 'number') return 'LineString'
      if (typeof coords[0][0][0] === 'number') return 'Polygon'
      if (typeof coords[0][0][0][0] === 'number') return 'MultiPolygon'
      throw new Error(`Unrecognized coordinates: ${coords}`)
    }

    this.jsonStream.on('data', coords => {
      const coordType = getCoordType(coords)

      let multiPolyCoords
      if (coordType === 'Polygon') multiPolyCoords = [coords]
      else if (coordType === 'MultiPolygon') multiPolyCoords = coords
      else {
        this.warn(`Geojson ${coordType} object encountered. Dropping.`)
        return
      }

      multiPolyCoords.forEach(polycoords => {
        if (this.reducedCoords === null) this.reducedCoords = polycoords
        else {
          // TODO: do the union thing to reduce the coords
        }
      })
    })
  }

  _transform (chunk, encoding, callback) {
    try {
      this.jsonStream.write(chunk)
      callback()
    } catch (err) {
      callback(err)
    }
  }

  _flush (callback) {
    if (this.reducedCoords !== null) {
      const result = {
        type: 'Polygon',
        coordinates: this.reducedCoords
      }
      callback(null, JSON.stringify(result))
    } else {
      callback(new Error('No polygons or multipolygons found to operate on'))
    }
  }
}

module.exports = { UnionTransform }
