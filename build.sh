#!/bin/sh

SRC_DIR="src"
OUT_DIR="."

build() {
    local name="$1"
    local src="${SRC_DIR}/${name}.js"
    local out="${OUT_DIR}/${name}.min.js"

    echo "Building ${src} ..."
    npx esbuild "${src}" \
        --bundle \
        --minify \
        --platform=browser \
        --target=es2020 \
        --format=iife \
        --outfile="${out}"
    echo "Done: ${out} ($(wc -c < "${out}") bytes)"
}

build bf-ast
build bf-ast-jit
