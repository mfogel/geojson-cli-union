#!/usr/bin/env node

const { stdin, exit } = require('process')
const { explode, explodeOptsDefaults } = require('./index.js')

const onError = err => {
  console.error(`Error: ${err.message}`)
  exit(1)
}

const getWarn = silent => (silent ? () => {} : explodeOptsDefaults.warn)

require('yargs')
  .command(
    '$0',
    'Union/dissolve together Polygons & MultiPolygons from Geojson Objects',
    yargs =>
      yargs.example(
        'cat polys.geojson multipolys.geojson | $0 > a-poly-or-multipoly.geojson'
      ),
    yargs => explode(stdin, { warn: getWarn(yargs.silent) }).catch(onError)
  )
  .option('s', {
    alias: 'silent',
    describe: 'Do not write warnings to stderr',
    boolean: true
  })
  .alias('h', 'help')
  .alias('v', 'version')
  .strict()
  .parse()
