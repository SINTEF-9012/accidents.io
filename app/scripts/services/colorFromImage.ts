/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />

/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp').service('colorFromImage', function() {
	
	this.whiteOrBlack = (color: string) : string => {
		var match = color.match(/rgb\((\d+),(\d+),(\d+)\)/),
			r = parseInt(match[1]),
			g = parseInt(match[2]),
			b = parseInt(match[3]),

			// lightness (from HSL)
			max = Math.max(r, g, b),
			min = Math.min(r, g, b),
			l = (max + min) / 2;

		return l > 128 ? 'black' : 'white';
	}

	var cache = {};

	this.applyColor = (img: any, callback: (color: string) => void, exclude = false) => {
		var cacheKey = null;
		if (typeof img === 'string') {
			cacheKey = img;
		} else if (img && img.src) {
			cacheKey = img.src;
		}

		if (cacheKey && cache.hasOwnProperty(cacheKey)) {
			callback(cache[cacheKey]);
			return;
		}

		RGBaster.colors(img, {
			paletteSize: 3,
			exclude: exclude ? ['rgb(255,255,255)'] : undefined,
			success: (e) => {
				cache[cacheKey] = e.dominant;
				callback(e.dominant);
			}
		});
	};

	this.hasCache = (img: any): boolean => {
		var cacheKey = null;
		if (typeof img === 'string') {
			cacheKey = img;
		} else if (img && img.src) {
			cacheKey = img.src;
		}

		return (cacheKey && cache.hasOwnProperty(cacheKey));
	};

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
