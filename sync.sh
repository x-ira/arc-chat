#!/bin/bash
 
PROJECT="arc"
TARGET="x86_64-unknown-linux-musl"
APP="./target/$TARGET/release/$PROJECT"

# build release for target
cargo b --bin $PROJECT --target=$TARGET -r

# build web dist
cd web; npm run build; cd ..

# sync to server
rsync -vzrtopg -e "ssh -p 22"  --exclude=.DS_Store \
   $APP ./dist $1:~/apps/arc --delete
