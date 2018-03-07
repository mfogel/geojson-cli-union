## Deprecated: Please use [geojson-clipping](https://github.com/mfogel/geojson-clipping) instead.

# geojson-cli-union

Union/dissolve Polygons & MultiPolygons in your GeoJSON files into each other.

[![npm version](https://img.shields.io/npm/v/geojson-cli-union.svg)](https://www.npmjs.com/package/geojson-cli-union)
[![build status](https://img.shields.io/travis/mfogel/geojson-cli-union.svg)](https://travis-ci.org/mfogel/geojson-cli-union)
[![test coverage](https://img.shields.io/coveralls/mfogel/geojson-cli-union/master.svg)](https://coveralls.io/r/mfogel/geojson-cli-union)

## Quickstart

```sh
$ npm install -g geojson-cli-union
$ cat some-polys.geojson some-multipolys.geojson | geojson-cli-union > a-poly-or-multipoly.geojson
```

## Usage

One or more GeoJSON objects containing Polygons and/or MultiPolygons are expected via `stdin`. The following geojson types are all ok:

 * Polygon
 * MultiPolygon
 * GeometryCollection of Polygons and/or MultiPolygons
 * Feature of a Polygon, a MultiPolygon, or an acceptable GeometryCollection
 * FeatureCollection of acceptable Features

If a geojson object with a differnt type is encountered (ex: a Point) a warning will be printed to `stderr` and the offending object will be dropped.

The geojson objects consumed on stdin may be seperated by zero or more characters of whitespace.

The union of the given Polygons and MultiPolygons will be calculated (sometimes called a *dissolve* operation) and the result will be written to `stdout` as a geojson object of type either:

 * a Polygon
 * a MultiPolygon containing non-overlapping Polygons

## Options

### `-s` / `--silent`

Send any warnings (normally written to `stderr`) straight to `/dev/null`.

## Changelog

### 0.2

* Use [polygon-clipping](https://www.npmjs.com/package/polygon-clipping) as backend

### 0.1.2

* Set up CI: travis, coveralls

### 0.1.1

* Add missing package

### 0.1

* Initial release
