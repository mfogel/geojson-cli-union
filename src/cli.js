#!/usr/bin/env node

const { exit, stdin, stdout } = require('process')
const { UnionTransform } = require('./index.js')

const onError = err => {
  console.error(`Error: ${err.message}`)
  exit(1)
}

const getWarn = silent => (silent ? () => {} : console.warn)

require('yargs')
  .command(
    '$0',
    'Union/dissolve together Polygons & MultiPolygons from Geojson Objects',
    yargs =>
      yargs.example(
        'cat polys.geojson multipolys.geojson | $0 > a-poly-or-multipoly.geojson'
      ),
    yargs =>
      stdin
        .pipe(new UnionTransform({ warn: getWarn(yargs.silent) }))
        .on('error', onError)
        .pipe(stdout)
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
