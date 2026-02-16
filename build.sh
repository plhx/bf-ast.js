#!/bin/sh

PKG_DIR="."
LIB_NAME="bf-ast"

npx esbuild "${PKG_DIR}/${LIB_NAME}.js" \
    --bundle \
    --minify \
    --target=es2020 \
    --format=esm \
    --outfile="${PKG_DIR}/${LIB_NAME}.min.js"
