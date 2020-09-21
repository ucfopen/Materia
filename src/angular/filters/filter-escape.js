const app = angular.module('materia')
app.filter('escape', () => window.encodeURIComponent)
