#!/bin/sh

PKG_DIR="."
LIB_NAME="bf-ast"
LIB_JIT_NAME="bf-ast-jit"

npx esbuild "${PKG_DIR}/${LIB_NAME}.js" \
    --bundle \
    --minify \
    --target=es2020 \
    --format=esm \
    --outfile="${PKG_DIR}/${LIB_NAME}.min.js"

npx esbuild "${PKG_DIR}/${LIB_JIT_NAME}.js" \
    --bundle \
    --minify \
    --target=es2020 \
    --format=esm \
    --outfile="${PKG_DIR}/${LIB_JIT_NAME}.min.js"
