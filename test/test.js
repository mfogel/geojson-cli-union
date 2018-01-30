/* eslint-env jest */

const stream = require('stream')
const toString = require('stream-to-string')
const { UnionTransform } = require('../src/index.js')

describe('errors and warnings on bad input', () => {
  const notJsonStr = 'not-json'

  const jsonButNotGeojson = {
    a: 'json object',
    but: 'has no coordinates'
  }

  const point = {
    type: 'Point',
    coordinates: [0, 0]
  }

  const polygon = {
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
  }

  test('error on invalid json input', () => {
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()

    const tracker = jest.fn()
    const onError = () => {
      tracker()
      streamOut.end() // error doesn't propogate, must close final stream explicitly
    }

    transform.on('error', onError)
    transform.pipe(streamOut)
    transform.write(notJsonStr)
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(tracker).toHaveBeenCalled()
    })
  })

  test('error on input valid json but no polygon coordinates to operate', () => {
    const warn = jest.fn()
    const transform = new UnionTransform({ warn })
    const streamOut = stream.PassThrough()

    const tracker = jest.fn()
    const onError = () => {
      tracker()
      streamOut.end() // error doesn't propogate, must close final stream explicitly
    }

    transform.on('error', onError)
    transform.pipe(streamOut)
    transform.write(JSON.stringify(jsonButNotGeojson))
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(tracker).toHaveBeenCalled()
    })
  })

  test('warn on non multipolygon/polygon geometries input', () => {
    const warn = jest.fn()
    const transform = new UnionTransform({ warn })
    const streamOut = stream.PassThrough()

    transform.pipe(streamOut)
    transform.write(JSON.stringify(point))
    transform.write(JSON.stringify(polygon))
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(warn).toHaveBeenCalled()
    })
  })
})

describe('json streaming', () => {
  const polygon = {
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
  }

  test('stream in one chunk', () => {
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()

    transform.pipe(streamOut)
    transform.write(JSON.stringify(polygon))
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(JSON.parse(str)).toEqual(polygon)
    })
  })

  test('stream in awkward chunks', () => {
    const strIn = JSON.stringify(polygon)
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()

    transform.pipe(streamOut)
    // feed the str in in 50 char increments
    for (let i = 0; i <= strIn.length; i += 50) {
      transform.write(strIn.substr(i, 50))
    }
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(JSON.parse(str)).toEqual(polygon)
    })
  })

  test('no delimiter between geojson objects', () => {
    const strIn = JSON.stringify(polygon)
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()

    transform.pipe(streamOut)
    for (let i = 0; i < 3; i++) transform.write(strIn)
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(JSON.parse(str)).toEqual(polygon)
    })
  })

  test('whitespace and newline delimiter between geojson objects', () => {
    const strIn = JSON.stringify(polygon)
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()

    transform.pipe(streamOut)
    for (let i = 0; i < 3; i++) {
      transform.write(strIn)
      transform.write('  \n')
    }
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(JSON.parse(str)).toEqual(polygon)
    })
  })
})

describe('different geojson object types', () => {
  const polygon = {
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
  }

  const multipolygon = {
    type: 'MultiPolygon',
    coordinates: [polygon.coordinates]
  }

  const geometrycollectionWithPolygon = {
    type: 'GeometryCollection',
    geometries: [polygon]
  }

  const geometrycollectionWithMultiPolygon = {
    type: 'GeometryCollection',
    geometries: [multipolygon]
  }

  const featureWithPolygon = {
    type: 'Feature',
    properties: {},
    geometry: polygon
  }

  const featureWithMultiPolygon = {
    type: 'Feature',
    properties: {},
    geometry: multipolygon
  }

  const featureCollectionWithPolygon = {
    type: 'FeatureCollection',
    features: [featureWithPolygon]
  }

  const featureCollectionWithMultiPolygon = {
    type: 'FeatureCollection',
    features: [featureWithMultiPolygon]
  }

  const testTargets = {
    polygon,
    multipolygon,
    geometrycollectionWithPolygon,
    geometrycollectionWithMultiPolygon,
    featureWithPolygon,
    featureWithMultiPolygon,
    featureCollectionWithPolygon,
    featureCollectionWithMultiPolygon
  }

  for (const objectType in testTargets) {
    test(objectType, () => {
      const strIn = JSON.stringify(testTargets[objectType])
      const transform = new UnionTransform()
      const streamOut = stream.PassThrough()

      transform.pipe(streamOut)
      transform.write(strIn)
      transform.end()

      expect.assertions(1)
      return toString(streamOut).then(function (str) {
        const jsonOut = JSON.parse(str)
        expect(jsonOut).toEqual(polygon)
      })
    })
  }
})
