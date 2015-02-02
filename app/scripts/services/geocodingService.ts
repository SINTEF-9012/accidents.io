/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />

/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp').service('geocodingService', function (
	$http: ng.IHttpService) {

	var hereGeocoderEndPoint = "http://geocoder.cit.api.here.com/6.2/geocode.json";
	var hereAppId = "rhiOeCVj2hwMLGF4c4Ib";
	var hereAppCode = "z2R65ZlNkjfRz_9yMb3CIw";

	this.forward = (address: string, callback: (geojson: any) => void) => {
		$http.get(hereGeocoderEndPoint+"?searchtext=" + encodeURIComponent(address) + "&gen=8&app_id=" + hereAppId + "&app_code="+ hereAppCode)
			.success(callback)
			.error(() => callback(null));
	};
});
