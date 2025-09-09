#!/bin/bash
 
PROJECT="arc"
TARGET="x86_64-unknown-linux-musl"
PLATFORM="x86_64-linux"
DIST="./target/$TARGET/release"

# build release for target
cargo b --bin $PROJECT --target=$TARGET -r

# build web dist
cd web; npm run build; cd ..

tar -czf $PROJECT-$PLATFORM.tar.gz ./conf ./dist -C $DIST $PROJECT 


