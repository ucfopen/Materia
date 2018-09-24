TestWidget : A Materia Widget
============================

TestWidget is built to meet the minimum requirement of an instantiable widget for Materia unit tests

Building The Test Widget
============

Install all dependencies using `yarn`. (you may need to install gulp globally if you haven't)

Build the widget using `yarn run build`

The widget is automatically copied to `fuel/app/tests/widget_packages/`

Make sure to also build test_widget as Materia tests require a minimum of two test widgets to run all unit tests.
