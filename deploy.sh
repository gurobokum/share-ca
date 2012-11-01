echo "> Deploy"

cp -Rv ff/* temp
find temp -iname ".*" | xargs rm -rv 

echo "> Override settings.json"
cp configs/settings.json temp/chrome/content/

echo "> Generate xpi"
cd temp 
zip -r ~/Projects/shareit/share-ca.xpi .
cd ..

echo "> Remove temp"
rm -rfv temp/*

echo "> Done"

