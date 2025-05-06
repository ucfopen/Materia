# Theming Materia

Materia provides plenty of ways to tailor the web app to your institution's needs. Theming ranges from simple
adjustments of links, emails, and images, to overriding entire pages and React components.

All theming will be done within the `theme` folder of your Materia install (where this README is located). Most changes
to the theme also will require you to rebuild the frontend using webpack. Instructions to do so are located
[below](#once-finished-test-and-deploy)

> [!NOTE]
> As is with theming most things, it is not guaranteed that your theme will remain intact after upgrading Materia to a
> new version. New features may introduce unthemed components into your Materia install, and changes may make your
> customizations incompatible. Please be sure to read the changelogs to see if there are changes required to your theme,
> and always test your theme before deploying.

---

The following methods for theming Materia are listed from _simplest_ to _most powerful_.

## 1. Common links, emails, etc. (Highly recommended)

Items such as specific emails, links, and phone numbers for your institution can be listed in many areas on Materia's
webpages. To easily modify these, check out `theme/common.json`. This file will be present with a set of placeholders.

Once done, [test and rebuild your frontend](#once-finished-test-and-deploy).

## 2. Logos and other images

Certain institution-specific logos and images may appear on various pages in Materia.

1. Find the image you'd like to replace in `public/img/`. Take note of its name and location.
2. Create an image of the same name and folder structure in `theme/img/`. For example, if you'd like to override
the file located at `public/img/logos/my_logo.png`, then create your custom image at `theme/img/logos/my_logo.png`.

TODO this is prolly a different process if you're hosting images and what not on a CDN

For this customization, any changes you make are applied immediately. No need to restart the server or rebuild the
frontend.

## 3. Paragraphs, wording, and other blurbs of text

Materia uses [MDX](https://mdxjs.com/) to abstract out many blurbs of text that you might want to modify, such as many
of the paragraphs found on the help page. MDX is both simple and powerful - you can treat it as a simple text or
markdown file, or if you'd like, you can also insert HTML, Javascript/JSX, and even React components. If you'd like to
learn more about MDX, check out their [docs](https://mdxjs.com/docs/what-is-mdx/). If not, you're safe to treat it as a
regular text or markdown file.

1. To get started, first take a look at the folders and files in `src/text/` to find the exact blurb of text you'd like to
modify. The names of folders and files should match closely to what you'd find by browsing the Materia website. Take
note of the name and location of the `.mdx` file you'd like to override.

2. Next, create a `.mdx` file of the same name and folder structure in `theme/text/`. For example, if you want
to modify `src/text/help/home/getting-started.mdx`, create a file in `theme/text/help/home/getting-started.mdx`.
3. You can then edit this file, either creating your own whole custom text, or by pasting and modifying the contents of 
the original file.

> [!TIP]
> You might notice that some `.mdx` files feature `import` statements at the top, most commonly importing `common.json`.
> These imports are a native feature of MDX (they're actually just Javascript imports), and are how we can import common
> links, emails, and related, as specified [above](#1-common-links-emails-etc-highly-recommended). You may choose
> to continue using these imports, or hard-code all info yourself.

Once done, [test and rebuild your frontend](#once-finished-test-and-deploy).

## 4. Custom React components and CSS

Offering the deepest level of customizability, you may choose to override any React component or CSS stylesheet.
Materia's frontend is written using Javascript, React, and SCSS.

1. You should first find which component or stylesheet you'd like to modify in the `src/` folder. Take note of the 
file's name and location.

2. Then, create a file of the same name and folder structure in the `theme/src/` folder. For example, if you'd like to
create a custom component that overrides `src/components/header.jsx`, then create the file
`theme/src/components/header.jsx`.
3. Create your custom React component or stylesheet. Make sure to reference the source code. In the case of stylesheets,
you'd want to make sure to use the same classnames, IDs, etc. For React components, make sure that all props are handled
as expected (where applicable).

> [!NOTE]
> Notice that in the source code, most imports to other Materia files are done with the `@` alias (in SCSS, the syntax
> is `~@`). This alias makes imports easier to read, but more importantly, allows the code to either first import any
> override you have for that file, or fall back to the original source file.
> 
> Similarly, you can also find many imports using the `MateriaText` alias. This alias references the `.mdx` files found
> in your `theme/text/` folder first, then falls back to the original `src/text/` folder.
> Read [above](#3-paragraphs-wording-and-other-blurbs-of-text) to learn more about these files.
> 
> The same applies with the `MateriaCommon` import alias - which points to the first available common.json file
> described [above](#1-common-links-emails-etc-highly-recommended)
> 
> Please make sure to use these aliases. If you have a completely new component that doesn't exist in the source Materia
> code, then you are fine to use relative imports in your `theme/src/` folder.

Once done, [test and rebuild your frontend](#once-finished-test-and-deploy).

---

## Once finished: Test and deploy

Once done, you can preview the changes by running `yarn dev`, and deploy it to production using `yarn build` (TODO prolly wrong and needs more info)



