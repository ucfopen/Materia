curl -o h5p.zip https://codeload.github.com/h5p/h5p-php-library/zip/1.24.0
unzip h5p.zip
(cd h5p-php-library-1.24.0 && tar c .) | (cd h5p/core && tar xf -)
rm -rf h5p.zip h5p-php-library-1.24.0

curl -o editor.zip https://codeload.github.com/h5p/h5p-editor-php-library/zip/1.24.0
unzip editor.zip
(cd h5p-editor-php-library-1.24.0 && tar c .) | (cd h5p/editor && tar xf -)
rm -rf editor.zip h5p-editor-php-library-1.24.0

