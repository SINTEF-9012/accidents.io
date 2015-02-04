/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />

/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp').service('colorFromImage', function() {

	this.colorFromId = (id: string): {background: string; foreground: string} => {
		var hash = 0;
		for (var i = 0, l = id.length; i < l; ++i) {
			var code = id.charCodeAt(i);
			hash = ((hash << 5) - hash) + code;
			hash = hash & hash;
		}

		var hue = Math.abs(hash % 360);
		var sat = 27 + ((hash >> 2) & 63);
		var lum = 42 + ((hash >> 4) & 31);

		return {
			background: "hsl(" + hue + "," + sat + "%," + lum + "%)",
			foreground: lum > 60 ? "black" : "white"
		};
	};
});
