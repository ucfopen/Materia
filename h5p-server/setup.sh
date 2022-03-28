curl -o h5p.zip https://codeload.github.com/h5p/h5p-php-library/zip/1.24.0
unzip h5p.zip
(cd h5p-php-library-1.24.0 && tar c .) | (cd h5p/core && tar xfk -)
rm -rf h5p.zip h5p-php-library-1.24.0

curl -o editor.zip https://codeload.github.com/h5p/h5p-editor-php-library/zip/1.24.0
unzip editor.zip
(cd h5p-editor-php-library-1.24.0 && tar c .) | (cd h5p/editor && tar xfk -)
rm -rf editor.zip h5p-editor-php-library-1.24.0

curl -o libraries.zip https://h5p.org/sites/default/files/h5p/exports/interactive-video-2-618.h5p
unzip -n libraries.zip -d h5p/libraries/
rm -rf libraries.zip 

curl -o libraries.zip https://h5p.org/sites/default/files/h5p/exports/question-set-616.h5p
unzip -n libraries.zip -d h5p/libraries/
rm -rf libraries.zip