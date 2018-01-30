/* eslint-env jest */

const fs = require('fs')
const stream = require('stream')
const toString = require('stream-to-string')
const { UnionTransform } = require('../src/index.js')

// const GeojsonEquality = require('geojson-equality')
// const geojsonEq = new GeojsonEquality()

const getStream = fn => fs.createReadStream('test/fixtures/' + fn, 'utf8')
const getStr = fn => fs.readFileSync('test/fixtures/' + fn, 'utf8')
const getJson = fn => JSON.parse(getStr(fn))

describe('errors and warnings on bad input', () => {
  test('error on invalid json input', () => {
    const streamIn = getStream('not-json')
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()

    const tracker = jest.fn()
    const onError = () => {
      tracker()
      streamOut.end() // error doesn't propogate, must close final stream explicitly
    }

    streamIn
      .pipe(transform)
      .on('error', onError)
      .pipe(streamOut)

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(tracker).toHaveBeenCalled()
    })
  })

  test('warn on valid json but invalid geojson input', () => {
    const streamIn = getStream('json-but-not-geojson.json')
    const warn = jest.fn()
    const transform = new UnionTransform({ warn })
    const streamOut = stream.PassThrough()
    streamIn.pipe(transform).pipe(streamOut)

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(warn).toHaveBeenCalled()
    })
  })

  test('warn on non multipolygon/polygon geometries input', () => {
    const streamIn = getStream('point-origin.geojson')
    const warn = jest.fn()
    const transform = new UnionTransform({ warn })
    const streamOut = stream.PassThrough()
    streamIn.pipe(transform).pipe(streamOut)

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      expect(warn).toHaveBeenCalled()
    })
  })
})

describe('json streaming', () => {
  test('stream in one chunk', () => {
    const streamIn = getStream('polygon-20x20.geojson')
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()
    streamIn.pipe(transform).pipe(streamOut)

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      const jsonOut = JSON.parse(str)
      const jsonExp = getJson('polygon-20x20.geojson')
      expect(jsonOut).toEqual(jsonExp)
    })
  })

  test('stream in awkward chunks', () => {
    const strIn = getStr('polygon-20x20.geojson')
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
      const jsonOut = JSON.parse(str)
      const jsonExp = getJson('polygon-20x20.geojson')
      expect(jsonOut).toEqual(jsonExp)
    })
  })

  test('no delimiter between geojson objects', () => {
    const strIn = getStr('polygon-20x20.geojson')
    const transform = new UnionTransform()
    const streamOut = stream.PassThrough()
    transform.pipe(streamOut)

    for (let i = 0; i < 3; i++) transform.write(strIn)
    transform.end()

    expect.assertions(1)
    return toString(streamOut).then(function (str) {
      const jsonOut = JSON.parse(str)
      const jsonExp = getJson('polygon-20x20.geojson')
      expect(jsonOut).toEqual(jsonExp)
    })
  })

  test('whitespace and newline delimiter between geojson objects', () => {
    const strIn = getStr('polygon-20x20.geojson')
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
      const jsonOut = JSON.parse(str)
      const jsonExp = getJson('polygon-20x20.geojson')
      expect(jsonOut).toEqual(jsonExp)
    })
  })
})
